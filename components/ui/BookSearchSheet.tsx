import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBookSearch } from '../../hooks/useBookSearch';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, fonts, fontSize, shadows, spacing } from '../../utils/constants';
import BookResultRow from './BookResultRow';
import BottomSheet from './BottomSheet';
import { CircleXIcon, SearchIcon } from 'lucide-react-native';

interface BookSearchSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectBook: (book: BookSearchResult) => void;
  /** Recherche déjà tapée à l'ouverture (ex. : le titre du bbb, pour trouver son édition) */
  initialQuery?: string;
}

export default function BookSearchSheet({ visible, onClose, onSelectBook, initialQuery }: BookSearchSheetProps) {
  const insets = useSafeAreaInsets();
  const { query, setQuery, results, trending, isSearching, isTrendingLoading, error, clearResults } = useBookSearch();
  const inputRef = useRef<TextInput>(null);

  // Reset à la fermeture
  useEffect(() => {
    if (!visible) clearResults();
  }, [visible, clearResults]);

  // Auto-focus l'input à l'ouverture, recherche pré-remplie si on en a une
  useEffect(() => {
    if (visible) {
      if (initialQuery) setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [visible, initialQuery, setQuery]);

  const handleSelect = (book: BookSearchResult) => {
    onSelectBook(book);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <SearchIcon size={18} color={colors.textPlaceholder} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Rechercher un livre..."
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
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          {/* Loading */}
          {isSearching && (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
            </View>
          )}

          {/* Erreur */}
          {error && !isSearching && (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          )}

          {/* État vide */}
          {!isSearching && !error && results.length === 0 && query.length > 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>Aucun résultat</Text>
            </View>
          )}

          {/* Trending : affiché quand pas de recherche active */}
          {!isSearching && !error && results.length === 0 && query.length === 0 && (
            <>
              {isTrendingLoading && (
                <View style={styles.centered}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                </View>
              )}
              {!isTrendingLoading && trending.length > 0 && (
                <FlatList
                  data={trending}
                  keyExtractor={(item) => item.id}
                  ListHeaderComponent={
                    <Text style={styles.sectionTitle}>Tendances du moment</Text>
                  }
                  renderItem={({ item }) => (
                    <BookResultRow book={item} onPress={() => handleSelect(item)} />
                  )}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                />
              )}
              {!isTrendingLoading && trending.length === 0 && (
                <View style={styles.centered}>
                  <SearchIcon size={32} color={colors.borderLight} />
                  <Text style={styles.hintText}>Tape le titre du livre</Text>
                </View>
              )}
            </>
          )}

          {/* Résultats */}
          {results.length > 0 && !isSearching && (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <BookResultRow book={item} onPress={() => handleSelect(item)} />
              )}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 400,
    maxHeight: 500,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.xs,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    paddingVertical: spacing.lg,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
  },
});
