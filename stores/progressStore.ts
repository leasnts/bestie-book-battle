/**
 * Store Zustand pour la progression de lecture avec Supabase
 * 
 * Fonctionnalités :
 * - Charger les progressions d'un challenge
 * - Mettre à jour la progression d'un utilisateur
 * - S'abonner aux mises à jour en temps réel
 * - Calculer les classements et statistiques
 * 
 * Ce store gère toutes les progressions et l'historique de lecture.
 */

import { create } from 'zustand';
import {
  UserProgress,
  ParticipantWithProgress,
  ProgressHistory,
} from '../types/supabase';
import {
  getChallengeProgress,
  getUserProgress,
  updateUserProgress,
  updateUserTotalPages as updateUserTotalPagesDb,
  getChallengeParticipants,
  getUserHistory,
  getChallengeHistory,
  getUserHistoryByDateRange,
} from '../services/supabase/database';
import {
  subscribeToChallengeProgress,
  subscribeToChallengeHistory,
  unsubscribeChannel,
} from '../services/supabase/realtime';
import { handleRealtimeProgressUpdate } from '../services/notificationTriggers';

/**
 * Interface du store de progression
 */
interface ProgressStore {
  // État
  progressList: UserProgress[]; // Liste des progressions du challenge actuel
  participants: ParticipantWithProgress[]; // Participants avec classement
  currentUserProgress: UserProgress | null; // Progression de l'utilisateur actuel
  history: ProgressHistory[]; // Historique de lecture
  isLoading: boolean;
  error: string | null;

  // Actions - Chargement
  loadChallengeProgress: (challengeId: string) => Promise<void>;
  loadUserProgress: (challengeId: string, userId: string) => Promise<void>;
  loadUserHistory: (challengeId: string, userId: string) => Promise<void>;
  loadChallengeHistory: (challengeId: string) => Promise<void>;
  loadUserHistoryByDateRange: (
    challengeId: string,
    userId: string,
    startDate: string,
    endDate: string
  ) => Promise<void>;

  // Actions - Mise à jour
  updateProgress: (
    challengeId: string,
    userId: string,
    newPage: number
  ) => Promise<UserProgress>;
  updateUserTotalPages: (
    challengeId: string,
    userId: string,
    totalPages: number
  ) => Promise<UserProgress>;

  // Actions - Subscriptions temps réel
  subscribeToProgress: (
    challengeId: string,
    options?: { currentUserId: string; totalPages: number; bookTitle: string }
  ) => () => void;
  subscribeToHistory: (challengeId: string) => () => void;
  unsubscribeAll: () => void;

  // Actions - Helpers
  getUserProgressById: (userId: string) => UserProgress | undefined;
  clearProgress: () => void;
  setError: (error: string | null) => void;
}

/**
 * Store de progression Supabase
 * 
 * Gère toutes les progressions de lecture et leur affichage.
 */
