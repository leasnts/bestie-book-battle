/**
 * On lit quoi ? Le livre, et son édition.
 *
 *    ( 🔍 Un autre livre                 )    la recherche, dans la page, toujours là
 *    ┌───────────────────────────────────┐
 *    │ ▐██▌  Le Prince cruel             │    le livre choisi, comme sur l'accueil
 *    │ ▐██▌  Holly Black                 │
 *    │       Rageot · 400 p.   Changer   │    l'édition proposée d'office
 *    └───────────────────────────────────┘
 *
 * - La recherche ne part pas dans un sheet : on tape, les résultats s'affichent
 *   dessous ; elle reste en haut une fois le livre choisi, pour en changer.
 * - Un livre choisi : ses éditions papier sont cherchées (d'avance pour les
 *   premiers proposés), la première avec un nombre de pages est prise d'office ;
 *   « Changer » les déroule.
 * - Pages ou %, et le total de pages : à « Où en est ta lecture ? ».
 * - Ajouter à la main : titre et auteur·ice.
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
const PREFETCH = 3;


export default function LivreScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const book = useOnboardingStore((s) => s.book);
  const patch = useOnboardingStore((s) => s.patch);
  const { query, setQuery, results, isSearching, error, clearResults } = useBookSearch();
  const [manual, setManual] = useState(false);
  // Les éditions du livre choisi (null = en cours), et leur liste dépliée
  const [editions, setEditions] = useState<BookSearchResult[] | null>(null);
  const [showEditions, setShowEditions] = useState(false);
  const pending = useRef<BookSearchResult | null>(null);
  // `?q=` pré-remplit la recherche (lien profond, tests)
  const { q } = useLocalSearchParams<{ q?: string }>();
  useEffect(() => {
    if (q) setQuery(q);
  }, [q, setQuery]);

  // Les éditions des premiers livres proposés, demandées d'avance : touché, le
  // livre arrive tout de suite avec son édition et ses pages
  useEffect(() => {
    (results.length > 0 ? results : TRENDING_BOOKS).slice(0, PREFETCH).forEach((result) => void fetchEditions(result));
  }, [results]);

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
    setManual(false);
    setShowEditions(false);
    setEditions(null);
    setBook(result);
    pending.current = result;
    const found = await fetchEditions(result);
    if (pending.current !== result) return;
    setEditions(found);
    // L'édition proposée d'office : la première qui connaît son nombre de pages
    const first = found.find((edition) => edition.pageCount);
    if (first) setBook(first, first.coverUrl ?? result.coverUrl);
  };

  const pickEdition = (edition: BookSearchResult) => {
    feel('tic');
    setShowEditions(false);
    setBook(edition, edition.coverUrl ?? book?.cover ?? null);
  };

  const ready = !!book && book.title.trim().length > 0;

  return (
    <OnboardingScreen
      step="livre"
      title="On lit quoi ?"
      accent="quoi"
      scroll
      footer={
        <>
          <Button3D variant="primary" disabled={!ready} onPress={() => router.push(nextStep(flow, 'livre'))} style={styles.wide}>
            C'est celui-là
          </Button3D>
          {!book && !manual && (
            <Button3D variant="secondary" onPress={() => setManual(true)} style={styles.wide}>
              Ajouter à la main
            </Button3D>
          )}
        </>
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
              <Text style={styles.message}>{error ?? 'Aucun résultat'}</Text>
            ))}
        </View>
      ) : manual ? (
        <ManualBook onChange={(title, author) => patch({ book: { title, author, pages: book?.pages ?? 0, cover: null, publisher: null }, start: 0 })} />
      ) : book ? (
        <>
          <Animated.View entering={FadeIn.duration(180)}>
            <GlassSection>
              <View style={styles.head}>
                <View style={styles.cover}>
                  <BookCover coverUrl={book.cover} />
                </View>
                <View style={styles.texts}>
                  <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
                  {!!book.author && <Text style={styles.author} numberOfLines={1}>{book.author}</Text>}
                  <View style={styles.editionRow}>
                    <Text style={styles.edition} numberOfLines={1}>
                      {editions === null
                        ? 'Ton édition…'
                        : [book.publisher, book.pages > 0 ? `${book.pages} p.` : null].filter(Boolean).join(' · ') || 'Édition inconnue'}
                    </Text>
                    {!!editions && editions.length > 1 && (
                      <Pressable onPress={() => setShowEditions(!showEditions)} hitSlop={10} accessibilityRole="button">
                        <Text style={styles.change}>{showEditions ? 'Fermer' : 'Changer'}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            </GlassSection>
          </Animated.View>

          {showEditions && editions && (
            <Animated.View entering={FadeIn.duration(200)}>
              <View style={styles.editions}>
                {editions.map((edition) => (
                  <BookResultRow key={edition.id} book={edition} onPress={() => pickEdition(edition)} />
                ))}
              </View>
            </Animated.View>
          )}

        </>
      ) : (
        <View>
          {TRENDING_BOOKS.map((result) => (
            <BookResultRow key={result.id} book={result} onPress={() => pick(result)} />
          ))}
        </View>
      )}
    </OnboardingScreen>
  );
}

/** Le livre à la main : titre et auteur·ice */
function ManualBook({ onChange }: { onChange: (title: string, author: string) => void }) {
  const [draft, setDraft] = useState({ title: '', author: '' });
  const update = (field: keyof typeof draft, value: string) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    onChange(next.title.trim(), next.author.trim());
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.form}>
      <TextInput style={styles.input} placeholder="Titre" placeholderTextColor={colors.placeholder} value={draft.title} onChangeText={(t) => update('title', t)} autoFocus autoCapitalize="sentences" accessibilityLabel="Titre du livre" />
      <TextInput style={styles.input} placeholder="Auteur·ice" placeholderTextColor={colors.placeholder} value={draft.author} onChangeText={(t) => update('author', t)} autoCapitalize="words" accessibilityLabel="Auteur·ice" />
    </Animated.View>
  );
}

const COVER_WIDTH = 54;

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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cover: {
    width: COVER_WIDTH,
    aspectRatio: COVER_RATIO,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 1,
  },
  editionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  edition: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  change: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    textDecorationLine: 'underline',
  },
  editions: {
    marginTop: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.xs,
  },
});
