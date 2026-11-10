/**
 * Notifications de chapi (#178) — le téléphone ne décide plus rien.
 *
 * Tout part du serveur (scripts/notifications.sql) : quatre notifs seulement
 * (rappel, une pote passe devant, carnet, cap), 2 par jour au plus, rien la nuit
 * pour le groupe, tout revérifié juste avant l'envoi. L'app, elle :
 * - donne au serveur son adresse de notification (jeton Expo) et son fuseau ;
 * - ne montre AUCUNE notif système quand elle est ouverte. Seule une nouvelle
 *   note déposée mérite un signe : un bandeau papier dans l'app
 *   (hooks/usePushNotifications.ts) ;
 * - ouvre le bon écran quand on touche une notif.
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../stores/authStore';
import type { NotificationPreferences } from '../types/supabase';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../utils/constants';
import { updateUserProfile } from './supabase/auth';

/** Ce que le serveur glisse dans chaque notif */
export interface PushData {
  kind: 'reminder' | 'overtake' | 'carnet' | 'cap';
  /** L'écran à ouvrir : '/', '/leaderboard', '/carnet' */
  url: string;
  challengeId?: string | null;
  /** Une nouvelle note est dedans (pas seulement des réactions) */
  note?: boolean;
}

// App ouverte : rien ne s'affiche, ne sonne ni ne s'empile
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/** La fenêtre d'iOS (une seule fois dans la vie de l'app) */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Le fuseau du téléphone (« Europe/Paris ») : le serveur compte les jours et la nuit avec */
export function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

/**
 * Donne au serveur l'adresse de ce téléphone et son fuseau.
 * Sans autorisation, on ne demande rien : c'est l'écran de l'onboarding ou les
 * Réglages qui ouvrent la fenêtre d'iOS.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (!(await hasNotificationPermission())) return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const timezone = deviceTimeZone();
  const user = useAuthStore.getState().user;
  if (user?.id === userId && user.notification_token === token && user.timezone === timezone) return;
  const updated = await updateUserProfile(userId, { notification_token: token, timezone });
  useAuthStore.getState().setUser(updated);
}

/** Mes réglages de notifs, avec les valeurs par défaut pour ce qui manque */
export function notificationPrefs(prefs?: Partial<NotificationPreferences> | null): NotificationPreferences {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs };
}

/** Change un réglage (rappel, heure, groupe) ; le serveur le lit à chaque envoi */
export async function saveNotificationPrefs(userId: string, patch: Partial<NotificationPreferences>): Promise<void> {
  const { user, setUser } = useAuthStore.getState();
  const next = { ...notificationPrefs(user?.notification_preferences), ...patch };
  // Tout de suite à l'écran, puis en base
  if (user) setUser({ ...user, notification_preferences: next });
  const updated = await updateUserProfile(userId, { notification_preferences: next });
  setUser(updated);
}
