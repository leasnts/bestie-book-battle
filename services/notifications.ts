/**
 * Service de notifications pour Bestie Book Battle
 * 
 * Ce fichier gère les notifications push avec Expo :
 * - Demande de permission
 * - Enregistrement du token
 * - Envoi de notifications locales
 * - Planification de rappels quotidiens
 * 
 * Types de notifications gérés :
 * - RAPPEL QUOTIDIEN (ex: 20h)
 * - DÉPASSEMENT (quelqu'un te passe devant)
 * - ÉCART QUI SE CREUSE (+25 pages)
 * - STREAK en danger
 * - MILESTONES (paliers de progression, moitié du livre, livre terminé)
 * - Rappels d'objectifs (deadline demain)
 * - ACTIVITÉ D'UN AMI (l'autre vient de mettre à jour)
 * - INACTIVITÉ (pas de mise à jour depuis plusieurs jours)
 * - L'AUTRE A FINI LE LIVRE
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { updateUserProfile } from './supabase/auth';

// Identifiants des notifications planifiées (pour les annuler individuellement)
export const NOTIFICATION_IDS = {
  DAILY_REMINDER: 'daily-reminder',
  STREAK_AT_RISK: 'streak-at-risk',
  GOAL_DEADLINE: 'goal-deadline',
  INACTIVITY: 'inactivity',
} as const;

// Configure le comportement des notifications quand l'app est au premier plan
// Cela permet d'afficher les notifications même quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Enregistre l'appareil pour recevoir des notifications push
 * 
 * Cette fonction :
 * 1. Vérifie si c'est un appareil physique (pas un simulateur)
 * 2. Demande la permission à l'utilisateur
 * 3. Récupère le token Expo Push
 * 
 * @param userId - L'ID de l'utilisateur pour sauvegarder le token
 * @returns Le token de notification ou null
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  let token: string | null = null;
  
  // Les notifications ne fonctionnent que sur les appareils physiques
  if (!Device.isDevice) {
    return null;
  }
  
  // Vérifie/demande les permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  // Si pas encore de permission, on demande
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  // Si l'utilisateur refuse, on ne peut pas continuer
  if (finalStatus !== 'granted') {
    return null;
  }
  
  // Récupère le token Expo Push
  // Ce token est unique à cet appareil et cette app
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Remplace par ton ID de projet Expo
    });
    token = tokenData.data;
    
    // Sauvegarde le token dans Supabase pour pouvoir envoyer des push
    await updateUserProfile(userId, { notification_token: token });
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token:', error);
  }
  
  return token;
}

/**
 * Envoie une notification locale immédiate
 * 
 * Utilisé pour :
 * - Notifications de test
 * - Alertes instantanées
 * 
 * @param title - Le titre de la notification
 * @param body - Le contenu de la notification
 * @param data - Données supplémentaires (pour le deep linking)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // null = immédiat
  });
}

/**
 * Planifie un rappel quotidien de lecture
 * 
 * Cette notification se répète chaque jour à l'heure choisie
 * pour rappeler à l'utilisateur de mettre à jour sa progression.
 * 
 * @param hour - L'heure (0-23)
 * @param minute - La minute (0-59)
 * @param title - Le titre de la notification (optionnel)
 * @param body - Le message de la notification (optionnel)
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  title?: string,
  body?: string
): Promise<string> {
  // Annule d'abord les rappels quotidiens existants
  await cancelNotificationById(NOTIFICATION_IDS.DAILY_REMINDER);
  
  // Planifie le nouveau rappel avec le message personnalisé ou le message par défaut
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: title || '📚 C\'est l\'heure de lire !',
      body: body || 'N\'oublie pas de mettre à jour ta progression aujourd\'hui',
      data: { type: 'daily_reminder', notificationId: NOTIFICATION_IDS.DAILY_REMINDER },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    identifier: NOTIFICATION_IDS.DAILY_REMINDER,
  });
  
  return id;
}

/**
 * Annule une notification planifiée par son identifiant
 */
