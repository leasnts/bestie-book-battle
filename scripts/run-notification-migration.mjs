#!/usr/bin/env node
/**
 * Migration des préférences de notifications dans Supabase
 *
 * Met à jour tous les users pour ajouter les nouveaux champs :
 * streak_alerts, goal_reminders, friend_activity, inactivity_alerts, other_finished_book
 *
 * Utilise la clé service_role pour bypasser le RLS.
 *
 * Usage :
 *   node scripts/run-notification-migration.mjs
 *
 * Variables requises dans .env :
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Charger .env
try {
  const envPath = join(__dirname, '..', '.env');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch (_) {}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Variables requises dans .env :');
  console.error('   EXPO_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('   Récupère la clé service_role : Supabase → Settings → API');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const DEFAULTS = {
  enabled: true,
  daily_reminder: true,
  daily_reminder_time: '20:00',
  competitive_alerts: true,
  milestone_alerts: true,
  streak_alerts: true,
  goal_reminders: true,
  friend_activity: true,
  inactivity_alerts: true,
  other_finished_book: true,
};

function merge(prefs) {
  if (!prefs || typeof prefs !== 'object') return DEFAULTS;
  return {
    enabled: prefs.enabled ?? DEFAULTS.enabled,
    daily_reminder: prefs.daily_reminder ?? DEFAULTS.daily_reminder,
    daily_reminder_time: prefs.daily_reminder_time ?? DEFAULTS.daily_reminder_time,
    competitive_alerts: prefs.competitive_alerts ?? DEFAULTS.competitive_alerts,
    milestone_alerts: prefs.milestone_alerts ?? DEFAULTS.milestone_alerts,
    streak_alerts: prefs.streak_alerts ?? DEFAULTS.streak_alerts,
    goal_reminders: prefs.goal_reminders ?? DEFAULTS.goal_reminders,
    friend_activity: prefs.friend_activity ?? DEFAULTS.friend_activity,
    inactivity_alerts: prefs.inactivity_alerts ?? DEFAULTS.inactivity_alerts,
    other_finished_book: prefs.other_finished_book ?? DEFAULTS.other_finished_book,
  };
}

async function main() {
  console.log('📬 Migration des préférences de notifications...\n');

  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, first_name, notification_preferences');

  if (fetchError) {
    console.error('❌ Erreur lecture users:', fetchError.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('   Aucun utilisateur à migrer.');
    process.exit(0);
  }

  let updated = 0;
  for (const u of users) {
    const merged = merge(u.notification_preferences);
    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: merged })
      .eq('id', u.id);

    if (error) {
      console.error('   ❌', u.id, error.message);
    } else {
      updated++;
      console.log('   ✅', u.first_name || u.id?.slice(0, 8));
    }
  }

  console.log('\n✨', updated, '/', users.length, 'utilisateurs mis à jour.');
}

main();
