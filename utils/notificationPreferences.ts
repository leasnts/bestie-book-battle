/**
 * Utilitaires pour les préférences de notifications
 * 
 * Aligné avec notification_preferences (JSONB) dans la table users.
 * App iOS uniquement — notification_token = Expo Push → APNs.
 */

import type { NotificationPreferences } from '../types/supabase';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './constants';

/**
 * Fusionne des préférences partielles (ex: depuis la DB) avec les valeurs par défaut.
 * Utile quand la DB a des users créés avant l'ajout de nouveaux champs.
 */
export function mergeWithDefaults(
  prefs: Partial<NotificationPreferences> | null | undefined
): NotificationPreferences {
  if (!prefs || typeof prefs !== 'object') {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  return {
    enabled: prefs.enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.enabled,
    daily_reminder: prefs.daily_reminder ?? DEFAULT_NOTIFICATION_PREFERENCES.daily_reminder,
    daily_reminder_time: prefs.daily_reminder_time ?? DEFAULT_NOTIFICATION_PREFERENCES.daily_reminder_time,
    competitive_alerts: prefs.competitive_alerts ?? DEFAULT_NOTIFICATION_PREFERENCES.competitive_alerts,
    milestone_alerts: prefs.milestone_alerts ?? DEFAULT_NOTIFICATION_PREFERENCES.milestone_alerts,
    streak_alerts: prefs.streak_alerts ?? DEFAULT_NOTIFICATION_PREFERENCES.streak_alerts,
    goal_reminders: prefs.goal_reminders ?? DEFAULT_NOTIFICATION_PREFERENCES.goal_reminders,
    friend_activity: prefs.friend_activity ?? DEFAULT_NOTIFICATION_PREFERENCES.friend_activity,
    inactivity_alerts: prefs.inactivity_alerts ?? DEFAULT_NOTIFICATION_PREFERENCES.inactivity_alerts,
    other_finished_book: prefs.other_finished_book ?? DEFAULT_NOTIFICATION_PREFERENCES.other_finished_book,
  };
}
