/**
 * Route /explore-book — la fiche d'un livre de l'onglet Explorer, en sheet natif.
 *
 *    ┌──────────────────────── ░▒▒░──┐
 *    │ Fourth Wing          ░(♥)(↗)▒ │  ← lavis aux couleurs de la couverture
 *    │                               │
 *    │ ┌────────┐                    │
 *    │ │        │                    │
 *    │ │ cover  │  518 p.            │
 *    │ │        │  2023              │
 *    │ └────────┘                    │
 *    │ (◉) Rebecca Yarros         ›  │  ← cherche ses livres
 *    │ [     Lancer une lecture    ] │
 *    └───────────────────────────────┘
 *
 * - **Lancer une lecture** : reprend le parcours de création au nombre de
 *   pages, titre, autrice, pages et couverture déjà remplis. Si le livre est
 *   déjà dans ma bibliothèque, le bouton devient **Ouvrir** et l'affiche sur
 *   l'accueil.
 * - **♥** (en verre, rouge une fois gardé) : mes envies, première étagère de l'onglet.
 * - **↗** : le propose au club par le partage iOS.
 * - La ligne de l'autrice (sa photo si on l'a) ouvre ses livres par-dessus la
 *   fiche (`/explore-author`) ; en choisir un le met à la place de celui-ci.
 *
 * Pas de note, pas d'avis, pas de résumé : pas de fiche produit (DESIGN.md,
 * anti-référence Goodreads). Le livre vient du store (`selectedBook`).
 */

