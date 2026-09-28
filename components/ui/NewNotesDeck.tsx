/**
 * NewNotesDeck — les nouvelles notes du club, en pile, une à la fois.
 *
 *    Nouvelles                 1 / 4
 *    p. 142–157
 *      ┌──────────────────────┐
 *     ┌┴─────────────────────┐│      ← deux cartes décalées derrière :
 *     │ note de Zoé    p. 142 ││        on sent qu'il y a une pile
 *     │ …                     │┘
 *     └───────────────────────┘
 *
 * Le carnet s'ouvre sur elles quand il y en a (page entière, depuis l'accueil) :
 * on lit d'abord ce qui est nouveau, seul, puis le carnet entier apparaît.
 *
 * - **Glisser à gauche ou à droite = lue.** Les deux sens font la même chose :
 *   on passe à la suivante, sans choix à faire. Une coche apparaît pendant le
 *   geste, la carte s'envole en tournant un peu, la suivante monte.
 * - On peut réagir avant de glisser (les pastilles de `NoteCard`).
 * - La première carte fait un petit aller-retour à l'ouverture : elle montre
 *   qu'elle se glisse, sans texte d'aide.
 * - Après la dernière : « Tout lu », puis `onDone` (le carnet dissout la pile).
 * - VoiceOver ne glisse pas : un bouton « Marquer comme lue » apparaît sous la
 *   pile quand il est actif. Reduce Motion : la carte s'efface sur place.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import { pageFromPosition } from '../../utils/annotations';
import {
  accentGradient,
  colors,
  fonts,
  inkGradient,
  motion,
  shadowAlpha,
  spacing,
} from '../../utils/constants';
import NoteCard from './NoteCard';
import PressableScale from './PressableScale';

interface NewNotesDeckProps {
  /** Les nouvelles, dans l'ordre des pages ; figées à l'ouverture du carnet */
  notes: AnnotationWithAuthor[];
  myTotalPages: number;
  myUserId?: string;
  /** Une note glissée : elle est lue */
  onRead: (noteId: string) => void;
  onToggleReaction: (note: AnnotationWithAuthor, emoji: string) => void;
  onMoreReactions: (noteId: string) => void;
  /** Toutes lues, « Tout lu » affiché : le carnet peut prendre la place */
  onDone: () => void;
}

/** Hauteur d'une carte : de quoi lire six lignes, réactions comprises */
const CARD_HEIGHT = 300;
/** Ce qui dépasse de chaque carte sous la précédente */
const DEPTH_OFFSET = 12;
/** Rétrécie de 5 % par rang : le bas remonte d'autant, on le compense */
const DEPTH_SCALE = 0.05;
const DEPTH_STEP = DEPTH_OFFSET + (CARD_HEIGHT * DEPTH_SCALE) / 2;
/** Glisser au-delà (ou lancer assez vite) = lue */
const SWIPE_DISTANCE = 100;
const SWIPE_VELOCITY = 800;
/** Le temps de lire « Tout lu » avant que le carnet prenne la place */
const DONE_PAUSE = 900;

const easeOut = Easing.bezier(...motion.easing.easeOutQuart);

export default function NewNotesDeck({
  notes,
  myTotalPages,
  myUserId,
  onRead,
  onToggleReaction,
  onMoreReactions,
  onDone,
}: NewNotesDeckProps) {
  const [index, setIndex] = useState(0);
  const screenReader = useScreenReader();
  /** Les cartes du premier affichage sont déjà en place ; les suivantes montent */
  const firstIds = useRef(new Set(notes.slice(0, 3).map((note) => note.id)));

  const done = index >= notes.length;
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(onDone, DONE_PAUSE);
    return () => clearTimeout(timer);
  }, [done, onDone]);

  const swiped = (noteId: string) => {
    onRead(noteId);
    setIndex((i) => i + 1);
  };

  const first = notes[0];
  const last = notes[notes.length - 1];
  const range =
    first && last
      ? `p. ${pageFromPosition(first.position, myTotalPages)}–${pageFromPosition(last.position, myTotalPages)}`
      : '';

  // La carte du dessus en dernier : elle se dessine par-dessus les autres
  const pile = notes.slice(index, index + 3);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View>
          <Text style={styles.title} accessibilityRole="header">
            Nouvelles
          </Text>
          <Text style={styles.range}>{range}</Text>
        </View>
        {!done && (
          <Text style={styles.count} accessibilityLabel={`Note ${index + 1} sur ${notes.length}`}>
            <Text style={styles.countNow}>{index + 1}</Text> / {notes.length}
          </Text>
        )}
      </View>

      <View style={styles.deck}>
        {[...pile].reverse().map((note) => {
          const depth = pile.indexOf(note);
          return (
            <SwipeCard
              key={note.id}
              note={note}
              depth={depth}
              appearing={!firstIds.current.has(note.id)}
              hint={note.id === first?.id}
              onSwiped={swiped}
            >
              <NoteCard
                large
                note={note}
                myTotalPages={myTotalPages}
                isMine={false}
                myUserId={myUserId}
                onToggleReaction={(emoji) => onToggleReaction(note, emoji)}
                onMoreReactions={() => onMoreReactions(note.id)}
              />
            </SwipeCard>
          );
        })}

        {done && (
          <Animated.View entering={FadeIn.duration(motion.duration.slow)} style={styles.allRead}>
            <View style={styles.ring}>
              <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
              <CheckIcon size={30} color={colors.white} strokeWidth={2.4} />
            </View>
            <Text style={styles.allReadText}>Tout lu</Text>
          </Animated.View>
        )}
      </View>

      {/* VoiceOver ne glisse pas : une action à la place du geste */}
      {screenReader && !done && (
        <PressableScale
          style={styles.a11yButton}
          onPress={() => swiped(notes[index].id)}
          accessibilityRole="button"
          accessibilityLabel="Marquer comme lue"
        >
          <LinearGradient colors={inkGradient} style={StyleSheet.absoluteFill} />
          <CheckIcon size={20} color={colors.white} strokeWidth={2.4} />
        </PressableScale>
      )}
    </View>
  );
}

