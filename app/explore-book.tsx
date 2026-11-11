/**
 * Route /explore-book — la fiche d'un livre de l'onglet Explorer, en sheet natif.
 * Une fiche d'information : les actions sont là, discrètes, pas un gros bouton.
 *
 *    ┌───────────────────────────────┐
 *    │ ┌────┐ Fourth Wing            │  ← comme la carte du livre de l'accueil
 *    │ │cov │ Rebecca Yarros         │
 *    │ └────┘ 518 p. · 2023          │
 *    │  (♥)    (✓)    (▶)    (↗)     │  ← rangée d'actions, comme la fiche Contact
 *    │ Envie    Lu    Lire  Partager │
 *    │ Passer toutes les épreuves…⌄  │  ← résumé, 4 lignes, toucher pour déplier
 *    │ (◉) Rebecca Yarros         ›  │
 *    │     12 livres                 │
 *    └───────────────────────────────┘
 *
 * Les actions, selon où en est le livre dans ma bibliothèque :
 * - **Envie** ♥ : mes envies, première étagère de l'onglet (rouge si gardé).
 * - **Lu** ✓ : pas dans ma bibliothèque → l'y range directement dans « Lus »
 *   (sans changer le livre de l'accueil) ; commencé → ma page passe à la
 *   dernière ; déjà lu → rouge, rien à faire.
 * - **Lire** ▶ : pas dans ma bibliothèque → le parcours de création, livre
 *   déjà rempli ; dans ma PAL (« Non lus ») → il passe sur l'accueil et on
 *   choisit sa date de fin ; en cours ou lu → **Ouvrir** sur l'accueil.
 * - **Partager** ↗ : le partage iOS.
 * - La ligne de l'autrice ouvre ses livres par-dessus la fiche (`/explore-author`).
 *
 * Pas de note ni d'avis (pas de fiche produit, DESIGN.md). Le livre vient du
 * store (`selectedBook`).
 */

