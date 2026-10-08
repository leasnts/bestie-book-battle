/**
 * NewNotesDeck — les nouvelles notes du club, en pile, une à la fois.
 *
 *    1 / 3                     p. 5–11     ← où j'en suis
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
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { CheckIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
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
import { isEmojiOnly, pageFromPosition } from '../../utils/annotations';
import {
  accentGradient,
  colors,
  fonts,
  inkGradient,
  motion,
  shadowAlpha,
  spacing,
} from '../../utils/constants';
import NoteCard, { NoteReactions } from './NoteCard';
import PeelSurface, { peelAmount, pullSpeed } from './PeelSurface';
import RoundButton from './RoundButton';
import { AccentUnits } from './AccentWord';

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
/**
 * Décollée au tiers : lâcher la fait partir. En dessous, elle se recolle — on
 * peut jouer avec le coin sans qu'elle parte. Un coup de doigt vif suffit aussi,
 * mais seulement une fois le coin un peu soulevé : pas de départ par surprise.
 */
const PEEL_OFF = 0.3;
const FLICK_MIN = 0.08;
const FLICK_VELOCITY = 500;
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
      {/* Où j'en suis */}
      <View style={styles.progress} accessibilityLabel={`Note ${shown} sur ${notes.length}`}>
        <View style={styles.progressHead}>
          <Text style={styles.count}>
            <Text style={styles.countNow}>{shown}</Text>
            <Text style={styles.countTotal}> / {notes.length}</Text>
          </Text>
          <Text style={styles.range}><AccentUnits text={range} size={styles.range.fontSize} color={styles.range.color} /></Text>
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
              compact={isEmojiOnly(note)}
              onSwiped={swiped}
            >
              <NoteCard
                large
                flat
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
              <ExpoLinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
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
        <View style={styles.a11yButton}>
          <RoundButton icon={CheckIcon} variant="dark" label="Marquer comme lue" onPress={() => swiped(top.id)} />
        </View>
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
  compact,
  onSwiped,
  children,
}: {
  note: AnnotationWithAuthor;
  /** 0 = dessus ; 1 et 2 dépassent derrière, pivotées */
  depth: number;
  /** Arrivée dans la pile après l'ouverture : elle apparaît au fond */
  appearing: boolean;
  /** La première carte : un coin se soulève et se recolle, pour montrer qu'elle se décolle */
  hint: boolean;
  /** Une note carrée (un emoji seul) : à sa taille, pas sur toute la largeur */
  compact: boolean;
  onSwiped: (noteId: string) => void;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  // Glisser la note entière (vers l'extérieur)
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const fade = useSharedValue(1);
  const place = useSharedValue(appearing ? depth + 1 : depth);

  // Décoller : le coin A tiré en B, sur une note de w × h
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const ax = useSharedValue(0);
  const ay = useSharedValue(0);
  const bx = useSharedValue(0);
  const by = useSharedValue(0);
  const peeling = useSharedValue(0);
  const amount = useSharedValue(0);
  /** Passée le cap : lâcher la décolle (une vibration l'annonce, une autre si on revient) */
  const armed = useSharedValue(0);
  /** 0 : pas encore décidé ; 1 : décoller ; 2 : glisser */
  const mode = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const values = { w, h, ax, ay, bx, by, peeling };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: lw, height: lh } = e.nativeEvent.layout;
    w.value = lw;
    h.value = lh;
    setSize((prev) => (prev && prev.w === lw && prev.h === lh ? prev : { w: lw, h: lh }));
  };

  // Sa place dans la pile : elle se redresse quand celle du dessus part
  useEffect(() => {
    place.value = withTiming(depth, { duration: motion.duration.slow, easing: easeOut });
  }, [depth, place]);

  // À l'ouverture, le coin en bas à droite se soulève un peu et se recolle
  const hinted = useRef(false);
  useEffect(() => {
    if (!hint || reduced || !size || hinted.current) return;
    hinted.current = true;
    ax.value = size.w;
    ay.value = size.h;
    bx.value = size.w;
    by.value = size.h;
    peeling.value = 1;
    const lift = { duration: 450, easing: easeOut };
    const back = { duration: 300, easing: easeOut };
    bx.value = withDelay(650, withSequence(withTiming(size.w - 46, lift), withDelay(250, withTiming(size.w, back))));
    by.value = withDelay(
      650,
      withSequence(
        withTiming(size.h - 30, lift),
        withDelay(250, withTiming(size.h, back, (f) => {
          'worklet';
          if (f) peeling.value = 0;
        })),
      ),
    );
  }, [hint, reduced, size, ax, ay, bx, by, peeling]);

  const buzz = (style: Haptics.ImpactFeedbackStyle) => Haptics.impactAsync(style).catch(() => {});

  const pan = Gesture.Pan()
    .enabled(depth === 0)
    .minDistance(6)
    .onBegin((e) => {
      startX.value = e.x;
      startY.value = e.y;
      mode.value = 0;
      armed.value = 0;
    })
    .onUpdate((e) => {
      if (mode.value === 0) {
        // Le coin le plus proche du doigt ; tiré vers l'intérieur, il se décolle
        ax.value = startX.value < w.value / 2 ? 0 : w.value;
        ay.value = startY.value < h.value / 2 ? 0 : h.value;
        const inward =
          e.translationX * (w.value / 2 - ax.value) + e.translationY * (h.value / 2 - ay.value) > 0;
        mode.value = inward && !reduced ? 1 : 2;
        if (mode.value === 1) runOnJS(buzz)(Haptics.ImpactFeedbackStyle.Light);
      }
      if (mode.value === 1) {
        bx.value = ax.value + e.translationX;
        by.value = ay.value + e.translationY;
        peeling.value = 1;
        amount.value = peelAmount(values);
        const nowArmed = amount.value >= PEEL_OFF ? 1 : 0;
        if (nowArmed !== armed.value) {
          armed.value = nowArmed;
          runOnJS(buzz)(nowArmed ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
        }
      } else {
        x.value = e.translationX;
        y.value = e.translationY;
      }
    })
    .onEnd((e) => {
      const done = (finished?: boolean) => {
        'worklet';
        if (finished) runOnJS(onSwiped)(note.id);
      };

      if (mode.value === 1) {
        if (!armed.value && amount.value >= FLICK_MIN && pullSpeed(e, values) > FLICK_VELOCITY) armed.value = 1;
        if (!armed.value) {
          // Lâchée trop tôt : le coin se recolle
          const back = { duration: motion.duration.slow, easing: easeOut };
          bx.value = withTiming(ax.value, back);
          by.value = withTiming(ay.value, back, (f) => {
            'worklet';
            if (f) peeling.value = 0;
          });
          return;
        }
        // Assez tirée : le pli traverse toute la note, puis elle s'envole, dos visible
        const dx = bx.value - ax.value;
        const dy = by.value - ay.value;
        const len = Math.hypot(dx, dy) || 1;
        const reach = 2.2 * Math.hypot(w.value, h.value);
        const sweep = { duration: 360, easing: easeOut };
        bx.value = withTiming(ax.value + (dx / len) * reach, sweep);
        by.value = withTiming(ay.value + (dy / len) * reach, sweep, (f) => {
          'worklet';
          if (!f) return;
          const dir = Math.sign(dx) || 1;
          const fly = { duration: 420, easing: easeOut };
          y.value = withTiming(-60, fly);
          fade.value = withTiming(0, fly);
          x.value = withTiming(dir * width * 1.3, fly, done);
        });
        return;
      }

      const far = Math.abs(e.translationX) > SWIPE_DISTANCE;
      const fast = Math.abs(e.velocityX) > SWIPE_VELOCITY && Math.abs(e.translationX) > 30;
      if (!far && !fast) {
        x.value = withTiming(0, { duration: motion.duration.slow, easing: easeOut });
        y.value = withTiming(0, { duration: motion.duration.slow, easing: easeOut });
        return;
      }
      runOnJS(buzz)(Haptics.ImpactFeedbackStyle.Light);
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

  // La coche grandit quand on fait glisser : on sait que lâcher suffit
  const markStyle = useAnimatedStyle(() => {
    const p = interpolate(Math.abs(x.value), [30, SWIPE_DISTANCE], [0, 1], 'clamp');
    return { opacity: p, transform: [{ scale: 0.6 + p * 0.4 }] };
  });

  return (
    <View style={styles.slot} pointerEvents="box-none">
      <GestureDetector gesture={pan}>
        <Animated.View
          // À la taille de la note : un carré ne prend pas toute la largeur
          style={[styles.card, !compact && styles.cardWide, cardStyle]}
          pointerEvents={depth === 0 ? 'auto' : 'none'}
          importantForAccessibility={depth === 0 ? 'auto' : 'no-hide-descendants'}
          accessibilityElementsHidden={depth !== 0}
        >
          <PeelSurface id={note.id} size={size} values={values} onLayout={onLayout}>
            {children}
          </PeelSurface>

          <Animated.View style={[styles.mark, markStyle]} pointerEvents="none">
            <ExpoLinearGradient colors={inkGradient} style={StyleSheet.absoluteFill} />
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

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xl,
  },

  progress: {
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

  deck: {
    height: DECK_HEIGHT,
  },
  // Chaque carte centrée dans la place de la pile, à sa taille
  slot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWide: {
    width: '100%',
  },
  card: {
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
  },
});
