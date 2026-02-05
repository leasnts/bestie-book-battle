/**
 * Service de notifications pour Bestie Book Battle
 * 
 * Ce fichier gère les notifications push avec Expo :
 * - Demande de permission
 * - Enregistrement du token
 * - Envoi de notifications locales
 * - Planification de rappels quotidiens
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { updateUserProfile } from './supabase/auth';

// Configure le comportement des notifications quand l'app est au premier plan
// Cela permet d'afficher les notifications même quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Affiche l'alerte
    shouldPlaySound: true,    // Joue le son
    shouldSetBadge: true,     // Met à jour le badge
    shouldShowBanner: true,   // iOS 15+: affiche en banner
    shouldShowList: true,     // iOS 15+: affiche dans le centre de notifications
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
    console.log('Les notifications nécessitent un appareil physique');
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
    console.log('Permission de notification refusée');
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
  // Annule d'abord les rappels existants
  await cancelDailyReminder();
  
  // Planifie le nouveau rappel avec le message personnalisé ou le message par défaut
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: title || '📚 C\'est l\'heure de lire !',
      body: body || 'N\'oublie pas de mettre à jour ta progression aujourd\'hui',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  
  return id;
}

/**
 * Annule le rappel quotidien
 */
export async function cancelDailyReminder(): Promise<void> {
  // Récupère toutes les notifications planifiées
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  // Annule celles qui sont des rappels quotidiens
  for (const notification of scheduled) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
}

/**
 * Envoie une notification quand quelqu'un dépasse l'utilisateur
 * 
 * @param competitorName - Le nom de la personne qui a dépassé
 * @param projectId - L'ID du projet pour le deep linking
 */
export async function sendOvertakeNotification(
  competitorName: string,
  projectId: string
): Promise<void> {
  await sendLocalNotification(
    '👀 Tu as été dépassé !',
    `${competitorName} vient de te dépasser. Rattrape-le !`,
    { projectId, type: 'overtake' }
  );
}

/**
 * Envoie une notification de milestone
 * 
 * @param pagesRead - Nombre de pages lues
 * @param milestone - Le milestone atteint (100, 200, etc.)
 */
export async function sendMilestoneNotification(
  pagesRead: number,
  milestone: number
): Promise<void> {
  await sendLocalNotification(
    '🎉 Félicitations !',
    `Tu as lu ${pagesRead} pages ! Continue comme ça !`,
    { type: 'milestone', milestone }
  );
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

