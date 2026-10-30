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
 * - Un livre choisi : ses éditions papier sont cherchées (d'avance pour les
 *   premiers proposés), la première avec un nombre de pages est prise d'office ;
 *   la couverture reste celle du livre touché. Coffrets et suites écartés.
 * - Pages ou %, et le total de pages : à « Où en est ta lecture ? ».
 * - Pas d'ajout à la main pour l'instant (Lea, 2026-10-30).
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleXIcon, SearchIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import BookCover, { COVER_RATIO } from '../../components/ui/BookCover';
import BookResultRow, { BookResultSkeleton } from '../../components/ui/BookResultRow';
import GlassSection from '../../components/ui/GlassSection';
import { useBookSearch } from '../../hooks/useBookSearch';
import { fetchEditions, TRENDING_BOOKS } from '../../services/bookApi';
import { useOnboardingStore } from '../../stores/onboardingStore';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, fonts, fontSize, shadows, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { nextStep } from '../../utils/onboardingFlow';

/** Combien de livres proposés ont leurs éditions demandées d'avance */
const PREFETCH = 5;


export default function LivreScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const book = useOnboardingStore((s) => s.book);
  const patch = useOnboardingStore((s) => s.patch);
  const { query, setQuery, results, isSearching, error, clearResults } = useBookSearch();
  const [publishers, setPublishers] = useState<Record<string, string>>({});
  const pending = useRef<BookSearchResult | null>(null);
  // `?q=` pré-remplit la recherche (lien profond, tests)
  const { q } = useLocalSearchParams<{ q?: string }>();
  useEffect(() => {
    if (q) setQuery(q);
  }, [q, setQuery]);

  // Les éditions des premiers livres proposés, demandées d'avance : touché, le
  // livre arrive tout de suite avec son édition et ses pages
  useEffect(() => {
    let live = true;
    (results.length > 0 ? results : TRENDING_BOOKS).slice(0, PREFETCH).forEach((result) =>
      fetchEditions(result).then((found) => {
        const publisher = found.find((edition) => edition.pageCount)?.publisher;
        if (live && publisher) setPublishers((known) => ({ ...known, [result.id]: publisher }));
      }),
    );
    return () => {
      live = false;
    };
  }, [results]);
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
    pending.current = result;
    const found = await fetchEditions(result);
    if (pending.current !== result) return;
    // L'édition proposée d'office : la plus récente qui connaît son nombre de pages.
    // La couverture reste celle du livre touché.
    const first = found.find((edition) => edition.pageCount);
    if (first) setBook(first, result.coverUrl ?? first.coverUrl);
  };

  const ready = !!book && book.title.trim().length > 0;
  const editionLine = book ? [book.publisher, book.pages > 0 ? `${book.pages} p.` : null].filter(Boolean).join(' · ') : '';

  return (
    <OnboardingScreen
      step="livre"
      title="On lit quoi ?"
      accent="quoi"
      scroll
      footer={
        <Button3D variant="primary" disabled={!ready} onPress={() => router.push(nextStep(flow, 'livre'))} style={styles.wide}>
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
        {searching && (
          <Pressable onPress={clearResults} hitSlop={8} accessibilityRole="button" accessibilityLabel="Effacer la recherche">
            <CircleXIcon size={18} color={colors.placeholder} />
          </Pressable>
        )}
      </Animated.View>

      {searching ? (
        <View>
          {results.map((result) => (
            <BookResultRow key={result.id} book={withPublisher(result)} onPress={() => pick(result)} publisherOnly />
          ))}
          {results.length === 0 &&
            (isSearching ? (
              <>
                <BookResultSkeleton />
                <BookResultSkeleton />
                <BookResultSkeleton />
              </>
            ) : (
              <Text style={styles.message}>{error ?? 'Aucun résultat'}</Text>
            ))}
        </View>

      ) : book ? (
        <>
          <Animated.View entering={FadeIn.duration(180)}>
            <GlassSection style={styles.banner}>
              <View style={styles.head}>
                <View style={styles.cover}>
                  <BookCover coverUrl={book.cover} />
                </View>
                <View style={styles.texts}>
                  <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
                  {!!book.author && <Text style={styles.author} numberOfLines={1}>{book.author}</Text>}
                  {!!editionLine && <Text style={styles.edition} numberOfLines={1}>{editionLine}</Text>}
                </View>
              </View>
            </GlassSection>
          </Animated.View>


        </>
      ) : (
        <View>
          {TRENDING_BOOKS.map((result) => (
            <BookResultRow key={result.id} book={withPublisher(result)} onPress={() => pick(result)} publisherOnly />
          ))}
        </View>
      )}
    </OnboardingScreen>
  );
}

const COVER_WIDTH = 64;

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
  // Le bandeau du livre, comme « Le livre » de l'accueil (BookSection)
  banner: {
    padding: spacing.xl,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  cover: {
    width: COVER_WIDTH,
    aspectRatio: COVER_RATIO,
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 25,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textTertiary,
  },
  edition: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
