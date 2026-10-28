/**
 * Route /book-search — trouver un livre (onboarding : créer un bbb, ou trouver
 * mon édition). `?q=` pré-remplit la recherche.
 *
 *    ┌───────────────────────────────┐       ┌───────────────────────────────┐
 *    │ Rechercher                    │       │ (‹) Ton édition               │
 *    │ ( 🔍 le prince cr          ✕ )│  →    │     Le Prince cruel · H. Black│
 *    │ ▐██▌ Le Prince cruel          │       │ ▐██▌ Rageot, 2019 · 400 p.    │
 *    │ ▐██▌ Le Roi maléfique         │       │ ▐██▌ Pocket Jeunesse · 432 p. │
 *    └───────────────────────────────┘       │        [ Autre édition ]      │
 *                                            └───────────────────────────────┘
 *
 * 1. **Recherche** au fil de la frappe (useBookSearch) ; avant de taper, les
 *    livres du moment.
 * 2. **Ton édition** : le livre touché, ses éditions papier (Google Books)
 *    pour pré-remplir les pages. Pas d'édition trouvée, ou une seule : on
 *    saute l'étape. « Autre édition » garde le livre sans édition précise
 *    (les pages se règlent à la main ensuite).
 *
 * Sheet natif (`SheetPage`) à palier haut : le clavier et les résultats.
 * Le livre choisi est déposé dans le store de l'onboarding (`bookPick`) : c'est
 * l'écran d'en dessous qui le reprend en revenant au premier plan.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleXIcon, SearchIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import Button3D from '../components/Button3D';
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
  const { query, setQuery, results, isSearching, error, clearResults } = useBookSearch();
  const inputRef = useRef<TextInputInstance>(null);

  // Étape 2 : le livre touché et ses éditions (null = en cours)
  const [picked, setPicked] = useState<BookSearchResult | null>(null);
  const [editions, setEditions] = useState<BookSearchResult[] | null>(null);
  // Le livre dont on attend les éditions : revenir en arrière entre-temps l'oublie
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
      setPicked(book);
      setEditions(null);
      pendingRef.current = book;
      const found = await fetchEditions(book);
      if (pendingRef.current !== book) return;
      // Rien à choisir : on garde le livre (avec les pages de l'édition s'il n'y en a qu'une)
      if (found.length <= 1) {
        finish(found[0] ? { ...found[0], coverUrl: found[0].coverUrl ?? book.coverUrl } : book);
        return;
      }
      setEditions(found);
    },
    [finish],
  );

  if (picked) {
    return (
      <SheetPage
        title="Ton édition"
        subtitle={[picked.title, picked.author].filter(Boolean).join(' · ')}
        onBack={() => {
          pendingRef.current = null;
          setPicked(null);
        }}
        fit={false}
      >
        {editions === null ? (
          <>
            <BookResultSkeleton />
            <BookResultSkeleton />
            <BookResultSkeleton />
          </>
        ) : (
          <>
            {editions.map((edition) => (
              <BookResultRow key={edition.id} book={edition} onPress={() => finish(edition)} />
            ))}
            <View style={styles.otherEdition}>
              <Button3D variant="secondary" onPress={() => finish(picked)}>
                Autre édition
              </Button3D>
            </View>
          </>
        )}
      </SheetPage>
    );
  }

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
  otherEdition: {
    marginTop: spacing.xl,
  },
});
