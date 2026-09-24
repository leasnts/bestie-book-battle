/**
 * Onglet Explorer — trouver la prochaine lecture du club.
 *
 *    ┌───────────────────────────────┐
 *    │           Explorer            │
 *    │ ( 🔍 Titre, auteur, saga    ) │
 *    │                               │
 *    │ ♥ Mes envies                  │
 *    │ ▐██▌ ┏━━┓ ▛▀▀▜ →              │
 *    │ ░░░░░░░░░░░░░░░               │
 *    │ En ce moment                  │
 *    │ ▐██▌ ┏━━┓ ▛▀▀▜ ▐██▌ →         │
 *    │ ░░░░░░░░░░░░░░░░░░░░          │
 *    │ Contemporain, Thriller…       │
 *    └───────────────────────────────┘
 *
 * - **Recherche** : titre, auteur ou saga. Taper remplace les étagères par les
 *   résultats (Google Books, repli Open Library).
 * - **Mes envies** : les livres gardés pour plus tard, en première étagère.
 * - **Étagères par genre** : les livres les plus lus en ce moment, choisis à la
 *   main et figés dans constants/exploreCatalog.json (s'affichent sans réseau ;
 *   régénérer avec scripts/build-explore-catalog.mjs).
 *
 * Toucher un livre ouvre sa fiche (route /explore-book, sheet natif) : lancer
 * une lecture, le garder en envie, le partager.
 *
 * Même habillage que l'accueil : fond neutre en taches, texture, titre centré.
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CircleXIcon, HeartIcon, SearchIcon } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageTransition from '../../components/PageTransition';
import BookResultRow, { BookResultSkeleton } from '../../components/ui/BookResultRow';
import CoverBackdrop from '../../components/ui/CoverBackdrop';
import ExploreShelf from '../../components/ui/ExploreShelf';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import catalog from '../../constants/exploreCatalog.json';
import { useBookSearch } from '../../hooks/useBookSearch';
import { useExploreStore } from '../../stores/exploreStore';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, fonts, shadows, spacing } from '../../utils/constants';

const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

const SHELVES = catalog.shelves as { key: string; label: string; books: BookSearchResult[] }[];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const router = useRouter();
  const { query, setQuery, results, isSearching, error, clearResults } = useBookSearch({
    withTrending: false,
  });
  const favorites = useExploreStore((state) => state.favorites);
  const openBook = useExploreStore((state) => state.openBook);
  const pendingQuery = useExploreStore((state) => state.pendingQuery);
  const clearPendingQuery = useExploreStore((state) => state.clearPendingQuery);

  // Recherche demandée depuis une fiche (toucher l'autrice)
  useEffect(() => {
    if (!pendingQuery) return;
    setQuery(pendingQuery);
    clearPendingQuery();
  }, [pendingQuery, setQuery, clearPendingQuery]);

  const handleOpen = useCallback(
    (book: BookSearchResult) => {
      Keyboard.dismiss();
      openBook(book);
      router.push('/explore-book');
    },
    [openBook, router],
  );

  const searching = query.trim().length > 0;
  const bottomSpace = tabBarInset + spacing['2xl'];

  return (
    <PageTransition>
      <View style={styles.container}>
        <CoverBackdrop />
        <Image source={TEXTURE_IMAGE} style={styles.backgroundTexture} contentFit="cover" />

        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Explorer
          </Text>

          <View style={styles.searchField}>
            <SearchIcon size={18} color={colors.textPlaceholder} />
            <TextInput
              style={styles.searchInput}
              placeholder="Titre, auteur, saga"
              placeholderTextColor={colors.textPlaceholder}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="never"
              accessibilityLabel="Chercher un livre"
            />
            {searching && (
              <Pressable
                onPress={clearResults}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Effacer la recherche"
              >
                <CircleXIcon size={18} color={colors.textPlaceholder} />
              </Pressable>
            )}
          </View>
        </View>

        {searching ? (
          <FlatList
            data={isSearching ? [] : results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BookResultRow book={item} onPress={() => handleOpen(item)} />}
            ListEmptyComponent={
              isSearching ? (
                <>
                  <BookResultSkeleton />
                  <BookResultSkeleton />
                  <BookResultSkeleton />
                  <BookResultSkeleton />
                </>
              ) : (
                <Text style={styles.emptyText}>{error ?? 'Aucun résultat'}</Text>
              )
            }
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.results, { paddingBottom: bottomSpace }]}
          />
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.shelves, { paddingBottom: bottomSpace }]}
          >
            {favorites.length > 0 && (
              <ExploreShelf label="Mes envies" icon={HeartIcon} books={favorites} onSelect={handleOpen} />
            )}
            {SHELVES.map((shelf) => (
              <ExploreShelf key={shelf.key} label={shelf.label} books={shelf.books} onSelect={handleOpen} />
            ))}
          </ScrollView>
        )}
      </View>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  backgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  headerTitle: {
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    ...shadows.xs,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  shelves: {
    paddingTop: spacing.sm,
    gap: spacing['3xl'],
  },
  results: {
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    paddingTop: spacing['2xl'],
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textTertiary,
  },
});
