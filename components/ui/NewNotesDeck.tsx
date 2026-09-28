/**
 * NewNotesDeck — les nouvelles notes du club, en pile, une à la fois.
 *
 *    1 / 3                     p. 5–11
 *    ▰▰▰▱▱▱▱▱▱                             ← un segment par note, rempli en lie de vin
 *
 *        ╱▔▔▔▔▔▔▔▔▔▔▔▔▔╲
 *       │ Emma   p. 5   │                  ← la note, à sa taille, les suivantes
 *       │ Le narrateur… │                    dessous, un peu pivotées
 *        ╲____________◢╱
 *
 *     (😭) (🫶) (😂) (🔥) (😱) (👀) (…)    ← les réactions, sous la pile
 *
 * Le carnet s'ouvre sur elles quand il y en a (page entière, depuis l'accueil) :
 * on lit d'abord ce qui est nouveau, seul, puis le carnet entier apparaît.
 *
 * - **Glisser à gauche ou à droite = lue.** Les deux sens font la même chose :
 *   on passe à la suivante, sans choix à faire. Une coche apparaît pendant le
 *   geste, la carte s'envole en tournant un peu, la suivante se redresse.
 * - Chaque carte a la taille de sa note : un emoji seul est un petit autocollant.
 *   Les suivantes dépassent derrière, pivotées, comme des autocollants posés
 *   en tas — elles se voient quelle que soit leur taille.
 * - Les réactions de la note du dessus sont sous la pile, les six rapides
 *   toujours là : réagir se fait d'un toucher, avant de glisser.
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
  FadeOut,
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
  inkAlpha,
  inkGradient,
  motion,
  shadowAlpha,
  spacing,
} from '../../utils/constants';
import NoteCard, { NoteReactions } from './NoteCard';
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

/** La place de la pile : de quoi poser une note de six lignes */
const DECK_HEIGHT = 320;
/** Les cartes de dessous : pivotées dans un sens puis dans l'autre */
const TILTS = [0, -4, 3.5, 0];
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
  /** Les cartes du premier affichage sont déjà en place ; les suivantes arrivent */
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

  const pile = notes.slice(index, index + 3);
  const top = pile[0];
  const shown = Math.min(index + 1, notes.length);

  return (
    <View style={styles.wrap}>
      {/* Où j'en suis : le chiffre, et un segment par note */}
      <View style={styles.progress} accessibilityLabel={`Note ${shown} sur ${notes.length}`}>
        <View style={styles.progressHead}>
          <Text style={styles.count}>
            <Text style={styles.countNow}>{shown}</Text>
            <Text style={styles.countTotal}> / {notes.length}</Text>
          </Text>
          <Text style={styles.range}>{range}</Text>
        </View>
        <View style={styles.segments}>
          {notes.map((note, i) => (
            <Segment key={note.id} filled={i <= index} current={i === index} />
          ))}
        </View>
      </View>

      <View style={styles.deck}>
        {/* La carte du dessus en dernier : elle se dessine par-dessus les autres */}
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
                hideReactions
                note={note}
                myTotalPages={myTotalPages}
                isMine={false}
                myUserId={myUserId}
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

      {/* Les réactions de la note du dessus, hors de la note */}
      <View style={styles.reactions}>
        {top && top.visibility === 'club' && (
          <Animated.View
            key={top.id}
            entering={FadeIn.duration(motion.duration.standard)}
            exiting={FadeOut.duration(motion.duration.instant)}
          >
            <NoteReactions
              quick
              note={top}
              myUserId={myUserId}
              onToggle={(emoji) => onToggleReaction(top, emoji)}
              onMore={() => onMoreReactions(top.id)}
            />
          </Animated.View>
        )}
      </View>

      {/* VoiceOver ne glisse pas : une action à la place du geste */}
      {screenReader && top && (
        <PressableScale
          style={styles.a11yButton}
          onPress={() => swiped(top.id)}
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

/** Un segment de la progression : lie de vin une fois atteint */
function Segment({ filled, current }: { filled: boolean; current: boolean }) {
  const fill = useSharedValue(filled ? 1 : 0);
  useEffect(() => {
    fill.value = withTiming(filled ? 1 : 0, { duration: motion.duration.slow, easing: easeOut });
  }, [filled, fill]);
  // Il se remplit de gauche à droite (scaleX, jamais width)
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.value }] }));
  return (
    <View style={[styles.segment, current && styles.segmentCurrent]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.segmentFill, style]}>
        <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
      </Animated.View>
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
  /** 0 = dessus ; 1 et 2 dépassent derrière, pivotées */
  depth: number;
  /** Arrivée dans la pile après l'ouverture : elle apparaît au fond */
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

  // Sa place dans la pile : elle se redresse quand celle du dessus part
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
  }, [hint, reduced, x]);

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
    opacity: fade.value * interpolate(place.value, [0, 2, 3], [1, 1, 0]),
    transform: [
      { translateX: x.value },
      { translateY: y.value * 0.25 },
      { rotate: `${x.value * 0.05 + interpolate(place.value, [0, 1, 2, 3], TILTS)}deg` },
      { scale: interpolate(place.value, [0, 1, 3], [1, 0.97, 0.94]) },
    ],
  }));

  // La coche grandit avec le geste : on sait que lâcher suffit. Elle attend
  // 30 pt, pour ne pas clignoter pendant l'aller-retour d'ouverture.
  const markStyle = useAnimatedStyle(() => {
    const p = interpolate(Math.abs(x.value), [30, SWIPE_DISTANCE], [0, 1], 'clamp');
    return { opacity: p, transform: [{ scale: 0.6 + p * 0.4 }] };
  });

  return (
    <View style={styles.slot} pointerEvents="box-none">
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
    </View>
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

const SEGMENT_HEIGHT = 6;

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xl,
  },

  progress: {
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  count: {
    fontVariant: ['tabular-nums'],
  },
  countNow: {
    fontFamily: fonts.displayHero,
    fontSize: 56,
    color: colors.textPrimary,
  },
  countTotal: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textTertiary,
  },
  range: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  segments: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: SEGMENT_HEIGHT,
    borderRadius: SEGMENT_HEIGHT / 2,
    overflow: 'hidden',
    backgroundColor: inkAlpha(0.1),
  },
  segmentCurrent: {
    backgroundColor: inkAlpha(0.16),
  },
  segmentFill: {
    transformOrigin: 'left',
  },

  deck: {
    height: DECK_HEIGHT,
  },
  // Chaque carte centrée dans la place de la pile, à sa taille
  slot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    shadowColor: shadowAlpha(1),
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  mark: {
    position: 'absolute',
    top: -spacing.md,
    right: -spacing.sm,
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

  // Place fixe : la pile ne saute pas quand une note n'a pas de réactions
  reactions: {
    minHeight: 44,
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
