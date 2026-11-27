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

// ─── Lectures d'un club : en cours, « Ensuite », finies (#238, PAL) ────────

/** « 2026-12-10 » plus tard qu'aujourd'hui : la lecture n'a pas commencé */
export function startsLater(challenge: Pick<Challenge, 'starts_on'>, today = new Date()): boolean {
  if (!challenge.starts_on) return false;
  const [y, m, d] = challenge.starts_on.split('-').map(Number);
  return new Date(y, m - 1, d).getTime() > new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
}

/**
 * Les lectures d'un club (toutes, même celles que je ne lis pas), rangées :
 * - `current` : commencée et pas finie, la plus récente
 * - `next` : choisie dans la PAL, démarre plus tard (« Ensuite »)
 * - `past` : finies, la plus récente d'abord
 * - `ended` : la lecture en cours a passé sa date de fin, ou il n'y en a plus :
 *   l'heure de choisir la suite
 */
export function clubSchedule(readings: Challenge[], today = new Date()) {
  const next = readings.find((c) => c.status !== 'completed' && startsLater(c, today)) ?? null;
  const current = readings.find((c) => c.status !== 'completed' && !startsLater(c, today)) ?? null;
  const past = readings.filter((c) => c.status === 'completed');
  const endDay = current?.target_end_date ? new Date(current.target_end_date) : null;
  const ended =
    !current ||
    (endDay !== null &&
      new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate()).getTime() <
        new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime());
  return { current, next, past, ended };
}
