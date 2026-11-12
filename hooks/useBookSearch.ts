import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchEditions, findByIsbn, isEdition, searchBooks, searchCatalog } from '../services/bookApi';
import type { BookSearchResult } from '../types/bookSearch';
import { parseIsbn } from '../utils/isbn';
import { compactText } from '../utils/normalizeText';

/** Assez court pour suivre la frappe, assez long pour ne pas chercher chaque lettre */
const DEBOUNCE_MS = 250;

/** Combien de livres, en tête de liste, sont dépliés en leurs éditions */
const EXPANDED = 5;

/**
 * Recherche de livres au fil de la frappe.
 *
 * - Les livres des étagères qui correspondent s'affichent tout de suite
 *   (catalogue local), la recherche en ligne complète ensuite.
 * - Les résultats précédents restent affichés pendant qu'on tape : la liste
 *   se met à jour, elle ne se vide pas à chaque lettre.
 * - Une recherche dépassée par la frappe est annulée : jamais de résultats
 *   d'un mot précédent qui arrivent en retard.
 * - `editions` : les premiers livres sont remplacés par leurs éditions
 *   (éditeur, année, pages) dès que Google les donne, pour choisir la sienne
 *   d'un seul toucher. Un livre sans édition connue reste tel quel.
 * - Un ISBN (tapé ou scanné) : son édition seule, sans le catalogue ni Apple.
 */
export function useBookSearch({ editions = false }: { editions?: boolean } = {}) {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const cancelPending = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const setQuery = useCallback(
    (text: string) => {
      setQueryState(text);
      setError(null);
      cancelPending();

      if (!text.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      // Un ISBN : son édition, et rien d'autre
      const isbn = parseIsbn(text);
      if (isbn) {
        setResults([]);
        setIsSearching(true);
        const controller = new AbortController();
        abortRef.current = controller;
        findByIsbn(isbn, controller.signal)
          .then((book) => {
            if (!controller.signal.aborted) setResults(book ? [book] : []);
          })
          .catch((e) => {
            if (controller.signal.aborted) return;
            console.warn('ISBN search error:', e);
            setError('Recherche indisponible');
          })
          .finally(() => {
            if (!controller.signal.aborted) setIsSearching(false);
          });
        return;
      }

      // Tout de suite : les livres des étagères, devant les résultats précédents
      const local = searchCatalog(text);
      if (local.length > 0) setResults((previous) => mergeBooks(local, previous));
      setIsSearching(true);

      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const books = await searchBooks(text, { signal: controller.signal });
          if (controller.signal.aborted) return;
          setResults(mergeBooks(local, books));
        } catch (e) {
          if (controller.signal.aborted) return;
          console.warn('Book search error:', e);
          setError('Recherche indisponible');
          setResults(local);
        } finally {
          if (!controller.signal.aborted) setIsSearching(false);
        }
      }, DEBOUNCE_MS);
    },
    [cancelPending],
  );

  const clearResults = useCallback(() => {
    cancelPending();
    setQueryState('');
    setResults([]);
    setIsSearching(false);
    setError(null);
  }, [cancelPending]);

  // Les éditions des premiers livres, par livre, au fil des réponses de Google
  const [editionsByBook, setEditionsByBook] = useState<Record<string, BookSearchResult[]>>({});
  useEffect(() => {
    if (!editions) return;
    let live = true;
    results.slice(0, EXPANDED).filter((book) => !isEdition(book)).forEach((book) =>
      fetchEditions(book).then((found) => {
        if (live && found.length > 0) setEditionsByBook((known) => ({ ...known, [bookKey(book)]: found }));
      }),
    );
    return () => {
      live = false;
    };
  }, [editions, results]);

  const shown = useMemo(() => {
    if (!editions) return results;
    // Deux fiches Apple du même livre ont les mêmes éditions : chacune une seule fois
    const seen = new Set<string>();
    return results
      .flatMap((book, index) => (index < EXPANDED && !isEdition(book) && editionsByBook[bookKey(book)]) || [book])
      .filter((book) => !seen.has(book.id) && !!seen.add(book.id));
  }, [editions, results, editionsByBook]);

  return { query, setQuery, results: shown, isSearching, error, clearResults };
}

/** Les livres de `first` d'abord, puis ceux de `rest` qui n'y sont pas déjà */
function mergeBooks(first: BookSearchResult[], rest: BookSearchResult[]): BookSearchResult[] {
  const seen = new Set(first.map(bookKey));
  return [...first, ...rest.filter((book) => !seen.has(bookKey(book)))];
}

function bookKey(book: BookSearchResult): string {
  return `${compactText(book.title)}|${compactText(book.author)}`;
}
