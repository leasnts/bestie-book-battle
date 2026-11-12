import { useEffect, useRef, useState } from 'react';
import type { BookSearchResult } from '../types/bookSearch';

/**
 * Le scan d'un ISBN, branché sur une recherche (useBookSearch) : l'ISBN lu
 * part dans la recherche comme s'il avait été tapé, et son édition, dès
 * qu'elle arrive, est prise d'office (`onFound`), sans second toucher.
 * Pas trouvée : l'ISBN reste dans le champ, la recherche dit qu'elle ne la
 * connaît pas, on peut taper le titre à la place.
 *
 *    const { openScanner, scanner } = useIsbnScan({ setQuery, results, isSearching, onFound: pick });
 *    <IsbnScanner {...scanner} />
 */
export function useIsbnScan({
  setQuery,
  results,
  isSearching,
  onFound,
}: {
  setQuery: (text: string) => void;
  results: BookSearchResult[];
  isSearching: boolean;
  onFound: (book: BookSearchResult) => void;
}) {
  const [visible, setVisible] = useState(false);
  // L'ISBN scanné dont on attend l'édition
  const wanted = useRef<string | null>(null);
  const onFoundRef = useRef(onFound);
  onFoundRef.current = onFound;

  useEffect(() => {
    const isbn = wanted.current;
    if (!isbn || isSearching) return;
    wanted.current = null;
    const found = results.find((book) => book.isbn === isbn);
    if (found) onFoundRef.current(found);
  }, [results, isSearching]);

  const scanner = {
    visible,
    onClose: () => setVisible(false),
    onScan: (isbn: string) => {
      setVisible(false);
      wanted.current = isbn;
      setQuery(isbn);
    },
  };

  return { openScanner: () => setVisible(true), scanner };
}
