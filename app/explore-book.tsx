/**
 * Route /explore-book — la fiche d'un livre de l'onglet Explorer, en sheet natif.
 *
 *    ┌────────────────────────────────┐
 *    │ Fourth Wing                    │
 *    │ Rebecca Yarros                 │
 *    │                                │
 *    │ ▐██▌  [518 p. · 2023]          │
 *    │ ▐██▌  🔍 Ses livres            │
 *    │                                │
 *    │ [ Lancer une lecture ] (♥) (↗) │
 *    └────────────────────────────────┘
 *
 * - **Lancer une lecture** : reprend le parcours de création au nombre de
 *   pages, titre, autrice, pages et couverture déjà remplis. Si le livre est
 *   déjà dans ma bibliothèque, le bouton devient **Ouvrir** et l'affiche sur
 *   l'accueil.
 * - **♥** : le garde dans mes envies (première étagère de l'onglet).
 * - **↗** : le propose au club par le partage iOS.
 * - « Ses livres » lance la recherche de ses livres dans l'onglet.
 *
 * Pas de note, pas d'avis, pas de résumé : pas de fiche produit (DESIGN.md,
 * anti-référence Goodreads). Le livre vient du store (`selectedBook`).
 *
 * Mise en page : `SheetPage`, comme tous les sheets (titre du livre en en-tête,
 * comme la fiche du livre en cours).
 */

import { useRouter } from 'expo-router';
import { BookOpenIcon, CirclePlusIcon, HeartIcon, SearchIcon, ShareIcon } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Button3D from '../components/Button3D';
import BookCover, { COVER_RATIO } from '../components/ui/BookCover';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { useAuthStore } from '../stores/authStore';
import { useExploreStore } from '../stores/exploreStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useProjectStore } from '../stores/projectStore';
import { borderRadius, colors, fonts, inkAlpha, spacing } from '../utils/constants';

const COVER_H = 140;

/** « Le Prince cruel » et « le prince  cruel » désignent le même livre */
function normalizeTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export default function ExploreBookRoute() {
  const router = useRouter();
  const book = useExploreStore((state) => state.selectedBook);
  const isFavorite = useExploreStore(
    (state) => !!book && state.favorites.some((f) => f.id === book.id),
  );
  const toggleFavorite = useExploreStore((state) => state.toggleFavorite);
  const searchFor = useExploreStore((state) => state.searchFor);
  const challenges = useProjectStore((state) => state.challenges);
  const setActiveChallenge = useProjectStore((state) => state.setActiveChallenge);
  const firstName = useAuthStore((state) => state.user?.first_name);

  // Déjà dans ma bibliothèque ? Alors on l'ouvre au lieu d'en relancer un
  const inLibrary = useMemo(() => {
    if (!book) return null;
    const title = normalizeTitle(book.title);
    return challenges.find((c) => normalizeTitle(c.book_title) === title) ?? null;
  }, [book, challenges]);

  const handleStart = useCallback(() => {
    if (!book) return;
    if (inLibrary) {
      setActiveChallenge(inLibrary);
      router.back();
      router.navigate('/(tabs)');
      return;
    }
    // Pages et couverture pré-remplies, comme après une recherche dans le parcours
    const onboarding = useOnboardingStore.getState();
    onboarding.reset();
    onboarding.setApiPageCount(book.pageCount);
    onboarding.setApiCoverUrl(book.coverUrl);
    // Fermer d'abord le sheet, sinon l'écran poussé s'ouvrirait À L'INTÉRIEUR
    router.back();
    router.push({
      pathname: '/onboarding/pages',
      params: {
        firstName: firstName || 'Lecteur',
        bookTitle: book.title,
        author: book.author,
        addChallenge: 'true',
      },
    });
  }, [book, inLibrary, setActiveChallenge, router, firstName]);

  const handleShare = useCallback(async () => {
    if (!book) return;
    try {
      await Share.share({
        message: `« ${book.title} »${book.author ? ` de ${book.author}` : ''} : on le lit ensemble ?`,
      });
    } catch {
      // partage annulé
    }
  }, [book]);

  const handleAuthor = useCallback(() => {
    if (!book?.author) return;
    searchFor(book.author.split(',')[0].trim());
    router.back();
  }, [book, searchFor, router]);

  if (!book) return null;

  const details = [book.pageCount ? `${book.pageCount} p.` : null, book.publishedDate?.slice(0, 4)]
    .filter(Boolean)
    .join(' · ');

  return (
    <SheetPage title={book.title} subtitle={book.author} titleLines={2}>
      <View style={styles.body}>
        <View style={styles.cover}>
          <BookCover coverUrl={book.coverUrl} outlined />
        </View>
        <View style={styles.bodyTexts}>
          {!!details && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{details}</Text>
            </View>
          )}
          {!!book.author && (
            <Pressable
              onPress={handleAuthor}
              hitSlop={8}
              style={({ pressed }) => [styles.authorLink, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel={`Ses livres : ${book.author}`}
            >
              <SearchIcon size={14} color={colors.textTertiary} strokeWidth={2.25} />
              <Text style={styles.authorLinkText}>Ses livres</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Trois places fixes : l'action, l'envie, le partage */}
      <SheetFooter>
        <View style={styles.actions}>
          <Button3D
            variant="primary"
            icon={inLibrary ? BookOpenIcon : CirclePlusIcon}
            iconPosition="left"
            onPress={handleStart}
            style={styles.mainAction}
          >
            {inLibrary ? 'Ouvrir' : 'Lancer une lecture'}
          </Button3D>
          <Button3D
            variant="secondary"
            iconOnly
            iconComponent={
              <HeartIcon
                size={22}
                color={isFavorite ? colors.accent : colors.dark900}
                fill={isFavorite ? colors.accent : 'transparent'}
                strokeWidth={2}
              />
            }
            onPress={() => toggleFavorite(book)}
            accessibilityLabel={isFavorite ? 'Retirer de mes envies' : 'Garder dans mes envies'}
            style={styles.iconAction}
          />
          <Button3D
            variant="secondary"
            iconOnly
            icon={ShareIcon}
            onPress={handleShare}
            accessibilityLabel="Proposer au club"
            style={styles.iconAction}
          />
        </View>
      </SheetFooter>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  cover: {
    width: Math.round(COVER_H * COVER_RATIO),
    height: COVER_H,
  },
  bodyTexts: {
    flex: 1,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  authorLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 32,
  },
  authorLinkText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textTertiary,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: inkAlpha(0.07),
  },
  pillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mainAction: {
    flex: 1,
  },
  iconAction: {
    width: 56,
  },
});