import { useRouter } from 'expo-router';
import { BookOpenIcon, CheckIcon, ChevronRightIcon, HeartIcon, PlayIcon, ShareIcon, type LucideIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { AccentUnit } from '../components/ui/AccentWord';
import BookCover, { COVER_RATIO } from '../components/ui/BookCover';
import { AuthorAvatar, type ExploreAuthor } from '../components/ui/ExploreAuthors';
import GlassButton from '../components/ui/GlassButton';
import PressableScale from '../components/ui/PressableScale';
import SheetPage from '../components/ui/SheetPage';
import authorsCatalog from '../constants/exploreAuthors.json';
import { fetchAuthorBooks, fetchEditions, fetchSummary } from '../services/bookApi';
import { updateUserProgress } from '../services/supabase/database';
import { createReading, settleMyReading } from '../services/onboarding';
import { useAuthStore } from '../stores/authStore';
import { useExploreStore } from '../stores/exploreStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useProjectStore } from '../stores/projectStore';
import { colors, fonts, spacing } from '../utils/constants';
import { feel } from '../utils/feel';
import { readingOf } from '../utils/library';
import { oops } from '../utils/notice';
import { compactText } from '../utils/normalizeText';
import { startAdding } from '../utils/onboardingFlow';

/** La couverture de la carte : un peu plus grande que celle de l'accueil (54), pas le sujet */
const COVER_W = 84;
const AUTHOR_AVATAR = 44;
const FACTS_SIZE = 14;
/** Le résumé replié : assez pour donner envie, pas une page de texte */
const SUMMARY_LINES = 4;

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
  const myProgress = useProjectStore((state) => state.myProgress);
  const userId = useAuthStore((state) => state.user?.id ?? null);

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

  // La première autrice : sa photo si elle est dans les auteur·ices d'Explorer
  const author = useMemo<ExploreAuthor | null>(() => {
    const name = book?.author?.split(',')[0].trim();
    if (!name) return null;
    const key = compactText(name);
    return AUTHORS.find((a) => compactText(a.name) === key) ?? { name, photoUrl: null };
  }, [book?.author]);

  // Le résumé, et combien de livres a l'autrice : deux recherches en ligne,
  // la fiche s'affiche sans les attendre
  const [summary, setSummary] = useState<string | null>(book?.description ?? null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  useEffect(() => {
    setSummary(book?.description ?? null);
    setSummaryOpen(false);
    if (!book) return;
    let cancelled = false;
    fetchSummary(book)
      .then((text) => !cancelled && setSummary(text))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [book]);

  const [authorCount, setAuthorCount] = useState<number | null>(null);
  useEffect(() => {
    setAuthorCount(null);
    if (!author) return;
    let cancelled = false;
    fetchAuthorBooks(author.name)
      .then((books) => !cancelled && setAuthorCount(books.length))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [author]);

  // Déjà dans ma bibliothèque ? Alors on l'ouvre au lieu d'en relancer un
  const inLibrary = useMemo(() => {
    if (!book) return null;
    const title = compactText(book.title);
    return challenges.find((c) => compactText(c.book_title) === title) ?? null;
  }, [book, challenges]);

  // Où j'en suis de ce livre : pas dans ma bibliothèque, non lu (PAL), en cours, lu
  const reading = inLibrary ? readingOf(myProgress[inLibrary.id]) : null;
  const isRead = reading?.state === 'done';
  const [marking, setMarking] = useState(false);

  const handleRead = useCallback(() => {
    if (!book) return;
    if (inLibrary) {
      if (reading?.state === 'unread') {
        // Dans ma PAL : il passe sur l'accueil, et on choisit sa date de fin
        setActiveChallenge(inLibrary);
        router.push({ pathname: '/end-date', params: { from: 'explore' } });
        return;
      }
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
  }, [book, pageCount, inLibrary, reading?.state, setActiveChallenge, router]);

  const handleDone = useCallback(async () => {
    if (!book || !userId || isRead || marking) return;
    setMarking(true);
    try {
      const store = useProjectStore.getState();
      if (inLibrary) {
        // Commencé ou dans ma PAL : ma page passe à la dernière de MON édition
        const mine = store.myProgress[inLibrary.id];
        const total =
          mine && mine.progress_percentage > 0
            ? Math.round((mine.current_page * 100) / mine.progress_percentage)
            : mine && mine.format !== 'papier'
              ? 100
              : inLibrary.total_pages;
        await updateUserProgress(inLibrary.id, userId, total);
      } else {
        // Lu avant chapi : rangé dans « Lus », sans prendre la place du livre de l'accueil
        const previous = store.activeChallenge;
        const challenge = await createReading(
          userId,
          { title: book.title, author: book.author, pages: pageCount ?? 0, cover: book.coverUrl, publisher: book.publisher },
          null,
        );
        await settleMyReading(challenge.id, userId, { format: 'papier', start: challenge.total_pages });
        store.setActiveChallenge(previous);
      }
      await store.loadMyProgress(userId);
      feel('fini');
    } catch (error) {
      oops('Pas pu le marquer lu', error, { retry: handleDone });
    } finally {
      setMarking(false);
    }
  }, [book, userId, isRead, marking, inLibrary, pageCount]);

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
  const opens = !!inLibrary && reading?.state !== 'unread';

  return (
    <SheetPage title="">
      {/* Comme la carte du livre de l'accueil : la couverture à gauche, le titre,
          l'autrice et les repères à droite (Lea : la couverture ne doit pas
          voler la vedette au titre) */}
      <View style={styles.hero}>
        <View style={styles.cover}>
          <BookCover coverUrl={book.coverUrl} outlined />
        </View>
        <View style={styles.heroTexts}>
          <Text style={styles.title} numberOfLines={3} accessibilityRole="header">
            {book.title}
          </Text>
          {!!book.author && (
            <Text style={styles.heroAuthor} numberOfLines={1}>
              {book.author}
            </Text>
          )}
          {(!!pageCount || !!year) && (
            <Text style={styles.facts} accessibilityLabel={[pageCount && `${pageCount} pages`, year].filter(Boolean).join(', ')}>
              {!!pageCount && (
                <>
                  {pageCount}
                  <AccentUnit size={FACTS_SIZE} color={colors.textSecondary}>{' p.'}</AccentUnit>
                </>
              )}
              {!!pageCount && !!year && '  ·  '}
              {year}
            </Text>
          )}
        </View>
      </View>

      {/* Quatre places fixes, comme la fiche Contact d'iOS */}
      <View style={styles.actions}>
        <Action
          icon={HeartIcon}
          label="Envie"
          selected={isFavorite}
          fill
          onPress={() => toggleFavorite(book)}
          accessibilityLabel={isFavorite ? 'Retirer de mes envies' : 'Garder dans mes envies'}
        />
        <Action
          icon={CheckIcon}
          label="Lu"
          selected={isRead}
          onPress={handleDone}
          accessibilityLabel={isRead ? 'Lu' : 'Je l’ai lu'}
        />
        <Action
          icon={opens ? BookOpenIcon : PlayIcon}
          label={opens ? 'Ouvrir' : 'Lire'}
          onPress={handleRead}
          accessibilityLabel={opens ? 'Ouvrir sur l’accueil' : 'Lancer une lecture'}
        />
        <Action icon={ShareIcon} label="Partager" onPress={handleShare} accessibilityLabel="Partager" />
      </View>

      {!!summary && (
        <PressableScale
          onPress={() => setSummaryOpen((open) => !open)}
          style={styles.summaryBox}
          accessibilityRole="button"
          accessibilityHint={summaryOpen ? 'Replier le résumé' : 'Lire tout le résumé'}
        >
          <Text style={styles.summary} numberOfLines={summaryOpen ? undefined : SUMMARY_LINES}>
            {summary}
          </Text>
        </PressableScale>
      )}

      {author && (
        <PressableScale
          onPress={handleAuthor}
          style={styles.author}
          accessibilityRole="button"
          accessibilityLabel={authorCount ? `${author.name}, ${authorCount} livres` : author.name}
          accessibilityHint="Voir ses livres"
        >
          <AuthorAvatar author={author} size={AUTHOR_AVATAR} />
          <View style={styles.authorTexts}>
            <Text style={styles.authorName} numberOfLines={1}>
              {author.name}
            </Text>
            {authorCount !== null && authorCount > 1 && (
              <Text style={styles.authorCount}>{authorCount} livres</Text>
            )}
          </View>
          <ChevronRightIcon size={20} color={colors.textTertiary} strokeWidth={2.25} />
        </PressableScale>
      )}
    </SheetPage>
  );
}

/** Un rond en verre et son mot dessous */
function Action({
  icon,
  label,
  onPress,
  accessibilityLabel,
  selected = false,
  fill = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  selected?: boolean;
  fill?: boolean;
}) {
  return (
    <View style={styles.action}>
      <GlassButton
        icon={icon}
        selected={selected}
        fillWhenSelected={fill}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
      />
      <Text style={[styles.actionLabel, selected && styles.actionLabelOn]} importantForAccessibility="no">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  cover: {
    width: COVER_W,
    aspectRatio: COVER_RATIO,
  },
  heroTexts: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 27,
    color: colors.textPrimary,
  },
  heroAuthor: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textTertiary,
    marginTop: 2,
  },
  facts: {
    fontFamily: fonts.bodySemiBold,
    fontSize: FACTS_SIZE,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing['2xl'],
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionLabelOn: {
    color: colors.accent,
  },
  summaryBox: {
    marginTop: spacing['2xl'],
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
  authorTexts: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  authorCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textTertiary,
  },
});
