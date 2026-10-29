/**
 * Tu lis quoi en ce moment ? La recherche d'abord : quelques lettres, puis le livre et son
 * édition dans le sheet de recherche (/book-search, le même que partout).
 * Couverture, pages et éditeur arrivent avec lui. La saisie à la main reste
 * possible ; une couverture absente ne bloque plus rien.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SearchIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import { COVER_RATIO, CoverImage } from '../../components/ui/BookCover';
import { useStamp } from '../../components/ui/Stamp';
import { useOnboardingStore, type BookDraft } from '../../stores/onboardingStore';
import { borderRadius, colors, fonts, fontSize, inkAlpha, paperFrameGradient, shadows, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { nextStep } from '../../utils/onboardingFlow';

const COVER_W = 112;

export default function LivreScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const book = useOnboardingStore((s) => s.book);
  const bookPick = useOnboardingStore((s) => s.bookPick);
  const patch = useOnboardingStore((s) => s.patch);
  const [manual, setManual] = useState(false);

  // Le livre choisi dans le sheet de recherche : on le reprend, puis on vide le dépôt
  useEffect(() => {
    if (bookPick?.target !== 'livre') return;
    const picked = bookPick.book;
    feel('tic');
    patch({
      book: {
        title: picked.title,
        author: picked.author,
        pages: picked.pageCount ?? 0,
        cover: picked.coverUrl,
        publisher: picked.publisher,
      },
      format: null,
      start: 0,
    });
    setManual(false);
    useOnboardingStore.getState().setBookPick(null);
  }, [bookPick, patch]);

  const search = () => router.push('/book-search');
  const ready = !!book && book.title.trim().length > 0 && book.pages > 0;

  return (
    <OnboardingScreen
      step="livre"
      title="Tu lis quoi en ce moment ?"
      accent="quoi"
      scroll
      footer={
        <>
          <Button3D variant="primary" disabled={!ready} onPress={() => router.push(nextStep(flow, 'livre'))} style={styles.wide}>
            C'est celui-là
          </Button3D>
          {!book && !manual && (
            <Pressable onPress={() => setManual(true)} hitSlop={8} accessibilityRole="button" style={styles.link}>
              <Text style={styles.linkText}>Ajouter à la main</Text>
            </Pressable>
          )}
        </>
      }
    >
      {book && !manual ? (
        <PickedBook book={book} onChange={search} onPages={(pages) => patch({ book: { ...book, pages } })} />
      ) : manual ? (
        <ManualBook onChange={(draft) => patch({ book: draft, format: null, start: 0 })} />
      ) : (
        <Animated.View entering={rise(1)}>
          <Pressable style={styles.search} onPress={search} accessibilityRole="search" accessibilityLabel="Chercher un livre">
            <SearchIcon size={20} color={colors.placeholder} />
            <Text style={styles.searchText}>Titre, auteur·ice, saga</Text>
          </Pressable>
        </Animated.View>
      )}
    </OnboardingScreen>
  );
}

/** Le livre choisi : sa couverture se pose, sous elle titre, auteur·ice, édition */
function PickedBook({ book, onChange, onPages }: { book: BookDraft; onChange: () => void; onPages: (pages: number) => void }) {
  const { style: landed } = useStamp({ fallAfter: 0, height: 40, grow: 0.06 });
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.picked}>
      <Animated.View style={landed}>
        {book.cover ? (
          <CoverImage uri={book.cover} style={styles.cover} />
        ) : (
          <LinearGradient colors={paperFrameGradient} style={[styles.cover, styles.noCover]} />
        )}
      </Animated.View>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={3}>{book.title}</Text>
        {!!book.author && <Text style={styles.author} numberOfLines={2}>{book.author}</Text>}
        {book.pages > 0 ? (
          <Text style={styles.edition}>{[book.publisher, `${book.pages} p.`].filter(Boolean).join(' · ')}</Text>
        ) : (
          <TextInput
            style={[styles.input, styles.pagesInput]}
            placeholder="Nombre de pages"
            placeholderTextColor={colors.placeholder}
            keyboardType="number-pad"
            onChangeText={(text) => onPages(Number(text.replace(/[^0-9]/g, '')) || 0)}
            accessibilityLabel="Nombre de pages de mon édition"
          />
        )}
        <Pressable onPress={onChange} hitSlop={8} accessibilityRole="button" style={styles.other}>
          <Text style={styles.linkText}>Un autre livre</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/** Le livre à la main : titre, auteur·ice, pages */
function ManualBook({ onChange }: { onChange: (book: BookDraft) => void }) {
  const [draft, setDraft] = useState({ title: '', author: '', pages: '' });
  const update = (field: keyof typeof draft, value: string) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    onChange({ title: next.title.trim(), author: next.author.trim(), pages: Number(next.pages) || 0, cover: null, publisher: null });
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.form}>
      <TextInput style={styles.input} placeholder="Titre" placeholderTextColor={colors.placeholder} value={draft.title} onChangeText={(t) => update('title', t)} autoFocus autoCapitalize="sentences" accessibilityLabel="Titre du livre" />
      <TextInput style={styles.input} placeholder="Auteur·ice" placeholderTextColor={colors.placeholder} value={draft.author} onChangeText={(t) => update('author', t)} autoCapitalize="words" accessibilityLabel="Auteur·ice" />
      <TextInput style={styles.input} placeholder="Nombre de pages" placeholderTextColor={colors.placeholder} value={draft.pages} onChangeText={(t) => update('pages', t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" accessibilityLabel="Nombre de pages" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  link: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
  },
  searchText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.placeholder,
  },
  picked: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.lg,
  },
  cover: {
    width: COVER_W,
    height: COVER_W / COVER_RATIO,
  },
  noCover: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 21,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  edition: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  other: {
    minHeight: 44,
    justifyContent: 'center',
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
  pagesInput: {
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
});
