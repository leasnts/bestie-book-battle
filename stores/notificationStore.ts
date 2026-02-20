/**
 * Store des notifications in-app importantes
 *
 * Ce store persiste (AsyncStorage) les alertes significatives :
 * milestone, dépassement, écart, ami qui finit, livre terminé, etc.
 *
 * Il NE stocke PAS :
 * - "l'ami a lu 3 pages" (sendFriendActivityNotification) → trop verbeux
 * - Le rappel quotidien → c'est une notification système planifiée, pas un feed
 *
 * Logique de l'image affichée :
 * - avatarSource === 'self'        → photo de profil de l'utilisateur connecté
 * - avatarSource starts with http  → photo de profil d'un autre utilisateur
 * - avatarSource === null          → image BBB par défaut (notification générale)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'milestone'       // J'ai atteint X pages
  | 'half_book'       // J'ai lu la moitié du livre
  | 'book_finished'   // J'ai terminé le livre
  | 'overtake'        // Un ami m'a dépassé
  | 'gap'             // Un ami a X pages d'avance
  | 'friend_finished' // Un ami a terminé le livre
  | 'streak_risk'     // Ma série est en danger
  | 'goal_deadline'   // Deadline d'objectif demain
  | 'inactivity';     // Inactivité depuis X jours

export type NotificationEntry = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string; // ISO string pour sérialisation
  challengeId: string;
  /**
   * Source de l'image pour cette notification :
   * - 'self'        → photo de l'utilisateur connecté
   * - URL (https://) → photo d'un autre utilisateur (déjà résolue)
   * - null          → image BBB par défaut
   */
  avatarSource: 'self' | string | null;
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface NotificationStore {
  notifications: NotificationEntry[];
  addNotification: (entry: Omit<NotificationEntry, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  clearForChallenge: (challengeId: string) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (entry) => {
        // Déduplication : on ne sauvegarde pas si une notif du même type
        // pour le même challenge a déjà été enregistrée dans les dernières 12h.
        // Évite le spam quand le hook se re-déclenche plusieurs fois.
        const DEDUP_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 heures
        const now = Date.now();

        const isDuplicate = useNotificationStore
          .getState()
          .notifications.some(
            (n) =>
              n.type === entry.type &&
              n.challengeId === entry.challengeId &&
              now - new Date(n.timestamp).getTime() < DEDUP_WINDOW_MS
          );

        if (isDuplicate) return;

        const newEntry: NotificationEntry = {
          ...entry,
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          // Les plus récentes en premier, max 50 entrées
          notifications: [newEntry, ...state.notifications].slice(0, 50),
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => set({ notifications: [] }),

      clearForChallenge: (challengeId) => {
        set((state) => ({
          notifications: state.notifications.filter(
            (n) => n.challengeId !== challengeId
          ),
        }));
      },
    }),
    {
      name: 'bbb-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
