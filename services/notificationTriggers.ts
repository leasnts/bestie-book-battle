/**
 * Logique de déclenchement des notifications
 *
 * Ce fichier centralise la décision de QUAND envoyer chaque type de notification.
 * Il est appelé depuis :
 * - progressStore (realtime : dépassement, écart, activité ami, l'autre a fini)
 * - Écran de mise à jour (milestones après sauvegarde)
 * - Hook au démarrage (streak en danger, rappel objectif, inactivité)
 *
 * En plus d'envoyer la notification push système, chaque alerte importante
 * est sauvegardée dans le notificationStore (persisté AsyncStorage) pour
 * apparaître dans le feed in-app.
 *
 * CE QUI N'EST PAS SAUVEGARDÉ dans le feed :
 * - sendFriendActivityNotification → "l'ami a lu X pages" → trop verbeux pour un feed
 * - scheduleDailyReminder → rappel système, pas pertinent dans le feed
 */

import * as Notifications from 'expo-notifications';
import { useNotificationStore } from '../stores/notificationStore';
import { ChallengeGoal, ParticipantWithProgress, UserProgress } from '../types/supabase';
import { milestones } from '../utils/constants';
import { isStreakAtRisk } from '../utils/streak';
import {
  scheduleGoalDeadlineReminder,
  scheduleInactivityNotification,
  scheduleStreakAtRiskNotification,
  sendBookFinishedNotification,
  sendFriendActivityNotification,
  sendGapWideningNotification,
  sendHalfBookNotification,
  sendInactivityNotification,
  sendMilestoneNotification,
  sendOtherFinishedBookNotification,
  sendOvertakeNotification,
  sendStreakAtRiskNotification,
} from './notifications';

const GAP_THRESHOLD_PERCENT = 10; // ~25 pages sur un livre de 250

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

function findParticipant(
  participants: ParticipantWithProgress[],
  userId: string
): ParticipantWithProgress | undefined {
  return participants.find((p) => p.user.id === userId);
}

/** Accès direct au store (utilisable hors React) */
const saveNotification = useNotificationStore.getState().addNotification;

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * Appelé quand une progression est mise à jour en temps réel (par un AUTRE utilisateur).
 * Détecte : dépassement, écart important, l'autre a fini le livre.
 *
 * Note : "l'ami a lu X pages" (sendFriendActivityNotification) n'est PAS sauvegardé
 * dans le feed car c'est trop verbeux et peu informatif.
 */
export async function handleRealtimeProgressUpdate(
  challengeId: string,
  currentUserId: string,
  newProgress: UserProgress,
  oldProgress: UserProgress | null,
  participants: ParticipantWithProgress[],
  totalPages: number,
  bookTitle: string
): Promise<void> {
  // Ignorer les mises à jour de l'utilisateur courant
  if (newProgress.user_id === currentUserId) return;

  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  const updatedUserId = newProgress.user_id;
  const friendParticipant = findParticipant(participants, updatedUserId);
  const myParticipant = findParticipant(participants, currentUserId);

  // Edge case : l'utilisateur courant n'est pas dans les participants
  if (!myParticipant) return;

  const friendName = friendParticipant?.user?.first_name ?? 'Ton ami';
  // Photo du friend résolue maintenant (sera stockée dans le feed)
  const friendPhotoUrl = friendParticipant?.user?.profile_photo_url ?? null;

  // Pourcentages pour comparaisons équitables (chaque édition a son propre total)
  const myPercentage = myParticipant.percentage ?? 0;
  const friendPercentage = newProgress.progress_percentage ?? 0;
  const oldFriendPercentage = oldProgress?.progress_percentage ?? 0;

  // ── 1. L'autre a fini le livre ──────────────────────────────────────────────
  // Utiliser le total_pages de l'ami (son édition), avec fallback sur le total du challenge
  const friendTotalPages = newProgress.total_pages ?? totalPages;
  if (newProgress.current_page >= friendTotalPages) {
    await sendOtherFinishedBookNotification(friendName, bookTitle, challengeId);
    saveNotification({
      type: 'friend_finished',
      title: `${friendName} a fini le livre`,
      body: `Et toi t'en es où déjà ?`,
      challengeId,
      avatarSource: friendPhotoUrl,
    });
    return;
  }

  let sentCompetitiveAlert = false;

  // ── 2. Dépassement : l'autre nous a passé (comparé en pourcentage) ─────────
  const wasBehindMe = oldFriendPercentage < myPercentage;
  const isNowAhead = friendPercentage > myPercentage;
  if (oldProgress && wasBehindMe && isNowAhead) {
    await sendOvertakeNotification(friendName, challengeId);
    saveNotification({
      type: 'overtake',
      title: `${friendName} t'a dépassé`,
      body: `On va pas s'appesantir là-dessus`,
      challengeId,
      avatarSource: friendPhotoUrl,
    });
    sentCompetitiveAlert = true;
  }

  // ── 3. Écart significatif : l'autre a 10%+ d'avance ──────────────────────
  const gapPercent = friendPercentage - myPercentage;
  if (gapPercent >= GAP_THRESHOLD_PERCENT && !sentCompetitiveAlert) {
    const gapDisplay = Math.round(gapPercent);
    await sendGapWideningNotification(friendName, gapDisplay, challengeId);
    saveNotification({
      type: 'gap',
      title: `${gapDisplay}% de retard`,
      body: `Pas de panique... si si un peu`,
      challengeId,
      avatarSource: friendPhotoUrl,
    });
    sentCompetitiveAlert = true;
  }

  // ── 4. Activité d'un ami (push uniquement, PAS dans le feed) ──────────────
  // On envoie la push mais on ne sauvegarde pas dans le feed in-app.
  // Afficher "Léa a lu 3 pages" dans un feed c'est du spam inutile.
  const pagesRead = oldProgress
    ? Math.max(0, newProgress.current_page - oldProgress.current_page)
    : newProgress.current_page;
  if (!sentCompetitiveAlert) {
    await sendFriendActivityNotification(friendName, pagesRead, challengeId);
    // ← Pas de saveNotification ici intentionnellement
  }
}

