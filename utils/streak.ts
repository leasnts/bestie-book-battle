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

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}
