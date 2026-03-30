import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTrendingBooks, searchBooks } from '../services/bookApi';
import type { BookSearchResult } from '../types/bookSearch';

const DEBOUNCE_MS = 400;

export function useBookSearch() {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [trending, setTrending] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Charger les trending au premier montage
  useEffect(() => {
    let cancelled = false;
    setIsTrendingLoading(true);

    fetchTrendingBooks()
      .then((books) => {
        if (!cancelled) setTrending(books);
      })
      .catch((e) => {
        console.error('Trending books error:', e);
      })
      .finally(() => {
        if (!cancelled) setIsTrendingLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const setQuery = useCallback((text: string) => {
    setQueryState(text);
    setError(null);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!text.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    timerRef.current = setTimeout(async () => {
      try {
        const books = await searchBooks(text);
        setResults(books);
      } catch (e: any) {
        console.error('Book search error:', e);
        setError('Impossible de rechercher. Vérifie ta connexion.');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const clearResults = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQueryState('');
    setResults([]);
    setIsSearching(false);
    setError(null);
  }, []);

  return { query, setQuery, results, trending, isSearching, isTrendingLoading, error, clearResults };
}
