/**
 * Clubs (#238) : les lectures d'un club, parmi les miennes.
 */

import type { Challenge } from '../types/supabase';

/**
 * La lecture en cours d'un club et ses lectures passées.
 *
 * En cours = la plus récente pas terminée (un club n'en a d'habitude qu'une ;
 * s'il en a deux, l'autre reste dans la bibliothèque). Passées = toutes les
 * autres, de la plus récente à la plus ancienne.
 */
export function clubReadings(challenges: Challenge[], clubId: string | null | undefined) {
  const mine = challenges
    .filter((c) => !!clubId && c.club_id === clubId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const current = mine.find((c) => c.status !== 'completed') ?? mine[0] ?? null;
  return { current, past: mine.filter((c) => c !== current) };
}
