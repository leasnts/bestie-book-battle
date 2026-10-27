/**
 * Onglet Explorer — trouver la prochaine lecture du club.
 *
 *    ┌───────────────────────────────┐
 *    │ Explorer                      │
 *    │ ( 🔍 Titre, auteur, saga    ) │
 *    │                               │
 *    │ ♥ Mes envies                  │
 *    │ ▐██▌ ┏━━┓ ▛▀▀▜ →              │
 *    │ ░░░░░░░░░░░░░░░               │
 *    │ Genres                        │
 *    │ ┌───────────┐ ┌───────────┐   │
 *    │ │Romantasy ▞│ │Thriller  ▞│   │
 *    │ └───────────┘ └───────────┘   │
 *    │ Auteur·ices                   │
 *    │ (▐█▌) (▐█▌) (▐█▌) (▐█▌) →     │
 *    │ Populaire sur BookTok         │
 *    │ ▐██▌ ┏━━┓ ▛▀▀▜ ▐██▌ →         │
 *    │ ░░░░░░░░░░░░░░░░░░░░          │
 *    └───────────────────────────────┘
 *
 * - **Recherche** : titre, auteur ou saga. Taper remplace les étagères par les
 *   résultats au fil de la frappe (Apple Books, repli Open Library ; les
 *   livres des étagères qui correspondent d'abord, sans attendre le réseau).
 * - **Mes envies** : les livres gardés pour plus tard, en première étagère.
 * - **Genres** : une grille de cadres en verre ; toucher un genre remplace la
 *   page par la liste de ses livres (bouton retour pour revenir). Rester dans
 *   l'onglet évite d'empiler un sheet sous la fiche du livre.
 * - **Auteur·ices** : les plus lu·es, photo (ou initiales) en rond ; toucher
 *   lance la recherche (constants/exploreAuthors.json).
 * - **Populaire sur BookTok** : l'étagère des livres qui tournent en ce moment.
 *
 * Tous ces livres sont choisis à la main et figés dans
 * constants/exploreCatalog.json (s'affichent sans réseau ; régénérer avec
 * scripts/build-explore-catalog.mjs).
 *
 * Toucher un livre ouvre sa fiche (route /explore-book, sheet natif) : lancer
 * une lecture, le garder en envie, le partager.
 *
 * Fond papier uni, SANS le dégradé de l'accueil : les étagères
 * s'effacent aux bords en fondu couleur papier, qui ferait une bande claire
 * sur les taches. Titre ferré à gauche, comme tous les titres de l'app.
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronLeftIcon, CircleXIcon, HeartIcon, SearchIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageTransition from '../../components/PageTransition';
import BookResultRow, { BookResultSkeleton } from '../../components/ui/BookResultRow';
import ExploreAuthors, { type ExploreAuthor } from '../../components/ui/ExploreAuthors';
import ExploreGenres, { type ExploreGenre } from '../../components/ui/ExploreGenres';
import ExploreShelf from '../../components/ui/ExploreShelf';
import GlassButton from '../../components/ui/GlassButton';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import authorsCatalog from '../../constants/exploreAuthors.json';
import catalog from '../../constants/exploreCatalog.json';
import { useBookSearch } from '../../hooks/useBookSearch';
import { useExploreStore } from '../../stores/exploreStore';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, fonts, shadows, spacing } from '../../utils/constants';


const SHELVES = catalog.shelves as ExploreGenre[];
/** L'étagère des tendances : la première du catalogue, hors grille des genres */
const BOOKTOK = SHELVES.find((shelf) => shelf.key === 'booktok');
const GENRES = SHELVES.filter((shelf) => shelf !== BOOKTOK);

const AUTHORS = authorsCatalog.authors as ExploreAuthor[];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const router = useRouter();
  const { query, setQuery, results, isSearching, error, clearResults } = useBookSearch();
  const favorites = useExploreStore((state) => state.favorites);
  const openBook = useExploreStore((state) => state.openBook);
  const pendingQuery = useExploreStore((state) => state.pendingQuery);
  const clearPendingQuery = useExploreStore((state) => state.clearPendingQuery);
  const [genre, setGenre] = useState<ExploreGenre | null>(null);

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
            data={results}
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
        ) : genre ? (
          <FlatList
            data={genre.books}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BookResultRow book={item} onPress={() => handleOpen(item)} />}
            ListHeaderComponent={
              <View style={styles.genreHeader}>
                <GlassButton icon={ChevronLeftIcon} onPress={() => setGenre(null)} accessibilityLabel="Retour" />
                <Text style={styles.genreTitle} accessibilityRole="header" numberOfLines={1}>
                  {genre.label}
                </Text>
              </View>
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
            <ExploreGenres genres={GENRES} onSelect={setGenre} />
            <ExploreAuthors authors={AUTHORS} onSelect={setQuery} />
            {BOOKTOK && (
              <ExploreShelf label={BOOKTOK.label} books={BOOKTOK.books} onSelect={handleOpen} />
            )}
          </ScrollView>
        )}
      </View>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  // Ferré à gauche : aucun titre centré dans l'app
  headerTitle: {
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
  genreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  genreTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  emptyText: {
    paddingTop: spacing['2xl'],
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textTertiary,
  },
});
