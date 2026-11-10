/**
 * L'historique des notifs du groupe (#178), pour l'écran Activité.
 *
 * La source est le serveur (table `notifications`, scripts/notifications.sql) :
 * ce qui a été envoyé, ou l'aurait été sans autorisation, limite du jour ou
 * réglage coupé. Seulement le groupe (une pote passe devant, le carnet) : le
 * rappel et le cap n'ont rien à raconter après coup.
 *
 * Gardé sur le téléphone (AsyncStorage) : l'écran s'ouvre plein tout de suite,
 * puis se met à jour (jamais de loader).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../supabaseConfig';

export type NotificationType = 'overtake' | 'carnet';

export type NotificationEntry = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Le livre, quand la notif en parle */
  subtitle: string | null;
  timestamp: string; // ISO
  challengeId: string | null;
  url: string;
};

interface NotificationStore {
  notifications: NotificationEntry[];
  load: () => Promise<void>;
}

/** Ce qui compte comme « arrivé » : envoyé, ou retenu seulement par un réglage */
const DELIVERED = 'status.eq.sent,skip_reason.in.(no_token,daily_cap,off)';

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],

      load: async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, kind, title, subtitle, body, url, challenge_id, sent_at, created_at')
          .in('kind', ['overtake', 'carnet'])
          .not('title', 'is', null)
          .or(DELIVERED)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        set({
          notifications: (data ?? []).map((row) => ({
            id: row.id,
            type: row.kind as NotificationType,
            title: row.title ?? '',
            body: row.body ?? '',
            subtitle: row.subtitle,
            timestamp: row.sent_at ?? row.created_at,
            challengeId: row.challenge_id,
            url: row.url,
          })),
        });
      },
    }),
    {
      name: 'bbb-notifications-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
