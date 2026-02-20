/**
 * Hook pour planifier les notifications basées sur le contexte
 * 
 * À appeler quand un challenge est chargé (home ou détail) pour :
 * - Streak en danger (si pas lu aujourd'hui)
 * - Rappels d'objectifs (deadline demain)
 * - Inactivité (pas de mise à jour depuis X jours)
 * 
 * Ces notifications sont planifiées localement (expo-notifications).
 */

import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import { useProgressStore } from '../stores/progressStore';
import {
  checkAndScheduleStreakAtRisk,
  scheduleGoalRemindersIfNeeded,
  checkAndScheduleInactivityNotification,
} from '../services/notificationTriggers';

interface UseNotificationSchedulerProps {
  challengeId: string | null;
  /** Déjà chargé par le parent (participants, goals) */
  participantsLoaded?: boolean;
  goalsLoaded?: boolean;
}

/**
 * Planifie les notifications contextuelles pour un challenge
 * 
 * Appelé par la home ou la page détail une fois les données chargées.
 */
export function useNotificationScheduler({
  challengeId,
  participantsLoaded = true,
  goalsLoaded = true,
}: UseNotificationSchedulerProps) {
  const { user } = useAuthStore();
  const { participants } = useProgressStore();
  const { primaryGoal, secondaryGoal } = useGoalStore();

  // On extrait uniquement les valeurs scalaires qui nous intéressent,
  // pour éviter que le changement de référence du tableau `participants`
  // ne déclenche l'effet plusieurs fois avec les mêmes données.
  const myParticipant = participants.find((p) => p.user.id === user?.id);
  const streakCount = myParticipant?.progress.streak_count ?? 0;
  const lastStreakDate = myParticipant?.progress.last_streak_date ?? null;
  const lastUpdatedAt = myParticipant?.progress.last_updated_at ?? null;

  useEffect(() => {
    if (!challengeId || !user?.id) return;
    if (!participantsLoaded) return;
    if (!myParticipant) return;

    // 1. Streak en danger
    checkAndScheduleStreakAtRisk(challengeId, streakCount, lastStreakDate);

    // 2. Inactivité (pas de mise à jour depuis 3 jours)
    checkAndScheduleInactivityNotification(lastUpdatedAt, challengeId, 3);
    // Les dépendances sont des primitives (string | number | null),
    // pas l'objet `participants` entier — l'effet ne se déclenche
    // que si les données changent vraiment.
  }, [challengeId, user?.id, participantsLoaded, streakCount, lastStreakDate, lastUpdatedAt]);

  useEffect(() => {
    if (!challengeId || !goalsLoaded) return;

    const goals = [primaryGoal, secondaryGoal].filter(Boolean);
    scheduleGoalRemindersIfNeeded(goals as any, challengeId);
  }, [challengeId, primaryGoal, secondaryGoal, goalsLoaded]);
}
