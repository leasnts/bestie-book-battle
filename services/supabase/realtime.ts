/**
 * Service Realtime Supabase
 * 
 * Gère les subscriptions temps réel pour voir les updates en direct :
 * - Progressions des utilisateurs dans un challenge
 * - Nouvel historique de lecture
 */

import { supabase } from '../../supabaseConfig';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  UserProgress,
  ProgressHistory,
} from '../../types/supabase';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimePayload<T = any> {
  eventType: RealtimeEvent;
  new: T;
  old: T;
  errors: any;
}

const activeChannels = new Map<string, RealtimeChannel>();

/**
 * Se désabonner et nettoyer un channel
 */
export async function unsubscribeChannel(channelName: string): Promise<void> {
  const channel = activeChannels.get(channelName);
  if (channel) {
    await supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  }
}

/**
 * Se désabonner de tous les channels actifs
 * Utile lors de la déconnexion ou du changement de page
 */
export async function unsubscribeAll(): Promise<void> {
  for (const [, channel] of activeChannels.entries()) {
    await supabase.removeChannel(channel);
  }
  activeChannels.clear();
}

/**
 * S'abonner aux changements de progression d'un challenge
 * 
 * Permet de voir en temps réel quand quelqu'un met à jour ses pages.
 * Pour les événements UPDATE, oldProgress contient l'état précédent.
 */
export function subscribeToChallengeProgress(
  challengeId: string,
  onUpdate: (
    progress: UserProgress,
    event: RealtimeEvent,
    oldProgress?: UserProgress | null
  ) => void
): () => void {
  const channelName = `progress:${challengeId}`;

  if (activeChannels.has(channelName)) {
    unsubscribeChannel(channelName);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `challenge_id=eq.${challengeId}`,
      },
      (payload: RealtimePayload<UserProgress>) => {
        const old = payload.eventType === 'UPDATE' ? payload.old : null;
        onUpdate(payload.new, payload.eventType, old);
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  return () => {
    unsubscribeChannel(channelName);
  };
}

/**
 * S'abonner au nouvel historique d'un challenge
 * 
 * Permet de voir en temps réel les nouvelles lectures ajoutées.
 */
export function subscribeToChallengeHistory(
  challengeId: string,
  onNewEntry: (entry: ProgressHistory) => void
): () => void {
  const channelName = `history:${challengeId}`;

  if (activeChannels.has(channelName)) {
    unsubscribeChannel(channelName);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'progress_history',
        filter: `challenge_id=eq.${challengeId}`,
      },
      (payload: RealtimePayload<ProgressHistory>) => {
        onNewEntry(payload.new);
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  return () => {
    unsubscribeChannel(channelName);
  };
}
