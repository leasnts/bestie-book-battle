/**
 * Où en est ta lecture ? Ma position dans ce livre-là.
 *
 *    ( p. ) ( % )                  pages (papier) ou % (liseuse, audio)
 *          112                     au milieu de l'écran, la règle de Ma page
 *    ·······●···········
 *    [ Continuer ]
 *    [ Modifier le total ]         le total (« /503 »), si mon édition diffère
 *
 * - En pages par défaut.
 * - En pages, le total vient de l'édition choisie à « On lit quoi ? » (ou de la
 *   lecture qu'on rejoint) ; « Modifier le total » passe la règle sur le total. Total inconnu
 *   (livre ajouté à la main) : la règle commence par lui.
 * - En rejoignant, papier : mon édition, le crayon rouvre la recherche.
 * - En %, la règle va de 0 à 100.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PencilIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import { COVER_RATIO, CoverImage } from '../../components/ui/BookCover';
import UnitButtons, { type Unit } from '../../components/onboarding/UnitButtons';
import GlassButton from '../../components/ui/GlassButton';
import PageRuler from '../../components/ui/PageRuler';
import { bookFormat, useOnboardingStore, type BookDraft } from '../../stores/onboardingStore';
import type { BookFormat } from '../../types/supabase';
import { borderRadius, colors, fonts, inkAlpha, paperFrameGradient, ROUND_BUTTON_SIZE, spacing } from '../../utils/constants';
import { nextStep } from '../../utils/onboardingFlow';

const THUMB_W = 40;
/** La hauteur du compteur et de sa règle */
const RULER_H = 240;
/** Plafond de la règle du total de pages */
const MAX_PAGES = 2000;

export default function PageScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { flow, invitation, book, start, bookPick, usualFormats, patch } = store;
  const format = bookFormat(store);
  const percent = format !== 'papier';
  const unit: Unit = percent ? 'percent' : 'pages';
  // Rejoindre : pas d'écran « On lit quoi ? », l'édition se règle ici
  const joining = flow === 'join' || flow === 'addJoin';
  // La règle sur le total de pages ; d'office quand on ne le connaît pas
  const [editingTotal, setEditingTotal] = useState(false);
  const totalUnknown = !!book && book.pages === 0;
  const onTotal = !percent && (editingTotal || totalUnknown);

  // En pages par défaut (Lea, 2026-10-30) : le compteur est là d'emblée
  useEffect(() => {
    if (useOnboardingStore.getState().format === null) patch({ format: 'papier' });
  }, [patch]);

  // Rejoindre : mon édition part de celle de la lecture
  useEffect(() => {
    if (!book && invitation) {
      patch({
        book: { title: invitation.title, author: invitation.author, pages: invitation.pages, cover: invitation.cover, publisher: null },
      });
    }
  }, [book, invitation, patch]);

  // Une autre édition, choisie dans la recherche : ses pages, sa couverture
  useEffect(() => {
    if (bookPick?.target !== 'edition' || !book) return;
    const edition = bookPick.book;
    const pages = edition.pageCount ?? book.pages;
    patch({
      book: { ...book, pages, cover: edition.coverUrl ?? book.cover, publisher: edition.publisher },
      start: Math.min(start, pages),
    });
    useOnboardingStore.getState().setBookPick(null);
  }, [bookPick, book, start, patch]);

  if (!book) return null;

  /** Pages → papier ; % → liseuse, ou audio si c'est ce qu'on écoute d'habitude. La position suit. */
  const setUnit = (next: Unit) => {
    const toPercent = next === 'percent';
    const nextFormat: BookFormat = !toPercent
      ? 'papier'
      : usualFormats.includes('audio') && !usualFormats.includes('liseuse')
        ? 'audio'
        : 'liseuse';
    const converted =
      book.pages === 0 ? 0 : toPercent ? Math.round((start / book.pages) * 100) : Math.round((start / 100) * book.pages);
    patch({ format: nextFormat, start: percent === toPercent ? start : converted });
  };

  const setTotal = (pages: number) => patch({ book: { ...book, pages }, start: Math.min(start, pages) });

  return (
    <OnboardingScreen
      step="page"
      title="Où en est ta lecture ?"
      accent="lecture"
      footer={
        <>
          <Button3D
            variant="primary"
            onPress={() => router.push(nextStep(flow, 'page'))}
            disabled={!percent && book.pages === 0}
            style={styles.wide}
          >
            Continuer
          </Button3D>
          {!percent && !totalUnknown && (
            <Button3D variant="secondary" onPress={() => setEditingTotal(!editingTotal)} style={styles.wide}>
              {editingTotal ? 'Valider le total' : 'Modifier le total'}
            </Button3D>
          )}
        </>
      }
    >
      <Animated.View entering={rise(1)}>
        <UnitButtons value={unit} onChange={setUnit} />
      </Animated.View>

      {joining && unit === 'pages' && (
        <Animated.View entering={rise(2)}>
          <Edition
            book={book}
            sameAs={invitation ? invitation.adminFirstName : null}
            onChange={() => router.push({ pathname: '/book-search', params: { q: book.title, for: 'edition' } })}
          />
        </Animated.View>
      )}

      <Animated.View entering={rise(3)} style={styles.ruler}>
        <View style={styles.rulerBox}>
          {onTotal ? (
            <PageRuler key="total" currentPage={book.pages} totalPages={MAX_PAGES} onPageChange={setTotal} unit="count" fontSize={80} />
          ) : (
            <PageRuler
              key={percent ? 'percent' : `pages-${book.pages}`}
              currentPage={start}
              totalPages={percent ? 100 : book.pages}
              onPageChange={(value) => patch({ start: value })}
              unit={percent ? 'percent' : 'pages'}
              fontSize={80}
            />
          )}
        </View>
      </Animated.View>
    </OnboardingScreen>
  );
}

/** Mon édition papier : sa couverture, son éditeur, ses pages ; le crayon en change */
function Edition({ book, sameAs, onChange }: { book: BookDraft; sameAs: string | null; onChange: () => void }) {
  return (
    <View style={styles.edition}>
      {book.cover ? (
        <CoverImage uri={book.cover} style={styles.thumb} />
      ) : (
        <LinearGradient colors={paperFrameGradient} style={styles.thumb} />
      )}
      <View style={styles.editionText}>
        <Text style={styles.editionTitle} numberOfLines={1}>
          {[book.publisher, `${book.pages} pages`].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.editionSub} numberOfLines={1}>
          {sameAs ? `L’édition de ${sameAs}` : 'Ton édition papier'}
        </Text>
      </View>
      <GlassButton icon={PencilIcon} onPress={onChange} accessibilityLabel="Changer d’édition" />
    </View>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  edition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  thumb: {
    width: THUMB_W,
    height: THUMB_W / COVER_RATIO,
    borderRadius: 2,
  },
  editionText: {
    flex: 1,
    gap: 2,
  },
  editionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  editionSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },
  // Le compteur au milieu de l'écran : la marge du bas compense les boutons p. / %
  ruler: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: ROUND_BUTTON_SIZE,
  },
  rulerBox: {
    height: RULER_H,
  },
});