// ─── Une carte qui se glisse ───────────────────────────────────────

function SwipeCard({
  note,
  depth,
  appearing,
  hint,
  onSwiped,
  children,
}: {
  note: AnnotationWithAuthor;
  /** 0 = dessus ; 1 et 2 dépassent derrière */
  depth: number;
  /** Arrivée dans la pile après l'ouverture : monte depuis le fond */
  appearing: boolean;
  /** La première carte : petit aller-retour pour montrer qu'elle se glisse */
  hint: boolean;
  onSwiped: (noteId: string) => void;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const fade = useSharedValue(1);
  const place = useSharedValue(appearing ? depth + 1 : depth);

  // Sa place dans la pile : elle avance quand celle du dessus part
  useEffect(() => {
    place.value = withTiming(depth, { duration: motion.duration.slow, easing: easeOut });
  }, [depth, place]);

  useEffect(() => {
    if (!hint || reduced) return;
    x.value = withDelay(
      650,
      withSequence(
        withTiming(-26, { duration: 330, easing: easeOut }),
        withTiming(18, { duration: 380, easing: easeOut }),
        withTiming(0, { duration: 390, easing: easeOut }),
      ),
    );
    // Une seule fois, à l'ouverture
  }, []);

  const buzz = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  const pan = Gesture.Pan()
    .enabled(depth === 0)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
    })
    .onEnd((e) => {
      const far = Math.abs(e.translationX) > SWIPE_DISTANCE;
      const fast = Math.abs(e.velocityX) > SWIPE_VELOCITY && Math.abs(e.translationX) > 30;
      if (!far && !fast) {
        x.value = withTiming(0, { duration: motion.duration.slow, easing: easeOut });
        y.value = withTiming(0, { duration: motion.duration.slow, easing: easeOut });
        return;
      }
      runOnJS(buzz)();
      const done = (finished?: boolean) => {
        'worklet';
        if (finished) runOnJS(onSwiped)(note.id);
      };
      if (reduced) {
        fade.value = withTiming(0, { duration: motion.duration.standard }, done);
        return;
      }
      const dir = Math.sign(e.translationX || e.velocityX) || 1;
      y.value = withTiming(y.value + 40, { duration: 380, easing: easeOut });
      x.value = withTiming(dir * width * 1.3, { duration: 380, easing: easeOut }, done);
    });

  const cardStyle = useAnimatedStyle(() => ({
    opacity: fade.value * interpolate(place.value, [0, 1, 2, 3], [1, 1, 0.7, 0]),
    transform: [
      { translateX: x.value },
      { translateY: y.value * 0.25 + place.value * DEPTH_STEP },
      { rotate: `${x.value * 0.05}deg` },
      { scale: 1 - place.value * DEPTH_SCALE },
    ],
  }));

  // La coche grandit avec le geste : on sait que lâcher suffit. Elle attend
  // 30 pt, pour ne pas clignoter pendant l'aller-retour d'ouverture.
  const markStyle = useAnimatedStyle(() => {
    const p = interpolate(Math.abs(x.value), [30, SWIPE_DISTANCE], [0, 1], 'clamp');
    return { opacity: p, transform: [{ scale: 0.6 + p * 0.4 }] };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.card, cardStyle]}
        pointerEvents={depth === 0 ? 'auto' : 'none'}
        importantForAccessibility={depth === 0 ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={depth !== 0}
      >
        {children}
        <Animated.View style={[styles.mark, markStyle]} pointerEvents="none">
          <LinearGradient colors={inkGradient} style={StyleSheet.absoluteFill} />
          <CheckIcon size={18} color={colors.white} strokeWidth={2.6} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/** VoiceOver est-il actif ? (il ne sait pas glisser une carte) */
function useScreenReader() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setEnabled);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => sub.remove();
  }, []);
  return enabled;
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textPrimary,
  },
  range: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  count: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  countNow: {
    color: colors.textPrimary,
  },

  deck: {
    height: CARD_HEIGHT + DEPTH_OFFSET * 2,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    shadowColor: shadowAlpha(1),
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  mark: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  allRead: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allReadText: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
  },

  a11yButton: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
