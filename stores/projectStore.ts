/**
 * Store Zustand pour les challenges (projets de lecture) avec Supabase
 * 
 * Fonctionnalités :
 * - Créer un nouveau challenge
 * - Rejoindre un challenge via un code
 * - Charger les challenges de l'utilisateur
 * - Gérer le challenge actuellement sélectionné
 * 
 * Ce store gère la liste des challenges et le challenge actif dans l'UI.
 */

import { create } from 'zustand';
import { Challenge, ChallengeWithParticipants } from '../types/supabase';
import {
  createChallenge,
  getChallengeById,
  getChallengeByInviteCode,
  getUserChallenges,
  joinChallenge as dbJoinChallenge,
  getChallengeWithParticipants,
  updateChallenge,
  deleteChallenge,
  leaveChallenge,
} from '../services/supabase/database';

/**
 * Interface du store de challenges
 */
interface ProjectStore {
  // État
  challenges: Challenge[]; // Liste de tous les challenges de l'utilisateur
  activeChallenge: Challenge | null; // Challenge affiché sur la homepage
  currentChallenge: ChallengeWithParticipants | null; // Challenge actuellement affiché (page détail)
  isLoading: boolean;
  challengesLoading: boolean; // true uniquement pendant loadUserChallenges (pas pollué par les autres actions)
  challengesLoaded: boolean; // true après le premier chargement réussi ou échoué
  error: string | null;

  // Actions - Création
  createChallenge: (
    userId: string,
    bookTitle: string,
    bookAuthor: string | undefined,
    totalPages: number,
    coverUrl?: string,
    targetEndDate?: string
  ) => Promise<Challenge>;

  // Actions - Rejoindre
  joinChallenge: (challengeId: string, userId: string) => Promise<void>;
  joinChallengeByCode: (code: string, userId: string) => Promise<Challenge>;

  // Actions - Chargement
  loadUserChallenges: (userId: string) => Promise<void>;
  loadChallenge: (challengeId: string) => Promise<void>;
  refreshCurrentChallenge: () => Promise<void>;

  // Actions - Sélection
  setActiveChallenge: (challenge: Challenge | null) => void;
  setCurrentChallenge: (challenge: ChallengeWithParticipants | null) => void;

  // Actions - Modification
  updateCurrentChallenge: (updates: Partial<Challenge>) => Promise<void>;
  /** Met à jour le challenge affiché sur la home (activeChallenge) */
  updateActiveChallenge: (updates: Partial<Challenge>) => Promise<void>;
  deleteCurrentChallenge: () => Promise<void>;
  /** Quitte le challenge actif (retire l'utilisateur sans supprimer le challenge) */
  leaveActiveChallenge: (userId: string) => Promise<void>;

  // Actions - Réinitialisation
  reset: () => void;
  setError: (error: string | null) => void;
}

/**
 * Store de challenges Supabase
 * 
 * Gère tous les challenges de l'utilisateur et leurs interactions.
 */
