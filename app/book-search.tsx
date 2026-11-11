/**
 * Route /book-search — trouver un livre (onboarding : créer un bbb, ou trouver
 * mon édition). `?q=` pré-remplit la recherche.
 *
 *    ┌───────────────────────────────────┐
 *    │ Rechercher                        │
 *    │ ( 🔍 l'étranger                ✕ )│
 *    │ ▐██▌ L'Étranger  DigiCat, 2022    │   chaque édition est un résultat :
 *    │ ▐██▌ L'Étranger  Gallimard, 2005  │   un toucher, et on a la sienne
 *    └───────────────────────────────────┘
 *
 * Recherche au fil de la frappe (useBookSearch), les premiers livres dépliés
 * en leurs éditions papier (Google Books) pour avoir les pages. Avant de taper,
 * les livres du moment : touché, l'un d'eux arrive avec sa première édition.
 *
 * Sheet natif (`SheetPage`) à palier haut : le clavier et les résultats.
 * Le livre choisi est déposé dans le store de l'onboarding (`bookPick`) : c'est
 * l'écran d'en dessous qui le reprend en revenant au premier plan.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleXIcon, SearchIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import BookResultRow, { BookResultSkeleton } from '../components/ui/BookResultRow';
import SheetPage from '../components/ui/SheetPage';
import { useBookSearch } from '../hooks/useBookSearch';
import { fetchEditions, TRENDING_BOOKS } from '../services/bookApi';
import { useOnboardingStore, type BookPickTarget } from '../stores/onboardingStore';
import type { BookSearchResult } from '../types/bookSearch';
import { borderRadius, colors, fonts, fontSize, shadows, spacing } from '../utils/constants';

export default function BookSearchRoute() {
  const router = useRouter();
  // `for` : l'écran qui attend le livre (le livre lui-même, ou une autre édition)
  const { q, for: target = 'livre' } = useLocalSearchParams<{ q?: string; for?: BookPickTarget }>();
  const { query, setQuery, results, isSearching, error, clearResults } = useBookSearch({ editions: true });
  const inputRef = useRef<TextInputInstance>(null);

  // Le dernier livre touché : un second toucher entre-temps remplace le premier
  const pendingRef = useRef<BookSearchResult | null>(null);

  // Recherche pré-remplie si on en a une, puis le clavier une fois le sheet monté
  useEffect(() => {
    if (q) setQuery(q);
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [q, setQuery]);

  const finish = useCallback(
    (book: BookSearchResult) => {
      useOnboardingStore.getState().setBookPick({ book, target });
      router.back();
    },
    [router, target],
  );

  const handlePick = useCallback(
    async (book: BookSearchResult) => {
      Keyboard.dismiss();
      // Une édition : c'est la sienne
      if (book.id.startsWith('google:')) return finish(book);
      // Un livre sans édition affichée : sa première édition connue, s'il en a une
      pendingRef.current = book;
      const [first] = await fetchEditions(book);
      if (pendingRef.current !== book) return;
      finish(first ?? book);
    },
    [finish],
  );

  const showTrending = query.trim().length === 0;
  const list = showTrending ? TRENDING_BOOKS : results;

  return (
    <SheetPage title="Rechercher" fit={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={styles.searchBox}>
        <SearchIcon size={18} color={colors.placeholder} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Titre, auteur, saga"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Chercher un livre"
        />
        {query.length > 0 && (
          <Pressable
            onPress={clearResults}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
          >
            <CircleXIcon size={18} color={colors.placeholder} />
          </Pressable>
        )}
      </View>

      {showTrending && <Text style={styles.sectionTitle}>En ce moment</Text>}

      {list.map((book) => (
        <BookResultRow key={book.id} book={book} onPress={() => handlePick(book)} />
      ))}

      {!showTrending && list.length === 0 &&
        (isSearching ? (
          <>
            <BookResultSkeleton />
            <BookResultSkeleton />
            <BookResultSkeleton />
          </>
        ) : (
          <Text style={styles.message}>{error ?? 'Aucun résultat'}</Text>
        ))}
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    paddingVertical: spacing.lg,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing['3xl'],
  },
  sectionTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
});
