/**
 * Store Zustand pour les objectifs de lecture (goals)
 *
 * Gère deux types d'objectifs par challenge :
 * - primary : deadline finale pour finir le livre entier
 * - secondary : objectif temporaire (ex: lire X pages d'ici mercredi)
 *
 * N'importe quel participant peut créer/modifier un objectif.
 * Les objectifs passés sont gardés en historique pour voir
 * si les participants les ont atteints ou non.
 */

import { create } from 'zustand';
import {
  ChallengeGoal,
  ChallengeGoalInsert,
  ChallengeGoalUpdate,
} from '../types/supabase';
import {
  getActiveGoals,
  getGoalHistory,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../services/supabase/database';

interface GoalStore {
  // ═══ État ═══
  /** L'objectif principal actif (deadline finale du livre) */
  primaryGoal: ChallengeGoal | null;
  /** L'objectif secondaire actif (objectif temporaire/hebdomadaire) */
  secondaryGoal: ChallengeGoal | null;
  /** Historique des objectifs secondaires passés */
  history: ChallengeGoal[];
  isLoading: boolean;
  error: string | null;

  // ═══ Actions ═══
  /** Charge les objectifs actifs d'un challenge */
  loadActiveGoals: (challengeId: string) => Promise<void>;
  /** Charge l'historique des objectifs secondaires */
  loadGoalHistory: (challengeId: string) => Promise<void>;
  /** Crée un nouvel objectif (archive automatiquement l'ancien du même type) */
  addGoal: (goalData: ChallengeGoalInsert) => Promise<ChallengeGoal>;
  /** Met à jour un objectif existant */
  editGoal: (goalId: string, updates: ChallengeGoalUpdate) => Promise<void>;
  /** Supprime un objectif */
  removeGoal: (goalId: string) => Promise<void>;
  /** Réinitialise le store (ex: changement de challenge) */
  reset: () => void;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  // ═══ État initial ═══
  primaryGoal: null,
  secondaryGoal: null,
  history: [],
  isLoading: false,
  error: null,

  // ═══ Charger les objectifs actifs ═══
  // Récupère les objectifs dont status = 'active' pour le challenge donné.
  // La requête retourne 0, 1 ou 2 résultats (1 primary + 1 secondary max).
  loadActiveGoals: async (challengeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const goals = await getActiveGoals(challengeId);
      set({
        primaryGoal: goals.find((g) => g.type === 'primary') || null,
        secondaryGoal: goals.find((g) => g.type === 'secondary') || null,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // ═══ Charger l'historique ═══
  loadGoalHistory: async (challengeId: string) => {
    try {
      const history = await getGoalHistory(challengeId);
      set({ history });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // ═══ Créer un objectif ═══
  // Le service archive automatiquement l'ancien objectif du même type.
  // Après la création, on met à jour le store localement sans refetch.
  addGoal: async (goalData: ChallengeGoalInsert) => {
    set({ isLoading: true, error: null });
    try {
      const newGoal = await createGoal(goalData);

      if (newGoal.type === 'primary') {
        // L'ancien primary (s'il existait) a été archivé côté DB
        set({ primaryGoal: newGoal, isLoading: false });
      } else {
        // L'ancien secondary (s'il existait) a été archivé côté DB
        const oldSecondary = get().secondaryGoal;
        set({
          secondaryGoal: newGoal,
          // Ajoute l'ancien à l'historique local si disponible
          history: oldSecondary
            ? [{ ...oldSecondary, status: 'archived' as const }, ...get().history]
            : get().history,
          isLoading: false,
        });
      }

      return newGoal;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ═══ Modifier un objectif ═══
  editGoal: async (goalId: string, updates: ChallengeGoalUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateGoal(goalId, updates);

      if (updated.type === 'primary') {
        set({ primaryGoal: updated, isLoading: false });
      } else {
        set({ secondaryGoal: updated, isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // ═══ Supprimer un objectif ═══
  removeGoal: async (goalId: string) => {
    const { primaryGoal, secondaryGoal } = get();
    set({ isLoading: true, error: null });
    try {
      await deleteGoal(goalId);

      // Un cap passé vit dans l'historique : on l'y retire aussi
      set({ history: get().history.filter((goal) => goal.id !== goalId) });

      if (primaryGoal?.id === goalId) {
        set({ primaryGoal: null, isLoading: false });
      } else if (secondaryGoal?.id === goalId) {
        set({ secondaryGoal: null, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // ═══ Reset ═══
  reset: () => {
    set({
      primaryGoal: null,
      secondaryGoal: null,
      history: [],
      isLoading: false,
      error: null,
    });
  },
}));
