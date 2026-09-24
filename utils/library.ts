/**
 * La bibliothèque : état de lecture de chaque livre, filtres et ordre des étagères.
 *
 * Tout part de MA progression (table `user_progress`), jamais de celle du club :
 * un livre que le club a fini mais pas moi reste « en cours » dans ma bibliothèque.
 */

import { Challenge, MyBookProgress } from '../types/supabase';

// ─── État de lecture ───────────────────────────────────────────────

export type ReadingState = 'unread' | 'reading' | 'done';

/** Où j'en suis d'un livre */
export interface BookReading {
  state: ReadingState;
  /** Mon avancement, 0 à 100, arrondi */
  percent: number;
}

/** Pas de progression = pas commencé ; 100 % = terminé ; entre les deux = en cours */
export function readingOf(progress: MyBookProgress | undefined): BookReading {
  if (!progress || progress.current_page <= 0) return { state: 'unread', percent: 0 };
  const percent = Math.min(100, Math.round(progress.progress_percentage));
  if (percent >= 100) return { state: 'done', percent: 100 };
  // Une page lue ne doit jamais s'afficher « 0 % » : le livre est bien commencé
  return { state: 'reading', percent: Math.max(1, percent) };
}

/** « en cours, 42 % » — ce que VoiceOver lit après le titre */
export function readingLabel({ state, percent }: BookReading): string {
  if (state === 'done') return 'terminé';
  if (state === 'reading') return `en cours, ${percent} %`;
  return 'pas commencé';
}

// ─── Filtre ────────────────────────────────────────────────────────

export type LibraryFilter = 'all' | ReadingState;

export const LIBRARY_FILTERS: { key: LibraryFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'reading', label: 'En cours' },
  { key: 'unread', label: 'Non lus' },
  { key: 'done', label: 'Lus' },
];

// ─── Ordre ─────────────────────────────────────────────────────────

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0);

/**
 * Entrée d'un livre dans ma bibliothèque : création de ma progression (au moment
 * où j'ai rejoint), à défaut la création du livre
 */
function addedAt(book: Challenge, progressById: Record<string, MyBookProgress>): number {
  return time(progressById[book.id]?.created_at ?? book.created_at);
}

/**
 * Le livre à marquer « Nouveau » : le dernier ajouté à ma bibliothèque, tant que
 * je ne l'ai pas commencé. `null` si ce dernier livre est déjà entamé.
 */
export function newBookId(
  books: Challenge[],
  progressById: Record<string, MyBookProgress>,
): string | null {
  let latest: Challenge | null = null;
  for (const book of books) {
    if (!latest || addedAt(book, progressById) > addedAt(latest, progressById)) latest = book;
  }
  if (!latest || readingOf(progressById[latest.id]).state !== 'unread') return null;
  return latest.id;
}

/**
 * Range les livres : celui qui a bougé le plus récemment en premier. Compte ma
 * dernière progression ET celle du club : `updated_at` du livre est remis à
 * jour dès qu'un membre avance (trigger `update_challenge_stats`).
 *
 * Plus de choix de tri : les filtres (Tout, En cours, Non lus, Lus) l'ont remplacé.
 */
export function sortBooks(
  books: Challenge[],
  progressById: Record<string, MyBookProgress>,
): Challenge[] {
  const activityAt = (book: Challenge) =>
    Math.max(time(book.updated_at), time(progressById[book.id]?.last_updated_at));
  return [...books].sort((a, b) => activityAt(b) - activityAt(a));
}
