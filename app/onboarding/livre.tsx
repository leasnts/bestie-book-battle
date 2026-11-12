/**
 * On lit quoi ? Le livre, et son édition.
 *
 *    ( 🔍 Un autre livre                 )    la recherche, dans la page, toujours là
 *    ┌───────────────────────────────────┐
 *    │ ▐██▌  Le Prince cruel             │    le livre choisi, comme sur l'accueil
 *    │ ▐██▌  Holly Black                 │
 *    │       Rageot · 400 p.             │    l'édition proposée d'office
 *    └───────────────────────────────────┘
 *
 * - La recherche ne part pas dans un sheet : on tape, les résultats s'affichent
 *   dessous ; elle reste en haut une fois le livre choisi, pour en changer.
 * - Les résultats sont les éditions papier des premiers livres trouvés (éditeur,
 *   année, pages) : un toucher, et c'est la sienne. Coffrets et suites écartés.
 * - Un livre du moment (avant de taper) : la première édition avec un nombre de
 *   pages est prise d'office ; la couverture reste celle du livre touché.
 * - Pages ou %, et le total de pages : à « Où en est ta lecture ? ». Total
 *   introuvable : « Combien de pages ? » avant (onboarding/total).
 * - Le code-barres se scanne (à droite du champ) ou l'ISBN se tape : son
 *   édition est prise d'office, avec ses pages (#74).
 * - Pas d'ajout à la main pour l'instant (Lea, 2026-10-30).
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleXIcon, ScanBarcodeIcon, SearchIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import BookBanner from '../../components/onboarding/BookBanner';
import BookResultRow, { BookResultSkeleton } from '../../components/ui/BookResultRow';
import IsbnScanner from '../../components/ui/IsbnScanner';
import { useBookSearch } from '../../hooks/useBookSearch';
import { useIsbnScan } from '../../hooks/useIsbnScan';
import { fetchEditions, isEdition, TRENDING_BOOKS } from '../../services/bookApi';
import { useOnboardingStore } from '../../stores/onboardingStore';
import type { BookSearchResult } from '../../types/bookSearch';
import { parseIsbn } from '../../utils/isbn';
import { borderRadius, colors, fonts, fontSize, shadows, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { afterBook } from '../../utils/onboardingFlow';

/** Combien de livres du moment ont leurs éditions demandées d'avance */
const PREFETCH = 5;


export default function LivreScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const book = useOnboardingStore((s) => s.book);
  const patch = useOnboardingStore((s) => s.patch);
  const { query, setQuery, results, isSearching, error, clearResults } = useBookSearch({ editions: true });
  const [publishers, setPublishers] = useState<Record<string, string>>({});
  const pending = useRef<BookSearchResult | null>(null);
  // `?q=` pré-remplit la recherche (lien profond, tests)
  const { q } = useLocalSearchParams<{ q?: string }>();
  useEffect(() => {
    if (q) setQuery(q);
  }, [q, setQuery]);

  // Les éditions des livres du moment, demandées d'avance : touché, le livre
  // arrive tout de suite avec son édition et ses pages
  useEffect(() => {
    let live = true;
    TRENDING_BOOKS.slice(0, PREFETCH).forEach((result) =>
      fetchEditions(result).then((found) => {
        const publisher = found.find((edition) => edition.pageCount)?.publisher;
        if (live && publisher) setPublishers((known) => ({ ...known, [result.id]: publisher }));
      }),
    );
    return () => {
      live = false;
    };
  }, []);
  // L'éditeur de l'édition qu'on proposera, affiché dans la liste (Apple Books ne le donne pas)
  const withPublisher = (result: BookSearchResult) =>
    result.publisher || !publishers[result.id] ? result : { ...result, publisher: publishers[result.id] };

  const searching = query.trim().length > 0;

  const setBook = (result: BookSearchResult, cover = result.coverUrl) =>
    patch({
      book: { title: result.title, author: result.author, pages: result.pageCount ?? 0, cover, publisher: result.publisher },
      start: 0,
    });

  const pick = async (result: BookSearchResult) => {
    Keyboard.dismiss();
    clearResults();
    feel('tic');
    setBook(result);
    // Une édition touchée dans les résultats : c'est la sienne
    if (isEdition(result)) return;
    pending.current = result;
    const found = await fetchEditions(result);
    if (pending.current !== result) return;
    // L'édition proposée d'office : la plus récente qui connaît son nombre de pages.
    // La couverture reste celle du livre touché.
    const first = found.find((edition) => edition.pageCount);
    if (first) setBook(first, result.coverUrl ?? first.coverUrl);
  };

  const { openScanner, scanner } = useIsbnScan({ setQuery, results, isSearching, onFound: pick });

  const ready = !!book && book.title.trim().length > 0;
  const editionLine = book ? [book.publisher, book.pages > 0 ? `${book.pages} p.` : null].filter(Boolean).join(' · ') : '';

  return (
    <OnboardingScreen
      step="livre"
      title="On lit quoi ?"
      accent="quoi"
      scroll
      footer={
        <Button3D variant="primary" disabled={!ready} onPress={() => router.push(afterBook(flow, book?.pages ?? 0))} style={styles.wide}>
          Continuer
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)} style={styles.searchBox}>
        <SearchIcon size={20} color={colors.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder={book ? 'Un autre livre' : 'Titre, auteur·ice, saga'}
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Chercher un livre"
        />
        {searching ? (
          <Pressable onPress={clearResults} hitSlop={8} accessibilityRole="button" accessibilityLabel="Effacer la recherche">
            <CircleXIcon size={18} color={colors.placeholder} />
          </Pressable>
        ) : (
          <Pressable onPress={openScanner} hitSlop={8} accessibilityRole="button" accessibilityLabel="Scanner le code-barres">
            <ScanBarcodeIcon size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </Animated.View>

      {searching ? (
        <View>
          {results.map((result) => (
            <BookResultRow key={result.id} book={result} onPress={() => pick(result)} />
          ))}
          {results.length === 0 &&
            (isSearching ? (
              <>
                <BookResultSkeleton />
                <BookResultSkeleton />
                <BookResultSkeleton />
              </>
            ) : (
              <Text style={styles.message}>{error ?? (parseIsbn(query) ? 'Édition inconnue, tape le titre' : 'Aucun résultat')}</Text>
            ))}
        </View>

      ) : book ? (
        <>
          <Animated.View entering={FadeIn.duration(180)}>
            <BookBanner book={book} line={editionLine} />
          </Animated.View>


        </>
      ) : (
        <View>
          {TRENDING_BOOKS.map((result) => (
            <BookResultRow key={result.id} book={withPublisher(result)} onPress={() => pick(result)} publisherOnly />
          ))}
        </View>
      )}

      <IsbnScanner {...scanner} />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
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
});