import { useRouter } from 'expo-router';
import { BookOpenIcon, ChevronRightIcon, CirclePlusIcon, HeartIcon, ShareIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Button3D from '../components/Button3D';
import { AccentUnit } from '../components/ui/AccentWord';
import BookCover, { COVER_RATIO } from '../components/ui/BookCover';
import { AuthorAvatar, type ExploreAuthor } from '../components/ui/ExploreAuthors';
import GlassButton from '../components/ui/GlassButton';
import PressableScale from '../components/ui/PressableScale';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import WatercolorCorner from '../components/ui/WatercolorCorner';
import authorsCatalog from '../constants/exploreAuthors.json';
import { fetchEditions } from '../services/bookApi';
import { useExploreStore } from '../stores/exploreStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useProjectStore } from '../stores/projectStore';
import { colors, fonts, spacing } from '../utils/constants';
import { extractCoverPalette } from '../utils/coverPalette';
import { compactText } from '../utils/normalizeText';
import { startAdding } from '../utils/onboardingFlow';
import { coverWash, NEUTRAL_WASH, type WashTints } from '../utils/watercolor';

/** La couverture est le sujet de la fiche : grande, comme posée sur la table */
const COVER_H = 216;
const AUTHOR_AVATAR = 44;
const PAGES_SIZE = 40;

const AUTHORS = authorsCatalog.authors as ExploreAuthor[];


export default function ExploreBookRoute() {
  const router = useRouter();
  const book = useExploreStore((state) => state.selectedBook);
  const isFavorite = useExploreStore(
    (state) => !!book && state.favorites.some((f) => f.id === book.id),
  );
  const toggleFavorite = useExploreStore((state) => state.toggleFavorite);
  const challenges = useProjectStore((state) => state.challenges);
  const setActiveChallenge = useProjectStore((state) => state.setActiveChallenge);

  // Les résultats de recherche n'ont pas de pages : celles de l'édition la plus récente
  const [editionPages, setEditionPages] = useState<number | null>(null);
  useEffect(() => {
    setEditionPages(null);
    if (!book || book.pageCount) return;
    let cancelled = false;
    fetchEditions(book).then((editions) => {
      if (!cancelled) setEditionPages(editions[0]?.pageCount ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [book]);
  const pageCount = book?.pageCount ?? editionPages;

  // Le lavis du coin prend les couleurs de la couverture : l'écran parle de CE livre
  const [wash, setWash] = useState<WashTints>(NEUTRAL_WASH);
  useEffect(() => {
    setWash(NEUTRAL_WASH);
    if (!book?.coverUrl) return;
    let cancelled = false;
    extractCoverPalette(book.coverUrl)
      .then((palette) => {
        if (!cancelled) setWash(coverWash(palette));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [book?.coverUrl]);

  // La première autrice : sa photo si elle est dans les auteur·ices d'Explorer
  const author = useMemo<ExploreAuthor | null>(() => {
    const name = book?.author?.split(',')[0].trim();
    if (!name) return null;
    const key = compactText(name);
    return AUTHORS.find((a) => compactText(a.name) === key) ?? { name, photoUrl: null };
  }, [book?.author]);

  // Déjà dans ma bibliothèque ? Alors on l'ouvre au lieu d'en relancer un
  const inLibrary = useMemo(() => {
    if (!book) return null;
    const title = compactText(book.title);
    return challenges.find((c) => compactText(c.book_title) === title) ?? null;
  }, [book, challenges]);

  const handleStart = useCallback(() => {
    if (!book) return;
    if (inLibrary) {
      setActiveChallenge(inLibrary);
      router.back();
      router.navigate('/(tabs)');
      return;
    }
    // Le livre déjà choisi : on passe le choix et « On lit quoi ? », direct à « Où en est ta lecture ? »
    const next = startAdding();
    useOnboardingStore.getState().patch({
      book: { title: book.title, author: book.author, pages: pageCount ?? 0, cover: book.coverUrl, publisher: book.publisher },
    });
    // Fermer d'abord le sheet, sinon l'écran poussé s'ouvrirait À L'INTÉRIEUR
    router.back();
    router.push(pageCount ? '/onboarding/page' : next);
  }, [book, pageCount, inLibrary, setActiveChallenge, router]);

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

  // Ses livres, dans un sheet posé sur la fiche : le retour ramène à ce livre
  const handleAuthor = useCallback(() => {
    if (!author) return;
    router.push({ pathname: '/explore-author', params: { name: author.name } });
  }, [author, router]);


  if (!book) return null;

  const year = book.publishedDate?.slice(0, 4);

  return (
    <SheetPage
      title={book.title}
      titleLines={2}
      headerBackground={<WatercolorCorner tints={wash} />}
      actions={
        <>
          <GlassButton
            icon={HeartIcon}
            selected={isFavorite}
            onPress={() => toggleFavorite(book)}
            accessibilityLabel={isFavorite ? 'Retirer de mes envies' : 'Garder dans mes envies'}
          />
          <GlassButton icon={ShareIcon} onPress={handleShare} accessibilityLabel="Proposer au club" />
        </>
      }
    >
      <View style={styles.hero}>
        <View style={styles.cover}>
          <BookCover coverUrl={book.coverUrl} outlined />
        </View>
        <View style={styles.facts}>
          {!!pageCount && (
            <Text style={styles.pages} accessibilityLabel={`${pageCount} pages`}>
              {pageCount}
              <AccentUnit size={PAGES_SIZE * 0.55} color={colors.textPrimary}>{' p.'}</AccentUnit>
            </Text>
          )}
          {!!year && <Text style={styles.year}>{year}</Text>}
        </View>
      </View>

      {author && (
        <PressableScale
          onPress={handleAuthor}
          style={styles.author}
          accessibilityRole="button"
          accessibilityLabel={author.name}
          accessibilityHint="Chercher ses livres"
        >
          <AuthorAvatar author={author} size={AUTHOR_AVATAR} />
          <Text style={styles.authorName} numberOfLines={1}>
            {author.name}
          </Text>
          <ChevronRightIcon size={20} color={colors.textTertiary} strokeWidth={2.25} />
        </PressableScale>
      )}

      <SheetFooter>
        <Button3D
          variant="primary"
          icon={inLibrary ? BookOpenIcon : CirclePlusIcon}
          iconPosition="left"
          onPress={handleStart}
        >
          {inLibrary ? 'Ouvrir' : 'Lancer une lecture'}
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xl,
  },
  cover: {
    width: Math.round(COVER_H * COVER_RATIO),
    height: COVER_H,
  },
  facts: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  pages: {
    fontFamily: fonts.display,
    fontSize: PAGES_SIZE,
    lineHeight: PAGES_SIZE * 1.15,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  year: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
  authorName: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