/**
 * Appelé après une mise à jour de progression par l'utilisateur courant.
 * Vérifie les milestones (10, 25, 50, 100... pages), moitié du livre, livre terminé.
 *
 * @param currentUserPhotoUrl - URL de la photo de l'utilisateur (pour le feed)
 */
export async function handleOwnProgressUpdateMilestones(
  challengeId: string,
  previousPage: number,
  newPage: number,
  totalPages: number,
  bookTitle: string,
  currentUserPhotoUrl?: string | null
): Promise<void> {
  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  // Source d'avatar pour les notifs personnelles
  const avatarSource: 'self' | string =
    currentUserPhotoUrl ?? 'self';

  // ── Livre terminé ──────────────────────────────────────────────────────────
  if (newPage >= totalPages) {
    await sendBookFinishedNotification(bookTitle, challengeId);
    saveNotification({
      type: 'book_finished',
      title: 'Livre terminé',
      body: `"${bookTitle}" dans la poche — bien joué`,
      challengeId,
      avatarSource,
    });
    return;
  }

  // ── Moitié du livre ────────────────────────────────────────────────────────
  const half = Math.floor(totalPages / 2);
  if (previousPage < half && newPage >= half) {
    await sendHalfBookNotification(bookTitle, challengeId);
    saveNotification({
      type: 'half_book',
      title: 'Moitié du livre',
      body: `Plus que la moitié — t'es lancé`,
      challengeId,
      avatarSource,
    });
  }

  // ── Milestones standards (10, 25, 50, 100…) ───────────────────────────────
  const reachedMilestone = milestones.find(
    (m) => previousPage < m && newPage >= m
  );
  if (reachedMilestone) {
    await sendMilestoneNotification(newPage, reachedMilestone, challengeId);
    saveNotification({
      type: 'milestone',
      title: `Page ${reachedMilestone} atteinte`,
      body: buildMilestoneBody(newPage, reachedMilestone),
      challengeId,
      avatarSource,
    });
  }
}

/**
 * Vérifie et planifie la notification "streak en danger".
 * À appeler au démarrage de l'app ou quand l'utilisateur ouvre un challenge.
 */
export async function checkAndScheduleStreakAtRisk(
  challengeId: string,
  streakCount: number,
  lastStreakDate: string | null
): Promise<void> {
  if (streakCount === 0) return;

  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  if (!isStreakAtRisk(lastStreakDate)) return;

  await scheduleStreakAtRiskNotification(streakCount, 18, 0, challengeId);
  saveNotification({
    type: 'streak_risk',
    title: 'Streak en danger',
    body: `${streakCount} jour${streakCount > 1 ? 's' : ''} d'affilée — fais pas l'imbécile ce soir`,
    challengeId,
    avatarSource: null, // notification générale → image BBB
  });
}

/**
 * Planifie les rappels d'objectifs dont la deadline est demain.
 */
export async function scheduleGoalRemindersIfNeeded(
  goals: ChallengeGoal[],
  challengeId: string
): Promise<void> {
  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  for (const goal of goals) {
    if (goal.status !== 'active') continue;

    const deadlineStr = new Date(goal.deadline).toISOString().split('T')[0];
    if (deadlineStr !== tomorrowStr) continue;

    const description =
      goal.type === 'primary'
        ? 'Le livre est pas encore fini et la fin arrive'
        : `${goal.target_pages} pages pour demain — t'as intérêt`;

    const title = goal.type === 'primary' ? 'Fin du livre demain' : 'Cap demain';

    await scheduleGoalDeadlineReminder(
      description,
      new Date(goal.deadline),
      challengeId,
      goal.id,
      title
    );
    saveNotification({
      type: 'goal_deadline',
      title,
      body: description,
      challengeId,
      avatarSource: null,
    });
  }
}

/**
 * Vérifie l'inactivité et planifie une notification si pas de mise à jour depuis X jours.
 */
export async function checkAndScheduleInactivityNotification(
  lastUpdatedAt: string | null,
  challengeId: string,
  inactivityDays: number = 3
): Promise<void> {
  if (!lastUpdatedAt) return;

  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  const last = new Date(lastUpdatedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= inactivityDays) {
    await sendInactivityNotification(diffDays, challengeId);
    saveNotification({
      type: 'inactivity',
      title: `${diffDays} jours sans lire`,
      body: `Ton marque-page se sent abandonné`,
      challengeId,
      avatarSource: null,
    });
  } else if (diffDays === inactivityDays - 1) {
    await scheduleInactivityNotification(1, challengeId);
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function buildMilestoneBody(_pageReached: number, milestone: number): string {
  if (milestone === 10) return 'T\'es parti, c\'est l\'essentiel';
  if (milestone === 25) return 'T\'es lancé là';
  if (milestone === 50) return 'La moitié approche — accroche-toi';
  if (milestone === 100) return 'Triple chiffres, pas anodin';
  if (milestone === 150) return 'Y\'a plus grand chose entre toi et la fin';
  if (milestone >= 200) return 'Mode lecteur professionnel activé';
  return 'Continue comme ça';
}
