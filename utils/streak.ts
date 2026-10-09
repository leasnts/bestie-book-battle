/**
 * Utilitaires pour les streaks de lecture
 * 
 * Le calcul du streak est géré côté Supabase (trigger update_streak).
 * Ce fichier contient uniquement les helpers côté client.
 */

/**
 * Retourne le nombre de jours de streak actif.
 *
 * Le `streak_count` en base n'est jamais réinitialisé automatiquement côté client —
 * il garde l'ancienne valeur même si l'utilisateur n'a pas lu depuis plusieurs jours.
 * Cette fonction retourne 0 si la dernière lecture date d'avant-hier ou plus.
 *
 * Règle :
 * - Dernière lecture = aujourd'hui ou hier → streak vivant → retourne streakCount
 * - Dernière lecture = avant-hier ou plus  → streak mort   → retourne 0
 *
 * @param streakCount    - Valeur brute de la base de données
 * @param lastStreakDate - Dernière date de lecture (YYYY-MM-DD ou ISO)
 */
export function getActiveStreak(
  streakCount: number,
  lastStreakDate: Date | string | undefined | null
): number {
  if (!streakCount || !lastStreakDate) return 0;

  const lastRead =
    typeof lastStreakDate === 'string'
      ? lastStreakDate.split('T')[0]
      : getDateString(new Date(lastStreakDate));
  const today = getDateString(new Date());
  const yesterday = getDateString(getYesterday());

  // Streak vivant si lu aujourd'hui ou hier
  if (lastRead === today || lastRead === yesterday) return streakCount;

  // Sinon la série est morte, on affiche 0
  return 0;
}

/**
 * Vérifie si le streak est en danger (va « mourir » si l'utilisateur ne lit pas aujourd'hui)
 *
 * Streak en danger = l'utilisateur a lu hier mais pas encore aujourd'hui.
 * S'il n'ouvre pas son livre aujourd'hui, le streak sera réinitialisé à minuit.
 *
 * @param lastStreakDate - La dernière date de lecture (YYYY-MM-DD ou Date)
 * @returns true si lastRead = hier (pas lu aujourd'hui)
 */
export function isStreakAtRisk(lastStreakDate: Date | string | undefined | null): boolean {
  if (!lastStreakDate) return false;

  const lastRead =
    typeof lastStreakDate === 'string'
      ? lastStreakDate.split('T')[0]
      : getDateString(new Date(lastStreakDate));
  const today = getDateString(new Date());
  const yesterday = getDateString(getYesterday());

  return lastRead === yesterday && lastRead !== today;
}

/** Marque-pages par livre : de quoi garder sa série malgré un jour manqué */
export const STREAK_BONUS_PER_BOOK = 3;

/**
 * Les quatre états de ma série, ce que dit la gélule de l'accueil :
 * - `active` : lu aujourd'hui, la flamme brûle ;
 * - `atRisk` : lu hier, pas encore aujourd'hui, elle s'éteint à minuit ;
 * - `missed` : hier manqué, mais un marque-page peut encore la garder ;
 * - `inactive` : pas de série.
 *
 * Les jours sont ceux du serveur (UTC), comme le trigger update_streak.
 */
export type StreakState = 'active' | 'atRisk' | 'missed' | 'inactive';

export function getStreakState(
  streakCount: number,
  lastStreakDate: string | null | undefined,
  bonusDates: string[] = [],
): { state: StreakState; days: number } {
  if (!streakCount || !lastStreakDate) return { state: 'inactive', days: 0 };
  const lastRead = lastStreakDate.split('T')[0];
  if (lastRead === dayString(0)) return { state: 'active', days: streakCount };
  if (lastRead === dayString(1)) return { state: 'atRisk', days: streakCount };
  if (lastRead === dayString(2) && bonusesLeft(bonusDates) > 0) {
    return { state: 'missed', days: streakCount };
  }
  return { state: 'inactive', days: 0 };
}

/** Marque-pages qu'il me reste sur ce livre */
export function bonusesLeft(bonusDates: string[] = []): number {
  return Math.max(0, STREAK_BONUS_PER_BOOK - bonusDates.length);
}

/** Le jour d'il y a `daysAgo` jours, en YYYY-MM-DD (UTC, comme le serveur) */
export function dayString(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return getDateString(d);
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}