export const useProjectStore = create<ProjectStore>((set, get) => ({
  // ===== État initial =====
  challenges: [],
  activeChallenge: null,
  currentChallenge: null,
  isLoading: false,
  challengesLoading: false,
  challengesLoaded: false,
  error: null,

  // ===== Action : Créer un challenge =====
  /**
   * Créer un nouveau challenge
   * 
   * Process :
   * 1. Crée le challenge dans Supabase
   * 2. Ajoute automatiquement l'utilisateur comme participant
   * 3. Crée la progression initiale
   * 4. Ajoute le challenge à la liste
   * 
   * @param userId - L'ID de l'utilisateur créateur
   * @param bookTitle - Le titre du livre
   * @param bookAuthor - L'auteur du livre (optionnel)
   * @param totalPages - Le nombre total de pages
   * @param coverUrl - L'URL de la couverture (optionnel)
   * @param targetEndDate - La date cible de fin (optionnel)
   * @returns Le challenge créé
   */
  createChallenge: async (
    userId,
    bookTitle,
    bookAuthor,
    totalPages,
    coverUrl,
    targetEndDate
  ) => {
    set({ isLoading: true, error: null });
    try {
      const challenge = await createChallenge({
        admin_id: userId,
        book_title: bookTitle,
        book_author: bookAuthor || null,
        total_pages: totalPages,
        cover_url: coverUrl,
        target_end_date: targetEndDate,
      });

      // Ajouter le challenge à la liste et le définir comme actif
      // (le dernier créé est le plus pertinent à afficher)
      set((state) => ({
        challenges: [challenge, ...state.challenges],
        activeChallenge: challenge,
        isLoading: false,
      }));

      return challenge;
    } catch (error: any) {
      console.error('Create challenge error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ===== Action : Rejoindre un challenge =====
  /**
   * Rejoindre un challenge par son ID
   *
   * Utilisé dans l'onboarding "Rejoindre" quand on a déjà le challengeId
   * (ex: après avoir scanné un QR ou cliqué sur un lien d'invitation).
   *
   * @param challengeId - L'ID du challenge à rejoindre
   * @param userId - L'ID de l'utilisateur qui rejoint
   */
  joinChallenge: async (challengeId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await dbJoinChallenge(challengeId, userId);

      // Récupérer le challenge et l'ajouter à la liste
      const challenge = await getChallengeById(challengeId);
      if (challenge) {
        set((state) => {
          const exists = state.challenges.some((c) => c.id === challenge.id);
          return {
            challenges: exists ? state.challenges : [challenge, ...state.challenges],
            activeChallenge: exists ? state.activeChallenge : challenge,
            isLoading: false,
          };
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error('Join challenge error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Rejoindre un challenge via son code d'invitation
   * 
   * Process :
   * 1. Recherche le challenge par son code
   * 2. Ajoute l'utilisateur comme participant
   * 3. Crée la progression initiale
   * 4. Ajoute le challenge à la liste
   * 
   * @param code - Le code d'invitation (6 caractères)
   * @param userId - L'ID de l'utilisateur qui rejoint
   * @returns Le challenge rejoint
   * @throws Erreur si le code est invalide
   */
  joinChallengeByCode: async (code, userId) => {
    set({ isLoading: true, error: null });
    try {
      // Trouver le challenge par son code
      const challenge = await getChallengeByInviteCode(code);

      if (!challenge) {
        throw new Error('Code d\'invitation invalide');
      }

      // Rejoindre le challenge
      await dbJoinChallenge(challenge.id, userId);

      // Ajouter le challenge à la liste si pas déjà présent
      set((state) => {
        const exists = state.challenges.some((c) => c.id === challenge.id);
        return {
          challenges: exists ? state.challenges : [challenge, ...state.challenges],
          isLoading: false,
        };
      });

      return challenge;
    } catch (error: any) {
      console.error('Join challenge error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ===== Action : Charger les challenges de l'utilisateur =====
  /**
   * Charger tous les challenges auxquels l'utilisateur participe
   * 
   * @param userId - L'ID de l'utilisateur
   */
  loadUserChallenges: async (userId) => {
    set({ challengesLoading: true, error: null });
    try {
      const challenges = await getUserChallenges(userId);

      // Auto-sélectionner le challenge actif :
      // On prend le plus récemment mis à jour (updated_at desc)
      // pour afficher le projet sur lequel l'utilisateur était actif en dernier
      const { activeChallenge } = get();
      let newActive = activeChallenge;

      if (challenges.length > 0) {
        // Si pas de challenge actif, ou s'il n'existe plus dans la liste
        const activeStillExists = activeChallenge && challenges.some(c => c.id === activeChallenge.id);
        if (!activeStillExists) {
          // Trier par updated_at desc pour prendre le plus récent
          const sorted = [...challenges].sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          newActive = sorted[0];
        }
      } else {
        newActive = null;
      }

      set({ challenges, activeChallenge: newActive, challengesLoading: false, challengesLoaded: true });
    } catch (error: any) {
      console.error('Load challenges error:', error);
      set({ error: error.message, challengesLoading: false, challengesLoaded: true });
    }
  },

  // ===== Action : Charger un challenge spécifique =====
  /**
   * Charger un challenge avec tous ses détails et participants
   * 
   * @param challengeId - L'ID du challenge
   */
  loadChallenge: async (challengeId) => {
    set({ isLoading: true, error: null });
    try {
      const challenge = await getChallengeWithParticipants(challengeId);
      set({ currentChallenge: challenge, isLoading: false });
    } catch (error: any) {
      console.error('Load challenge error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // ===== Action : Rafraîchir le challenge actuel =====
  /**
   * Rafraîchir les données du challenge actuellement affiché
   * 
   * Utile après une mise à jour de progression pour voir les nouvelles stats.
   */
  refreshCurrentChallenge: async () => {
    const { currentChallenge } = get();
    if (!currentChallenge) return;

    set({ isLoading: true, error: null });
    try {
      const refreshed = await getChallengeWithParticipants(currentChallenge.id);
      set({ currentChallenge: refreshed, isLoading: false });
    } catch (error: any) {
      console.error('Refresh challenge error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // ===== Action : Définir le challenge actif (homepage) =====
  /**
   * Changer le challenge affiché sur la homepage
   * Appelé quand l'utilisateur sélectionne un autre projet dans le dropdown
   * 
   * @param challenge - Le challenge à afficher, ou null pour réinitialiser
   */
  setActiveChallenge: (challenge) => {
    set({ activeChallenge: challenge });
  },

  // ===== Action : Définir le challenge actuel (page détail) =====
  /**
   * Définir manuellement le challenge actuellement affiché
   * 
   * @param challenge - Le challenge à afficher, ou null pour réinitialiser
   */
  setCurrentChallenge: (challenge) => {
    set({ currentChallenge: challenge });
  },

  // ===== Action : Mettre à jour le challenge =====
  /**
   * Mettre à jour les informations du challenge actuel
   * 
   * Seul l'admin du challenge peut le modifier (vérifié par RLS).
   * 
   * @param updates - Les champs à mettre à jour
   */
  updateCurrentChallenge: async (updates) => {
    const { currentChallenge } = get();
    if (!currentChallenge) {
      throw new Error('Aucun challenge sélectionné');
    }

    set({ isLoading: true, error: null });
    try {
      const updated = await updateChallenge(currentChallenge.id, updates);

      // Mettre à jour dans la liste et le challenge actuel
      set((state) => ({
        challenges: state.challenges.map((c) =>
          c.id === updated.id ? updated : c
        ),
        currentChallenge: state.currentChallenge
          ? { ...state.currentChallenge, ...updated }
          : null,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Update challenge error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /** Met à jour le challenge actif (home). Utilisé pour modifier la deadline, etc. */
  updateActiveChallenge: async (updates) => {
    const { activeChallenge } = get();
    if (!activeChallenge) {
      throw new Error('Aucun challenge actif');
    }

    set({ isLoading: true, error: null });
    try {
      const updated = await updateChallenge(activeChallenge.id, updates);
      set((state) => ({
        challenges: state.challenges.map((c) =>
          c.id === updated.id ? updated : c
        ),
        activeChallenge: state.activeChallenge?.id === updated.id
          ? { ...state.activeChallenge, ...updated }
          : state.activeChallenge,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Update active challenge error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ===== Action : Supprimer le challenge =====
  /**
   * Supprimer le challenge actuel
   * 
   * Seul l'admin du challenge peut le supprimer (vérifié par RLS).
   * Supprime également tous les participants, progressions et historique (cascade).
   */
  deleteCurrentChallenge: async () => {
    const { currentChallenge } = get();
    if (!currentChallenge) {
      throw new Error('Aucun challenge sélectionné');
    }

    set({ isLoading: true, error: null });
    try {
      await deleteChallenge(currentChallenge.id);

      // Retirer de la liste et réinitialiser le challenge actuel
      set((state) => ({
        challenges: state.challenges.filter((c) => c.id !== currentChallenge.id),
        currentChallenge: null,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Delete challenge error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ===== Action : Quitter le challenge actif =====
  /**
   * Quitte le challenge actif en retirant l'utilisateur de la liste des participants.
   * Contrairement à deleteCurrentChallenge, ceci ne supprime pas le challenge pour
   * les autres — ça retire juste l'utilisateur courant.
   *
   * @param userId - L'ID de l'utilisateur qui quitte
   */
  leaveActiveChallenge: async (userId: string) => {
    const { activeChallenge } = get();
    if (!activeChallenge) {
      throw new Error('Aucun challenge actif');
    }

    set({ isLoading: true, error: null });
    try {
      await leaveChallenge(activeChallenge.id, userId);

      // Retire le challenge de la liste et réinitialise le challenge actif
      set((state) => {
        const remaining = state.challenges.filter((c) => c.id !== activeChallenge.id);
        return {
          challenges: remaining,
          activeChallenge: remaining.length > 0 ? remaining[0] : null,
          isLoading: false,
        };
      });
    } catch (error: any) {
      console.error('Leave challenge error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ===== Action : Réinitialiser =====
  /**
   * Réinitialiser le store (lors de la déconnexion par exemple)
   */
  reset: () => {
    set({
      challenges: [],
      activeChallenge: null,
      currentChallenge: null,
      isLoading: false,
      challengesLoading: false,
      challengesLoaded: false,
      error: null,
    });
  },

  // ===== Action : Définir une erreur =====
  /**
   * Définir une erreur manuellement
   * 
   * @param error - Le message d'erreur, ou null pour effacer
   */
  setError: (error) => {
    set({ error });
  },
}));
