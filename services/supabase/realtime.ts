/**
 * Service Realtime Supabase
 * 
 * Gère les subscriptions temps réel pour voir les updates en direct :
 * - Progressions des utilisateurs dans un challenge
 * - Nouveaux participants
 * - Modifications du challenge
 * - Nouvel historique
 */

import { supabase } from '../../supabaseConfig';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  UserProgress,
  Challenge,
  ChallengeParticipant,
  ProgressHistory,
} from '../../types/supabase';

/**
 * Type des événements possibles
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/**
 * Interface pour un payload de changement
 */
interface RealtimePayload<T = any> {
  eventType: RealtimeEvent;
  new: T;
  old: T;
  errors: any;
}

// =====================================================
// GESTION DES CHANNELS
// =====================================================

/**
 * Map pour stocker les channels actifs
 * Évite de créer plusieurs subscriptions pour le même channel
 */
const activeChannels = new Map<string, RealtimeChannel>();

/**
 * Se désabonner et nettoyer un channel
 * 
 * @param channelName - Le nom du channel à nettoyer
 */
export async function unsubscribeChannel(channelName: string): Promise<void> {
  const channel = activeChannels.get(channelName);
  if (channel) {
    await supabase.removeChannel(channel);
    activeChannels.delete(channelName);
    console.log(`Channel ${channelName} unsubscribed`);
  }
}

/**
 * Se désabonner de tous les channels actifs
 * 
 * Utile lors de la déconnexion ou du changement de page
 */
export async function unsubscribeAll(): Promise<void> {
  for (const [channelName, channel] of activeChannels.entries()) {
    await supabase.removeChannel(channel);
    console.log(`Channel ${channelName} unsubscribed`);
  }
  activeChannels.clear();
}

// =====================================================
// SUBSCRIPTIONS POUR LES CHALLENGES
// =====================================================

/**
 * S'abonner aux changements d'un challenge
 * 
 * Écoute :
 * - Les mises à jour du challenge (titre, statut, etc.)
 * 
 * @param challengeId - L'ID du challenge
 * @param onUpdate - Fonction appelée quand le challenge change
 * @returns Fonction pour se désabonner
 */
