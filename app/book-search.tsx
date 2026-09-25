/**
 * Route /book-search — trouver un livre (onboarding : créer un bbb, ou trouver
 * mon édition). `?q=` pré-remplit la recherche.
 *
 * Sheet natif (`SheetPage`) à palier haut : le clavier et les résultats.
 * Le livre choisi est déposé dans le store de l'onboarding (`bookPick`) : c'est
 * l'écran d'en dessous qui le reprend en revenant au premier plan.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleXIcon, SearchIcon } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import BookResultRow from '../components/ui/BookResultRow';
import SheetPage from '../components/ui/SheetPage';
import { useBookSearch } from '../hooks/useBookSearch';
import { useOnboardingStore } from '../stores/onboardingStore';
import type { BookSearchResult } from '../types/bookSearch';
import { borderRadius, colors, fonts, fontSize, shadows, spacing } from '../utils/constants';

export default function BookSearchRoute() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { query, setQuery, results, trending, isSearching, isTrendingLoading, error, clearResults } =
    useBookSearch();
  const inputRef = useRef<TextInput>(null);

  // Recherche pré-remplie si on en a une, puis le clavier une fois le sheet monté
  useEffect(() => {
    if (q) setQuery(q);
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [q, setQuery]);

  const handleSelect = (book: BookSearchResult) => {
    useOnboardingStore.getState().setBookPick(book);
    router.back();
  };

  const showTrending = !isSearching && !error && results.length === 0 && query.length === 0;
  const list = results.length > 0 && !isSearching ? results : showTrending ? trending : [];

  return (
    <SheetPage title="Rechercher" fit={false}>
      <View style={styles.searchBox}>
        <SearchIcon size={18} color={colors.textPlaceholder} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Titre, auteur…"
          placeholderTextColor={colors.textPlaceholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable
            onPress={clearResults}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
          >
            <CircleXIcon size={18} color={colors.textPlaceholder} />
          </Pressable>
        )}
      </View>

      {!!error && !isSearching && <Text style={styles.message}>{error}</Text>}
      {!isSearching && !error && results.length === 0 && query.length > 0 && (
        <Text style={styles.message}>Aucun résultat</Text>
      )}
      {showTrending && !isTrendingLoading && trending.length > 0 && (
        <Text style={styles.sectionTitle}>Tendances</Text>
      )}

      {list.map((book) => (
        <BookResultRow key={book.id} book={book} onPress={() => handleSelect(book)} />
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
