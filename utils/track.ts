/**
 * La piste du livre : calculs.
 *
 * Que du calcul, pas de JSX — pour que les repères de l'accueil (`GoalTrack`) et
 * ceux de la fiche du livre disent exactement la même chose.
 *
 * Tout est en **pourcentage du livre** : chacun lit son édition, seule la part
 * lue se compare (DESIGN.md › Pages ou %).
 */

import type { ChallengeGoal } from '../types/supabase';

/** Un cap posé sur la piste */
export interface TrackCap {
  id: string;
  /** Position sur la piste, de 0 à 100 */
  percent: number;
  /** Date visée */
  deadline: string;
  /**
   * `current` : le cap en cours, seul à porter un drapeau et une date.
   * `past` : sa date est passée — un simple point, atteint ou non. Jamais de rouge.
   * `future` : cap planifié à l'avance (#38), pas encore utilisé.
   */
  state: 'past' | 'current' | 'future';
}

/**
 * Avancée du club : la **médiane** des pourcentages, pas la moyenne.
 *
 * Trois lectrices très rapides suffiraient à tirer une moyenne vers le haut et à
 * donner l'impression que tout le monde est loin devant. La médiane dit « la
 * moitié du club est ici », ce qui est le repère qu'on cherche.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Position d'un cap sur la piste.
 *
 * Un cap est enregistré en pages de l'**édition de référence** du challenge :
 * on le convertit en % pour qu'il tombe au même endroit pour tout le monde.
 */
export function capPercent(targetPages: number, referenceTotalPages: number): number {
  if (!referenceTotalPages) return 0;
  return clamp((targetPages / referenceTotalPages) * 100);
}

/** Combien de membres ont atteint le cap (le « 9 » de « Cap · 9/38 ») */
export function countAtCap(percentages: number[], cap: number): number {
  return percentages.filter((percentage) => percentage >= cap).length;
}

/**
 * Les caps à poser sur la piste, du plus ancien au plus récent.
 *
 * `createGoal` archive le cap précédent à chaque création : le statut `archived`
 * mélange donc « remplacé » et « passé ». On se fie uniquement à la **date**
 * (voir #38), et un cap dont la date est passée devient un point neutre.
 */
export function buildCaps(
  goals: (ChallengeGoal | null | undefined)[],
  referenceTotalPages: number,
  now: Date = new Date(),
): TrackCap[] {
  const caps = goals
    .filter((goal): goal is ChallengeGoal => goal != null && goal.type === 'secondary')
    .map((goal) => ({
      id: goal.id,
      percent: capPercent(goal.target_pages, referenceTotalPages),
      deadline: goal.deadline,
      state: (new Date(goal.deadline) < now ? 'past' : 'current') as TrackCap['state'],
    }))
    .sort((a, b) => a.percent - b.percent);

  // Un seul cap en cours à la fois : le plus proche dans le temps. Les autres
  // caps à venir attendent #38 (caps planifiés).
  const upcoming = caps.filter((cap) => cap.state === 'current');
  const current = upcoming.reduce<TrackCap | null>(
    (closest, cap) =>
      closest && new Date(closest.deadline) <= new Date(cap.deadline) ? closest : cap,
    null,
  );

  return caps.map((cap) =>
    cap.state === 'current' && cap.id !== current?.id ? { ...cap, state: 'future' } : cap,
  );
}

/** Jours restants avant une date. Négatif = date dépassée. */
export function daysLeft(deadline: string | null | undefined, now: Date = new Date()): number | null {
  if (!deadline) return null;
  const end = new Date(deadline);
  if (Number.isNaN(end.getTime())) return null;
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = startOfDay(end).getTime() - startOfDay(now).getTime();
  return Math.round(diff / 86_400_000);
}

/** Date courte des repères de la piste : « 20 sept. » */
export function formatTrackDate(deadline: string): string {
  return new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
