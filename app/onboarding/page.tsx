/**
 * Où en est ta lecture ? Ma position dans ce livre-là.
 *
 * En lançant une lecture, le livre, son édition et pages ou % se règlent à
 * « On lit quoi ? » : ici, il ne reste que la règle. En rejoignant (pas d'écran
 * « On lit quoi ? »), on demande aussi le format et l'édition :
 * - « En quel format ? » : un seul format pour ce livre, rien de
 *   choisi d'avance ; l'édition et la règle n'apparaissent qu'ensuite.
 * - Papier : on compte en pages de MON édition, demandée ici seulement
 *   (le crayon rouvre la recherche, étape des éditions).
 * - Liseuse ou audio : on compte en %, la règle va de 0 à 100.
 * - La règle est celle de Ma page (PageRuler) : on apprend l'app en répondant.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PencilIcon } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import { FORMATS } from '../../components/onboarding/choices';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import { COVER_RATIO, CoverImage } from '../../components/ui/BookCover';
import OptionList from '../../components/onboarding/OptionList';
import GlassButton from '../../components/ui/GlassButton';
import PageRuler from '../../components/ui/PageRuler';
import { bookFormat, useOnboardingStore, type BookDraft } from '../../stores/onboardingStore';
import type { BookFormat } from '../../types/supabase';
import { borderRadius, colors, fonts, inkAlpha, paperFrameGradient, spacing } from '../../utils/constants';
import { nextStep } from '../../utils/onboardingFlow';

const THUMB_W = 40;

export default function PageScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { flow, invitation, book, start, bookPick, patch } = store;
  const format = bookFormat(store);
  const percent = format !== 'papier';
  // Rejoindre : pas d'écran « On lit quoi ? », le format et l'édition se règlent ici
  const joining = flow === 'join' || flow === 'addJoin';

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

  /** Changer de format garde la position : pages ↔ % */
  const setFormat = (next: BookFormat) => {
    if (next === store.format) return;
    const toPercent = next !== 'papier';
    const converted = toPercent ? Math.round((start / book.pages) * 100) : Math.round((start / 100) * book.pages);
    patch({ format: next, start: percent === toPercent ? start : converted });
  };

  return (
    <OnboardingScreen
      step="page"
      title="Où en est ta lecture ?"
      accent="lecture"
      footer={
        <Button3D
          variant="primary"
          onPress={() => router.push(nextStep(flow, 'page'))}
          disabled={!store.format}
          style={styles.wide}
        >
          Continuer
        </Button3D>
      }
    >
      {joining && (
        <Animated.View entering={rise(1)} style={styles.group}>
          <OptionList options={FORMATS} value={store.format} onChange={setFormat} />
        </Animated.View>
      )}

      {joining && store.format === 'papier' && (
        <Animated.View entering={rise(2)}>
          <Edition
            book={book}
            sameAs={invitation ? invitation.adminFirstName : null}
            onChange={() => router.push({ pathname: '/book-search', params: { q: book.title, for: 'edition' } })}
          />
        </Animated.View>
      )}

      {store.format && (
        <Animated.View entering={rise(3)} style={styles.ruler}>
          <PageRuler
            key={percent ? 'percent' : 'pages'}
            currentPage={start}
            totalPages={percent ? 100 : book.pages}
            onPageChange={(value) => patch({ start: value })}
            unit={percent ? 'percent' : 'pages'}
            fontSize={80}
          />
          {percent && (
            <Text style={styles.hint}>{format === 'audio' ? 'En %, l’audio n’a pas de pages' : 'En %, comme sur ta liseuse'}</Text>
          )}
        </Animated.View>
      )}
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
  group: {
    gap: spacing.lg,
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
  ruler: {
    flex: 1,
    minHeight: 220,
  },
  hint: {
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});
