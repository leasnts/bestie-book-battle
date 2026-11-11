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
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import BookResultRow, { BookResultSkeleton } from '../components/ui/BookResultRow';
import SheetPage from '../components/ui/SheetPage';
import { fetchAuthorBooks } from '../services/bookApi';
import { useExploreStore } from '../stores/exploreStore';
import type { BookSearchResult } from '../types/bookSearch';
import { colors, fonts, spacing } from '../utils/constants';

export default function ExploreAuthorRoute() {
  const router = useRouter();
  const { name = '' } = useLocalSearchParams<{ name?: string }>();
  const openBook = useExploreStore((state) => state.openBook);
  // Les mêmes que le compte de la fiche (même recherche, en cache)
  const [books, setBooks] = useState<BookSearchResult[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    fetchAuthorBooks(name)
      .then((found) => !cancelled && setBooks(found))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [name]);

  const handleOpen = (book: BookSearchResult) => {
    openBook(book);
    router.back();
  };

  return (
    <SheetPage title={name} onBack={() => router.back()}>
      {books?.length ? (
        books.map((book) => <BookResultRow key={book.id} book={book} hideAuthor onPress={() => handleOpen(book)} />)
      ) : !books && !error ? (
        <>
          <BookResultSkeleton />
          <BookResultSkeleton />
          <BookResultSkeleton />
        </>
      ) : (
        <Text style={styles.empty}>{error ? 'Recherche indisponible' : 'Aucun livre'}</Text>
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
