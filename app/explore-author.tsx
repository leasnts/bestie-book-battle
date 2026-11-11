/**
 * Route /explore-author — les livres d'un·e auteur·ice, sheet posé sur la fiche
 * d'un livre d'Explorer.
 *
 *    ┌────────────────────────────────┐
 *    │ (‹) Rebecca Yarros             │  ← retour : la fiche d'où l'on vient
 *    │ ▐█▌ Fourth Wing                │
 *    │ ▐█▌ Iron Flame                 │
 *    └────────────────────────────────┘
 *
 * Toucher un livre remplace celui de la fiche en dessous et y revient : on
 * reste dans le même fil, jamais renvoyé·e dans l'onglet avec une recherche
 * déjà tapée.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import BookResultRow, { BookResultSkeleton } from '../components/ui/BookResultRow';
import SheetPage from '../components/ui/SheetPage';
import { useBookSearch } from '../hooks/useBookSearch';
import { useExploreStore } from '../stores/exploreStore';
import type { BookSearchResult } from '../types/bookSearch';
import { colors, fonts, spacing } from '../utils/constants';
import { compactText } from '../utils/normalizeText';

export default function ExploreAuthorRoute() {
  const router = useRouter();
  const { name = '' } = useLocalSearchParams<{ name?: string }>();
  const openBook = useExploreStore((state) => state.openBook);
  const { setQuery, results, isSearching, error } = useBookSearch();

  useEffect(() => {
    if (name) setQuery(name);
  }, [name, setQuery]);

  // Seulement ses livres : une recherche par nom remonte aussi des livres qui le citent
  const books = useMemo(() => {
    const key = compactText(name);
    const hers = results.filter((book) => compactText(book.author ?? '').includes(key));
    return hers.length > 0 ? hers : results;
  }, [results, name]);

  const handleOpen = (book: BookSearchResult) => {
    openBook(book);
    router.back();
  };

  return (
    <SheetPage title={name} onBack={() => router.back()}>
      {books.length > 0 ? (
        books.map((book) => <BookResultRow key={book.id} book={book} hideAuthor onPress={() => handleOpen(book)} />)
      ) : isSearching ? (
        <>
          <BookResultSkeleton />
          <BookResultSkeleton />
          <BookResultSkeleton />
        </>
      ) : (
        <Text style={styles.empty}>{error ?? 'Aucun livre'}</Text>
      )}
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: spacing['2xl'],
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textTertiary,
  },
});
