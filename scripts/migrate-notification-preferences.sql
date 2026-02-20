-- =====================================================
-- MIGRATION : Notification preferences (Bestie Book Battle)
-- =====================================================
-- À exécuter dans le SQL Editor de Supabase si ta DB existe déjà
-- avec des users ayant l'ancien format de notification_preferences.
--
-- Nouveaux champs ajoutés :
--   streak_alerts, goal_reminders, friend_activity,
--   inactivity_alerts, other_finished_book
--
-- Format complet après migration :
-- {
--   "enabled": true,
--   "daily_reminder": true,
--   "daily_reminder_time": "20:00",
--   "competitive_alerts": true,
--   "milestone_alerts": true,
--   "streak_alerts": true,
--   "goal_reminders": true,
--   "friend_activity": true,
--   "inactivity_alerts": true,
--   "other_finished_book": true
-- }
-- =====================================================

-- Met à jour tous les users : fusionne les nouvelles clés avec les valeurs existantes.
-- Pour les champs absents, utilise les valeurs par défaut.
UPDATE users
SET notification_preferences = jsonb_build_object(
  'enabled', COALESCE((COALESCE(notification_preferences, '{}'::jsonb)->>'enabled')::boolean, true),
  'daily_reminder', COALESCE((COALESCE(notification_preferences, '{}'::jsonb)->>'daily_reminder')::boolean, true),
  'daily_reminder_time', COALESCE(COALESCE(notification_preferences, '{}'::jsonb)->>'daily_reminder_time', '20:00'),
  'competitive_alerts', COALESCE((COALESCE(notification_preferences, '{}'::jsonb)->>'competitive_alerts')::boolean, true),
  'milestone_alerts', COALESCE((COALESCE(notification_preferences, '{}'::jsonb)->>'milestone_alerts')::boolean, true),
  'streak_alerts', COALESCE((COALESCE(notification_preferences, '{}'::jsonb)->>'streak_alerts')::boolean, true),
  'goal_reminders', COALESCE((COALESCE(notification_preferences, '{}'::jsonb)->>'goal_reminders')::boolean, true),
  'friend_activity', COALESCE((COALESCE(notification_preferences, '{}'::jsonb)->>'friend_activity')::boolean, true),
  'inactivity_alerts', COALESCE((COALESCE(notification_preferences, '{}'::jsonb)->>'inactivity_alerts')::boolean, true),
  'other_finished_book', COALESCE((COALESCE(notification_preferences, '{}'::jsonb)->>'other_finished_book')::boolean, true)
);
