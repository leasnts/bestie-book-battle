/**
 * La carte de lecture de la fin de l'onboarding (essai A, Lea, 2026-11-12).
 *
 * - `FlipCard` : une carte en papier cousu qui se retourne (recto → verso).
 *   Les deux faces se superposent au centre : le recto garde sa place
 *   d'avant, le verso, plus haut, déborde autant en haut qu'en bas.
 * - `CardPaper` : la matière, celle de la carte d'« Invite tes potes ».
 * - `ReadingCardBack` : le verso, ma carte de lecture. Ses lignes s'écrivent
 *   une à une à l'encre (de gauche à droite), puis la date se tamponne.
 *
 *    ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐
 *    ┊ CARTE DE LECTURE      LILI  ┊
 *    ┊ ▐█▌ Educated               ┊
 *    ┊     Tara Westover           ┊
 *    ┊ ─────────────────────────── ┊
 *    ┊ Format        Papier · Folio┊
 *    ┊ Où              p. 12 / 352 ┊
 *    ┊ …                ╱12 NOV.╱  ┊
 *    └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { deadlineFrom } from '../../services/onboarding';
import { bookFormat, type OnboardingStore } from '../../stores/onboardingStore';
import { borderRadius, colors, fonts, inkAlpha, lowki, paperFrameGradient, spacing } from '../../utils/constants';
import { FLIP_MS } from '../../utils/finishOnboarding';
import BookCover, { COVER_RATIO } from '../ui/BookCover';
import { InkStamp } from '../ui/Stamp';
import { StitchBorder } from '../ui/Stitch';
import { MOMENTS } from './choices';

/** La matière de la carte : papier + couture */
export function CardPaper({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={paperFrameGradient} style={[styles.paper, style]}>
      <StitchBorder radius={borderRadius.xl} />
      {children}
    </LinearGradient>
  );
}

/** Une carte qui se retourne quand `turned` passe à true */
export function FlipCard({ front, back, turned }: { front: React.ReactNode; back: React.ReactNode; turned: boolean }) {
  const reducedMotion = useReducedMotion();
  const turn = useSharedValue(turned ? 1 : 0);
  useEffect(() => {
    turn.value = reducedMotion
      ? turned
        ? 1
        : 0
      : withTiming(turned ? 1 : 0, {
          duration: FLIP_MS,
          easing: Easing.bezier(0.45, 0.05, 0.2, 1),
        });
  }, [turned, reducedMotion, turn]);

  // Un peu soulevée au milieu du geste, comme une carte qu'on prend du bout des doigts
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1100 },
      { rotateY: `${turn.value * 180}deg` },
      { scale: interpolate(turn.value, [0, 0.5, 1], [1, 1.05, 1]) },
    ],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1100 },
      { rotateY: `${turn.value * 180 - 180}deg` },
      { scale: interpolate(turn.value, [0, 0.5, 1], [1, 1.05, 1]) },
    ],
  }));

  return (
    <View>
      {/* Le verso donne la hauteur ; le recto se centre dessus */}
      <Animated.View style={[styles.face, backStyle]} pointerEvents={turned ? 'auto' : 'none'}>
        {back}
      </Animated.View>
      <View style={styles.frontPlace} pointerEvents={turned ? 'none' : 'box-none'}>
        <Animated.View style={[styles.face, frontStyle]}>{front}</Animated.View>
      </View>
    </View>
  );
}

