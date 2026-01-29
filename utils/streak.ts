/**
 * Utilitaires pour le calcul des streaks
 * 
 * Un streak représente le nombre de jours consécutifs de lecture.
 * Il se reset si l'utilisateur ne lit pas pendant plus de 24h.
 */

import { ProgressEntry } from '../types';

/**
 * Calcule le streak actuel basé sur l'historique
 * 
 * Cette fonction parcourt l'historique de lecture en partant
 * de la fin et compte les jours consécutifs avec au moins une lecture.
 * 
 * @param history - L'historique de progression
 * @returns Le nombre de jours consécutifs
 */
export function calculateStreakFromHistory(history: ProgressEntry[]): number {
  if (history.length === 0) {
    return 0;
  }
  
  // Trie par date décroissante
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Regroupe les entrées par jour
  const entriesByDay = groupEntriesByDay(sortedHistory);
  const days = Object.keys(entriesByDay).sort().reverse();
  
  if (days.length === 0) {
    return 0;
  }
  
  // Vérifie si le dernier jour de lecture est aujourd'hui ou hier
  const today = getDateString(new Date());
  const yesterday = getDateString(getYesterday());
  
  const lastReadDay = days[0];
  
  // Si le dernier jour de lecture n'est ni aujourd'hui ni hier, streak = 0
  if (lastReadDay !== today && lastReadDay !== yesterday) {
    return 0;
  }
  
  // Compte les jours consécutifs
  let streak = 0;
  let currentDate = lastReadDay === today ? new Date() : getYesterday();
  
  for (const day of days) {
    const expectedDay = getDateString(currentDate);
    
    if (day === expectedDay) {
      streak++;
      currentDate = getPreviousDay(currentDate);
    } else if (day < expectedDay) {
      // Jour manquant, on arrête
      break;
    }
    // Si day > expectedDay, on continue (peut arriver avec des fuseaux horaires)
  }
  
  return streak;
}

/**
 * Vérifie si le streak est maintenu aujourd'hui
 * 
 * @param lastStreakDate - La dernière date de lecture
 * @returns true si l'utilisateur a lu aujourd'hui ou hier
 */
export function isStreakActive(lastStreakDate: Date | undefined): boolean {
  if (!lastStreakDate) {
    return false;
  }
  
  const today = getDateString(new Date());
  const yesterday = getDateString(getYesterday());
  const lastRead = getDateString(new Date(lastStreakDate));
  
  return lastRead === today || lastRead === yesterday;
}

/**
 * Retourne le prochain streak (si l'utilisateur lit maintenant)
 * 
 * @param currentStreak - Le streak actuel
 * @param lastStreakDate - La dernière date de lecture
 * @returns Le nouveau streak
 */
export function getNextStreak(
  currentStreak: number,
  lastStreakDate: Date | undefined
): number {
  if (!lastStreakDate) {
    return 1; // Premier jour
  }
  
  const today = getDateString(new Date());
  const yesterday = getDateString(getYesterday());
  const lastRead = getDateString(new Date(lastStreakDate));
  
  if (lastRead === today) {
    // Déjà lu aujourd'hui, pas de changement
    return currentStreak;
  } else if (lastRead === yesterday) {
    // Lu hier, on continue le streak
    return currentStreak + 1;
  } else {
    // Plus d'un jour sans lire, reset
    return 1;
  }
}

/**
 * Génère un message d'encouragement basé sur le streak
 * 
 * @param streak - Le nombre de jours consécutifs
 * @returns Un message personnalisé
 */
export function getStreakMessage(streak: number): string {
  if (streak === 0) {
    return 'Commence ta série de lecture !';
  } else if (streak === 1) {
    return 'Premier jour ! Continue demain !';
  } else if (streak < 3) {
    return `${streak} jours ! Bon début !`;
  } else if (streak < 7) {
    return `${streak} jours ! Tu prends le rythme !`;
  } else if (streak < 14) {
    return `${streak} jours ! 🔥 Une semaine !`;
  } else if (streak < 30) {
    return `${streak} jours ! 🔥 Impressionnant !`;
  } else if (streak < 100) {
    return `${streak} jours ! 🔥🔥 Incroyable !`;
  } else {
    return `${streak} jours ! 🔥🔥🔥 Légendaire !`;
  }
}

/**
 * Génère l'affichage du streak avec les bonnes flammes
 * 
 * @param streak - Le nombre de jours consécutifs
 * @returns L'affichage formaté (ex: "🔥 5" ou "🔥🔥 30")
 */
export function formatStreak(streak: number): string {
  if (streak === 0) {
    return '0';
  }
  
  let flames = '🔥';
  if (streak >= 7) flames = '🔥🔥';
  if (streak >= 30) flames = '🔥🔥🔥';
  
  return `${flames} ${streak}`;
}

// ============================================
// HELPERS
// ============================================

/**
 * Convertit une date en string format YYYY-MM-DD
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Retourne la date d'hier
 */
function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

/**
 * Retourne la date du jour précédent
 */
function getPreviousDay(date: Date): Date {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return previous;
}

/**
 * Regroupe les entrées d'historique par jour
 */
function groupEntriesByDay(
  entries: ProgressEntry[]
): Record<string, ProgressEntry[]> {
  const grouped: Record<string, ProgressEntry[]> = {};
  
  for (const entry of entries) {
    const day = getDateString(new Date(entry.date));
    
    if (!grouped[day]) {
      grouped[day] = [];
    }
    
    grouped[day].push(entry);
  }
  
  return grouped;
}