export async function cancelNotificationById(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Annule le rappel quotidien (rétrocompatibilité)
 */
export async function cancelDailyReminder(): Promise<void> {
  await cancelNotificationById(NOTIFICATION_IDS.DAILY_REMINDER);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS IMMÉDIATES (événements temps réel)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Envoie une notification quand quelqu'un dépasse l'utilisateur
 */
export async function sendOvertakeNotification(
  competitorName: string,
  challengeId: string
): Promise<void> {
  await sendLocalNotification(
    `${competitorName} t'a dépassé`,
    `On va pas s'appesantir là-dessus`,
    { challengeId, type: 'overtake' }
  );
}

/**
 * Envoie une notification quand quelqu'un prend une avance significative (+25 pages)
 */
export async function sendGapWideningNotification(
  competitorName: string,
  gapPages: number,
  challengeId: string
): Promise<void> {
  await sendLocalNotification(
    `${gapPages} pages de retard`,
    `Pas de panique... si si un peu`,
    { challengeId, type: 'gap_widening' }
  );
}

/**
 * Envoie une notification quand ton streak est en danger
 */
export async function sendStreakAtRiskNotification(
  streakCount: number,
  challengeId?: string
): Promise<void> {
  await sendLocalNotification(
    'Streak en danger',
    `${streakCount} jour${streakCount > 1 ? 's' : ''} d'affilée — fais pas l'imbécile ce soir`,
    { challengeId, type: 'streak_at_risk' }
  );
}

/**
 * Envoie une notification de milestone (paliers de progression)
 */
export async function sendMilestoneNotification(
  pageReached: number,
  milestone: number,
  challengeId?: string
): Promise<void> {
  await sendLocalNotification(
    `Page ${milestone} atteinte`,
    buildMilestonePushBody(pageReached, milestone),
    { challengeId, type: 'milestone', milestone }
  );
}

/**
 * Envoie une notification pour la moitié du livre (milestone spécial)
 */
export async function sendHalfBookNotification(
  bookTitle: string,
  challengeId?: string
): Promise<void> {
  await sendLocalNotification(
    'Moitié du livre',
    `Plus que la moitié — t'es lancé`,
    { challengeId, type: 'milestone', milestone: 'half' }
  );
}

/**
 * Envoie une notification quand l'utilisateur termine le livre
 */
export async function sendBookFinishedNotification(
  bookTitle: string,
  challengeId?: string
): Promise<void> {
  await sendLocalNotification(
    'Livre terminé',
    `"${bookTitle}" dans la poche — bien joué`,
    { challengeId, type: 'book_finished' }
  );
}

/**
 * Envoie une notification de rappel de cap (ou de fin du livre) pour demain
 */
export async function sendGoalDeadlineReminderNotification(
  goalDescription: string,
  challengeId?: string,
  /** « Cap demain » pour un cap, « Fin du livre demain » pour la date de fin */
  title = 'Cap demain'
): Promise<void> {
  await sendLocalNotification(
    title,
    goalDescription,
    { challengeId, type: 'goal_deadline' }
  );
}

/**
 * Envoie une notification quand un ami met à jour sa progression
 */
export async function sendFriendActivityNotification(
  friendName: string,
  pagesRead: number,
  challengeId: string
): Promise<void> {
  const body = pagesRead > 0
    ? `${pagesRead} page${pagesRead > 1 ? 's' : ''} de plus — garde un oeil sur lui`
    : `Il avance, toi t'es au courant`;
  await sendLocalNotification(
    `${friendName} lit`,
    body,
    { challengeId, type: 'friend_activity' }
  );
}

/**
 * Envoie une notification quand l'autre participant a fini le livre
 */
export async function sendOtherFinishedBookNotification(
  friendName: string,
  bookTitle: string,
  challengeId: string
): Promise<void> {
  await sendLocalNotification(
    `${friendName} a fini le livre`,
    `Et toi t'en es où déjà ?`,
    { challengeId, type: 'other_finished_book' }
  );
}

/**
 * Envoie une notification d'inactivité (pas de mise à jour depuis X jours)
 */
export async function sendInactivityNotification(
  daysSinceLastUpdate: number,
  challengeId?: string
): Promise<void> {
  await sendLocalNotification(
    `${daysSinceLastUpdate} jours sans lire`,
    `Ton marque-page se sent abandonné`,
    { challengeId, type: 'inactivity' }
  );
}

function buildMilestonePushBody(_pageReached: number, milestone: number): string {
  if (milestone === 10) return 'T\'es parti, c\'est l\'essentiel';
  if (milestone === 25) return 'T\'es lancé là';
  if (milestone === 50) return 'La moitié approche — accroche-toi';
  if (milestone === 100) return 'Triple chiffres, pas anodin';
  if (milestone === 150) return 'Y\'a plus grand chose entre toi et la fin';
  if (milestone >= 200) return 'Mode lecteur professionnel activé';
  return 'Continue comme ça';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLANIFICATION (notifications différées)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Planifie la notification de streak en danger
 * À envoyer en fin de journée (ex: 18h) si l'utilisateur n'a pas lu aujourd'hui
 */
export async function scheduleStreakAtRiskNotification(
  streakCount: number,
  hour: number,
  minute: number,
  challengeId?: string
): Promise<string | null> {
  await cancelNotificationById(NOTIFICATION_IDS.STREAK_AT_RISK);
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Streak en danger',
      body: `${streakCount} jour${streakCount > 1 ? 's' : ''} d'affilée — fais pas l'imbécile ce soir`,
      data: { challengeId, type: 'streak_at_risk' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    identifier: NOTIFICATION_IDS.STREAK_AT_RISK,
  });
  return id;
}

/**
 * Planifie un rappel la veille : un cap, ou la fin du livre
 */
export async function scheduleGoalDeadlineReminder(
  goalDescription: string,
  deadlineDate: Date,
  challengeId?: string,
  goalId?: string,
  title = 'Cap demain'
): Promise<string | null> {
  // La veille à 20h
  const dayBefore = new Date(deadlineDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(20, 0, 0, 0);
  
  if (dayBefore <= new Date()) return null; // Déjà passé
  
  const identifier = goalId
    ? `${NOTIFICATION_IDS.GOAL_DEADLINE}-${goalId}`
    : NOTIFICATION_IDS.GOAL_DEADLINE;
  
  await cancelNotificationById(identifier);
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: goalDescription,
      data: { challengeId, type: 'goal_deadline' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dayBefore,
    },
    identifier,
  });
  return id;
}

/**
 * Planifie une notification d'inactivité (J+3 sans mise à jour)
 */
export async function scheduleInactivityNotification(
  daysFromNow: number,
  challengeId?: string
): Promise<string | null> {
  await cancelNotificationById(NOTIFICATION_IDS.INACTIVITY);
  
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + daysFromNow);
  triggerDate.setHours(20, 0, 0, 0);
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tu n\'as pas lu depuis un moment',
      body: `Ton marque-page se sent abandonné`,
      data: { challengeId, type: 'inactivity' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
    identifier: NOTIFICATION_IDS.INACTIVITY,
  });
  return id;
}

/**
 * Écoute les notifications reçues
 * 
 * @param callback - Fonction appelée quand une notification est reçue
 * @returns Fonction pour arrêter l'écoute
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Écoute les clics sur les notifications
 * 
 * Utilisé pour le deep linking quand l'utilisateur clique
 * sur une notification.
 * 
 * @param callback - Fonction appelée quand une notification est cliquée
 * @returns Fonction pour arrêter l'écoute
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