export const useProgressStore = create<ProgressStore>((set, get) => ({
  // ===== État initial =====
  progressList: [],
  participants: [],
  currentUserProgress: null,
  history: [],
  isLoading: false,
  error: null,

  // ===== Action : Charger les progressions d'un challenge =====
  /**
   * Charger toutes les progressions d'un challenge
   * 
   * Charge les progressions et les participants avec leur classement.
   * 
   * @param challengeId - L'ID du challenge
   */
  loadChallengeProgress: async (challengeId) => {
    set({ isLoading: true, error: null, progressList: [], participants: [] });
    try {
      // Charger les participants avec leurs progressions et classement
      const participants = await getChallengeParticipants(challengeId);

      // Extraire la liste des progressions
      const progressList = participants.map((p) => p.progress);

      set({
        progressList,
        participants,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Load challenge progress error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // ===== Action : Charger la progression d'un utilisateur =====
  /**
   * Charger la progression d'un utilisateur spécifique
   * 
   * @param challengeId - L'ID du challenge
   * @param userId - L'ID de l'utilisateur
   */
  loadUserProgress: async (challengeId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const progress = await getUserProgress(challengeId, userId);
      set({
        currentUserProgress: progress,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Load user progress error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // ===== Action : Charger l'historique d'un utilisateur =====
  /**
   * Charger l'historique de lecture d'un utilisateur
   * 
   * @param challengeId - L'ID du challenge
   * @param userId - L'ID de l'utilisateur
   */
  loadUserHistory: async (challengeId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const history = await getUserHistory(challengeId, userId);
      set({ history, isLoading: false });
    } catch (error: any) {
      console.error('Load user history error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // ===== Action : Charger l'historique complet d'un challenge =====
  /**
   * Charger l'historique complet d'un challenge (tous les utilisateurs)
   * 
   * @param challengeId - L'ID du challenge
   */
  loadChallengeHistory: async (challengeId) => {
    set({ isLoading: true, error: null });
    try {
      const history = await getChallengeHistory(challengeId);
      set({ history, isLoading: false });
    } catch (error: any) {
      console.error('Load challenge history error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // ===== Action : Charger l'historique par période =====
  /**
   * Charger l'historique d'un utilisateur sur une période
   * 
   * @param challengeId - L'ID du challenge
   * @param userId - L'ID de l'utilisateur
   * @param startDate - Date de début (YYYY-MM-DD)
   * @param endDate - Date de fin (YYYY-MM-DD)
   */
  loadUserHistoryByDateRange: async (challengeId, userId, startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const history = await getUserHistoryByDateRange(
        challengeId,
        userId,
        startDate,
        endDate
      );
      set({ history, isLoading: false });
    } catch (error: any) {
      console.error('Load user history by date range error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // ===== Action : Mettre à jour la progression =====
  /**
   * Mettre à jour la progression d'un utilisateur
   * 
   * Met à jour le nombre de pages lues.
   * Déclenche automatiquement (via triggers SQL) :
   * - Le calcul du pourcentage
   * - La mise à jour du streak
   * - L'ajout d'une entrée dans l'historique
   * - La mise à jour des statistiques du challenge
   * 
   * @param challengeId - L'ID du challenge
   * @param userId - L'ID de l'utilisateur
   * @param newPage - Le nouveau numéro de page
   * @returns La progression mise à jour
   */
  updateProgress: async (challengeId, userId, newPage) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProgress = await updateUserProgress(
        challengeId,
        userId,
        newPage
      );

      // Mettre à jour la progression dans la liste
      set((state) => ({
        progressList: state.progressList.map((p) =>
          p.user_id === userId && p.challenge_id === challengeId
            ? updatedProgress
            : p
        ),
        currentUserProgress:
          state.currentUserProgress?.user_id === userId
            ? updatedProgress
            : state.currentUserProgress,
        isLoading: false,
      }));

      // Recharger les participants pour mettre à jour le classement
      const participants = await getChallengeParticipants(challengeId);
      set({ participants });

      return updatedProgress;
    } catch (error: any) {
      console.error('Update progress error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ===== Action : Mettre à jour le total de pages du participant =====
  updateUserTotalPages: async (challengeId, userId, totalPages) => {
    try {
      const updatedProgress = await updateUserTotalPagesDb(
        challengeId,
        userId,
        totalPages
      );

      // Mettre à jour la progression dans la liste
      set((state) => ({
        progressList: state.progressList.map((p) =>
          p.user_id === userId && p.challenge_id === challengeId
            ? updatedProgress
            : p
        ),
        currentUserProgress:
          state.currentUserProgress?.user_id === userId
            ? updatedProgress
            : state.currentUserProgress,
      }));

      // Recharger les participants pour mettre à jour le classement
      const participants = await getChallengeParticipants(challengeId);
      set({ participants });

      return updatedProgress;
    } catch (error: any) {
      console.error('Update user total pages error:', error);
      throw error;
    }
  },

  // ===== Action : S'abonner aux progressions =====
  /**
   * S'abonner aux mises à jour de progression en temps réel
   * 
   * Écoute tous les changements de progression du challenge.
   * Met à jour automatiquement le store quand quelqu'un lit.
   * Déclenche les notifications (dépassement, écart, activité ami, etc.) si options fournies.
   * 
   * @param challengeId - L'ID du challenge
   * @param options - Contexte pour les notifications (currentUserId, totalPages, bookTitle)
   * @returns Fonction pour se désabonner
   */
  subscribeToProgress: (challengeId, options) => {
    const unsubscribe = subscribeToChallengeProgress(
      challengeId,
      async (progress, event, oldProgress) => {
        if (event === 'UPDATE' || event === 'INSERT') {
          // Mettre à jour la progression dans la liste
          set((state) => {
            const exists = state.progressList.some(
              (p) => p.user_id === progress.user_id
            );

            return {
              progressList: exists
                ? state.progressList.map((p) =>
                    p.user_id === progress.user_id ? progress : p
                  )
                : [...state.progressList, progress],
            };
          });

          // Recharger les participants pour mettre à jour le classement
          try {
            const participants = await getChallengeParticipants(challengeId);
            set({ participants });

            // Déclencher les notifications si mise à jour par un AUTRE utilisateur
            if (
              options &&
              progress.user_id !== options.currentUserId
            ) {
              handleRealtimeProgressUpdate(
                challengeId,
                options.currentUserId,
                progress,
                oldProgress ?? null,
                participants,
                options.totalPages,
                options.bookTitle
              ).catch(() => {});
            }
          } catch (error) {
            console.error('Failed to reload participants:', error);
          }
        } else if (event === 'DELETE') {
          // Retirer la progression de la liste
          set((state) => ({
            progressList: state.progressList.filter(
              (p) => p.user_id !== progress.user_id
            ),
          }));
        }
      }
    );

    return unsubscribe;
  },

  // ===== Action : S'abonner à l'historique =====
  /**
   * S'abonner aux nouvelles entrées d'historique en temps réel
   * 
   * Écoute toutes les nouvelles lectures ajoutées.
   * Met à jour automatiquement le store.
   * 
   * @param challengeId - L'ID du challenge
   * @returns Fonction pour se désabonner
   */
  subscribeToHistory: (challengeId) => {
    const unsubscribe = subscribeToChallengeHistory(
      challengeId,
      (entry) => {
        // Ajouter la nouvelle entrée au début de l'historique
        set((state) => ({
          history: [entry, ...state.history],
        }));
      }
    );

    return unsubscribe;
  },

  // ===== Action : Se désabonner de tout =====
  /**
   * Se désabonner de toutes les subscriptions actives
   * 
   * Utile lors du changement de page ou de la déconnexion.
   */
  unsubscribeAll: () => {
    // Les channels sont gérés par le service realtime
  },

  // ===== Helper : Obtenir la progression d'un utilisateur =====
  /**
   * Obtenir la progression d'un utilisateur depuis la liste
   * 
   * @param userId - L'ID de l'utilisateur
   * @returns La progression, ou undefined si non trouvée
   */
  getUserProgressById: (userId) => {
    const { progressList } = get();
    return progressList.find((p) => p.user_id === userId);
  },

  // ===== Action : Réinitialiser =====
  /**
   * Réinitialiser le store
   * 
   * Efface toutes les progressions et l'historique.
   */
  clearProgress: () => {
    set({
      progressList: [],
      participants: [],
      currentUserProgress: null,
      history: [],
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