export function subscribeToChallengeUpdates(
  challengeId: string,
  onUpdate: (challenge: Challenge) => void
): () => void {
  const channelName = `challenge:${challengeId}`;

  // Si un channel existe déjà, le nettoyer d'abord
  if (activeChannels.has(channelName)) {
    unsubscribeChannel(channelName);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'challenges',
        filter: `id=eq.${challengeId}`,
      },
      (payload: RealtimePayload<Challenge>) => {
        console.log('Challenge updated:', payload.new);
        onUpdate(payload.new);
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  // Retourner une fonction pour se désabonner
  return () => {
    unsubscribeChannel(channelName);
  };
}

// =====================================================
// SUBSCRIPTIONS POUR LES PROGRESSIONS
// =====================================================

/**
 * S'abonner aux changements de progression d'un challenge
 * 
 * Écoute :
 * - Les mises à jour de progression de tous les participants
 * - Les nouvelles progressions (nouveaux participants)
 * 
 * Permet de voir en temps réel quand quelqu'un met à jour ses pages.
 * 
 * @param challengeId - L'ID du challenge
 * @param onUpdate - Fonction appelée quand une progression change
 * @returns Fonction pour se désabonner
 */
export function subscribeToChallengeProgress(
  challengeId: string,
  onUpdate: (progress: UserProgress, event: RealtimeEvent) => void
): () => void {
  const channelName = `progress:${challengeId}`;

  // Si un channel existe déjà, le nettoyer d'abord
  if (activeChannels.has(channelName)) {
    unsubscribeChannel(channelName);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*', // Écouter tous les événements (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'user_progress',
        filter: `challenge_id=eq.${challengeId}`,
      },
      (payload: RealtimePayload<UserProgress>) => {
        console.log('Progress updated:', payload.eventType, payload.new);
        onUpdate(payload.new, payload.eventType);
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  // Retourner une fonction pour se désabonner
  return () => {
    unsubscribeChannel(channelName);
  };
}

/**
 * S'abonner aux changements de progression d'un utilisateur spécifique
 * 
 * Utile pour voir sa propre progression en temps réel si elle est
 * mise à jour depuis un autre appareil.
 * 
 * @param challengeId - L'ID du challenge
 * @param userId - L'ID de l'utilisateur
 * @param onUpdate - Fonction appelée quand la progression change
 * @returns Fonction pour se désabonner
 */
export function subscribeToUserProgress(
  challengeId: string,
  userId: string,
  onUpdate: (progress: UserProgress) => void
): () => void {
  const channelName = `progress:${challengeId}:${userId}`;

  // Si un channel existe déjà, le nettoyer d'abord
  if (activeChannels.has(channelName)) {
    unsubscribeChannel(channelName);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_progress',
        filter: `challenge_id=eq.${challengeId},user_id=eq.${userId}`,
      },
      (payload: RealtimePayload<UserProgress>) => {
        console.log('User progress updated:', payload.new);
        onUpdate(payload.new);
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  // Retourner une fonction pour se désabonner
  return () => {
    unsubscribeChannel(channelName);
  };
}

// =====================================================
// SUBSCRIPTIONS POUR LES PARTICIPANTS
// =====================================================

/**
 * S'abonner aux changements de participants d'un challenge
 * 
 * Écoute :
 * - L'ajout de nouveaux participants
 * - Le retrait de participants
 * 
 * Permet de voir en temps réel quand quelqu'un rejoint ou quitte le challenge.
 * 
 * @param challengeId - L'ID du challenge
 * @param onParticipantJoined - Fonction appelée quand quelqu'un rejoint
 * @param onParticipantLeft - Fonction appelée quand quelqu'un quitte
 * @returns Fonction pour se désabonner
 */
export function subscribeToChallengeParticipants(
  challengeId: string,
  onParticipantJoined: (participant: ChallengeParticipant) => void,
  onParticipantLeft: (participant: ChallengeParticipant) => void
): () => void {
  const channelName = `participants:${challengeId}`;

  // Si un channel existe déjà, le nettoyer d'abord
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
        table: 'challenge_participants',
        filter: `challenge_id=eq.${challengeId}`,
      },
      (payload: RealtimePayload<ChallengeParticipant>) => {
        console.log('Participant joined:', payload.new);
        onParticipantJoined(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'challenge_participants',
        filter: `challenge_id=eq.${challengeId}`,
      },
      (payload: RealtimePayload<ChallengeParticipant>) => {
        console.log('Participant left:', payload.old);
        onParticipantLeft(payload.old);
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  // Retourner une fonction pour se désabonner
  return () => {
    unsubscribeChannel(channelName);
  };
}

// =====================================================
// SUBSCRIPTIONS POUR L'HISTORIQUE
// =====================================================

/**
 * S'abonner au nouvel historique d'un challenge
 * 
 * Écoute :
 * - Les nouvelles entrées d'historique de tous les participants
 * 
 * Permet de voir en temps réel les nouvelles lectures ajoutées.
 * 
 * @param challengeId - L'ID du challenge
 * @param onNewEntry - Fonction appelée quand une nouvelle entrée est ajoutée
 * @returns Fonction pour se désabonner
 */
export function subscribeToChallengeHistory(
  challengeId: string,
  onNewEntry: (entry: ProgressHistory) => void
): () => void {
  const channelName = `history:${challengeId}`;

  // Si un channel existe déjà, le nettoyer d'abord
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
        console.log('New history entry:', payload.new);
        onNewEntry(payload.new);
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);

  // Retourner une fonction pour se désabonner
  return () => {
    unsubscribeChannel(channelName);
  };
}

// =====================================================
// SUBSCRIPTION COMPLÈTE POUR UN CHALLENGE
// =====================================================

/**
 * Interface pour les callbacks de subscription complète
 */
interface ChallengeRealtimeCallbacks {
  onChallengeUpdate?: (challenge: Challenge) => void;
  onProgressUpdate?: (progress: UserProgress, event: RealtimeEvent) => void;
  onParticipantJoined?: (participant: ChallengeParticipant) => void;
  onParticipantLeft?: (participant: ChallengeParticipant) => void;
  onNewHistoryEntry?: (entry: ProgressHistory) => void;
}

/**
 * S'abonner à tous les changements d'un challenge
 * 
 * Écoute simultanément :
 * - Les mises à jour du challenge
 * - Les changements de progression
 * - L'ajout/retrait de participants
 * - Les nouvelles entrées d'historique
 * 
 * C'est la fonction la plus complète pour suivre un challenge en temps réel.
 * Idéale pour la page de détail du challenge.
 * 
 * @param challengeId - L'ID du challenge
 * @param callbacks - Les fonctions de callback pour chaque type d'événement
 * @returns Fonction pour se désabonner de tout
 */
export function subscribeToChallenge(
  challengeId: string,
  callbacks: ChallengeRealtimeCallbacks
): () => void {
  const unsubscribers: (() => void)[] = [];

  // S'abonner au challenge
  if (callbacks.onChallengeUpdate) {
    const unsub = subscribeToChallengeUpdates(challengeId, callbacks.onChallengeUpdate);
    unsubscribers.push(unsub);
  }

  // S'abonner aux progressions
  if (callbacks.onProgressUpdate) {
    const unsub = subscribeToChallengeProgress(challengeId, callbacks.onProgressUpdate);
    unsubscribers.push(unsub);
  }

  // S'abonner aux participants
  if (callbacks.onParticipantJoined || callbacks.onParticipantLeft) {
    const unsub = subscribeToChallengeParticipants(
      challengeId,
      callbacks.onParticipantJoined || (() => {}),
      callbacks.onParticipantLeft || (() => {})
    );
    unsubscribers.push(unsub);
  }

  // S'abonner à l'historique
  if (callbacks.onNewHistoryEntry) {
    const unsub = subscribeToChallengeHistory(challengeId, callbacks.onNewHistoryEntry);
    unsubscribers.push(unsub);
  }

  // Retourner une fonction pour tout désabonner
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Obtenir le statut de connexion Realtime
 * 
 * @returns true si connecté, false sinon
 */
export function isRealtimeConnected(): boolean {
  // Supabase ne fournit pas directement cette info, mais on peut vérifier
  // si on a des channels actifs
  return activeChannels.size > 0;
}

/**
 * Obtenir le nombre de channels actifs
 * 
 * @returns Le nombre de subscriptions actives
 */
export function getActiveChannelsCount(): number {
  return activeChannels.size;
}

/**
 * Logger tous les channels actifs (pour le debug)
 */
export function logActiveChannels(): void {
  console.log('Active channels:', Array.from(activeChannels.keys()));
}
