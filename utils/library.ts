/**
 * La bibliothèque : état de lecture de chaque livre, et tri des étagères.
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

// ─── Tri ───────────────────────────────────────────────────────────

export type LibrarySort = 'recent' | 'oldest' | 'title';

export const LIBRARY_SORTS: { key: LibrarySort; label: string }[] = [
  { key: 'recent', label: 'Lus récemment' },
  { key: 'oldest', label: 'Plus anciens' },
  { key: 'title', label: 'Titre' },
];

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0);

/**
 * Range les livres selon le tri choisi.
 *
 * - `recent` : dernier livre où j'ai avancé en premier. Les livres jamais
 *   commencés viennent après, du plus récemment ajouté au plus ancien.
 * - `oldest` : dans l'ordre où ils sont entrés dans ma bibliothèque.
 * - `title`  : alphabétique, à la française (accents et casse ignorés).
 */
export function sortBooks(
  books: Challenge[],
  progressById: Record<string, MyBookProgress>,
  sort: LibrarySort,
): Challenge[] {
  // Entrée dans ma bibliothèque : création de ma progression (au moment où
  // j'ai rejoint), à défaut la création du livre
  const addedAt = (book: Challenge) => time(progressById[book.id]?.created_at ?? book.created_at);

  const sorted = [...books];

  if (sort === 'title') {
    sorted.sort((a, b) => a.book_title.localeCompare(b.book_title, 'fr', { sensitivity: 'base' }));
  } else if (sort === 'oldest') {
    sorted.sort((a, b) => addedAt(a) - addedAt(b));
  } else {
    sorted.sort((a, b) => {
      const readA = readingOf(progressById[a.id]).state !== 'unread';
      const readB = readingOf(progressById[b.id]).state !== 'unread';
      if (readA !== readB) return readA ? -1 : 1;
      if (readA) return time(progressById[b.id].last_updated_at) - time(progressById[a.id].last_updated_at);
      return addedAt(b) - addedAt(a);
    });
  }

  return sorted;
}