/** Les lignes de ma carte, d'après le brouillon */
export function cardRows(store: OnboardingStore): [string, string][] {
  const { book, invitation, start, dated, days, moments, invited, flow } = store;
  if (!book) return [];
  const format = bookFormat(store);
  const percent = format !== 'papier';
  const end = deadlineFrom(dated, days);
  const list: [string, string][] = [
    [
      'Format',
      format === 'papier' ? ['Papier', book.publisher].filter(Boolean).join(' · ') : `${format === 'liseuse' ? 'Liseuse' : 'Audio'} · en %`,
    ],
    ['Où', percent ? `${start} %` : `p. ${start} / ${book.pages}`],
  ];
  if (flow === 'create' || flow === 'join') {
    list.push([
      'Quand',
      MOMENTS.filter((m) => moments.includes(m.key))
        .map((m) => m.label)
        .join(', ') || '—',
    ]);
  }
  if (!invitation)
    list.push([
      'Fin',
      end
        ? new Date(`${end}T12:00:00`).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
          })
        : 'Sans date',
    ]);
  if (invitation) list.push(['Avec', (invitation.readers ?? []).map((r) => r.name).join(', ') || invitation.adminFirstName]);
  else if (invited) list.push(['Avec', 'invitation envoyée']);
  return list;
}

/** Le livre : vignette, titre, auteur (le recto et le verso le partagent) */
export function CardBook({ title, author, cover }: { title: string; author?: string; cover: string | null }) {
  return (
    <View style={styles.bookRow}>
      <View style={styles.thumb}>
        <BookCover coverUrl={cover} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {!!author && (
          <Text style={styles.author} numberOfLines={1}>
            {author}
          </Text>
        )}
      </View>
    </View>
  );
}

export function ReadingCardBack({
  firstName,
  book,
  rows,
  written,
  stamped,
}: {
  firstName: string;
  book: { title: string; author?: string; cover: string | null };
  rows: [string, string][];
  /** Combien de lignes sont déjà écrites */
  written: number;
  /** La date se tamponne */
  stamped: boolean;
}) {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <View>
      <CardPaper>
        <View
          accessible
          accessibilityLabel={`Carte de lecture de ${firstName} : ${book.title}. ${rows.map(([l, v]) => `${l} : ${v}`).join('. ')}`}
        >
          <View style={styles.head}>
            <Text style={styles.headText}>Carte de lecture</Text>
            <Text style={styles.headText} numberOfLines={1}>
              {firstName}
            </Text>
          </View>
          <CardBook {...book} />
          <View style={styles.rule} />
          {rows.map(([label, value], i) => (
            <View key={label} style={[styles.row, i === rows.length - 1 && styles.lastRow]}>
              <Text style={styles.label}>{label}</Text>
              <InkLine text={value} shown={i < written} />
            </View>
          ))}
        </View>
        {/* La place du tampon, en bas à droite du papier (sur l'aquarelle rouge, l'encre rouge se perdrait) */}
        <View style={styles.stampPlace}>{stamped && <InkStamp label={today} delay={0} angle={-7} style={styles.stamp} />}</View>
      </CardPaper>
    </View>
  );
}

/** Une valeur qui s'écrit à l'encre, de gauche à droite */
function InkLine({ text, shown }: { text: string; shown: boolean }) {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = shown
      ? reducedMotion
        ? 1
        : withTiming(1, {
            duration: 420,
            easing: Easing.bezier(0.3, 0.7, 0.3, 1),
          })
      : 0;
  }, [shown, reducedMotion, reveal]);
  const clip = useAnimatedStyle(() => ({ width: width * reveal.value }));
  return (
    <View style={styles.valuePlace}>
      {/* La place de la valeur, invisible : elle donne la largeur à découvrir */}
      <Text
        style={[styles.value, styles.ghost]}
        numberOfLines={1}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        {text}
      </Text>
      <Animated.View style={[styles.clip, clip]}>
        <Text style={[styles.value, { width }]} numberOfLines={1}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

const THUMB_W = 48;

const styles = StyleSheet.create({
  paper: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  face: {
    backfaceVisibility: 'hidden',
  },
  frontPlace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: lowki.red.dark,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: THUMB_W,
    aspectRatio: COVER_RATIO,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textTertiary,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: inkAlpha(0.12),
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: inkAlpha(0.1),
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },
  valuePlace: {
    flexShrink: 1,
  },
  value: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  ghost: {
    opacity: 0,
  },
  clip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  stampPlace: {
    height: 40,
  },
  stamp: {
    right: spacing.xs,
    bottom: 0,
  },
});
