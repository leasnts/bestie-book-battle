/**
 * Route /streak-goal — viser un palier de série (#236), à la Duolingo.
 *
 * Deux moments, le même sheet :
 * - ma série est finie (trop de jours manqués pour les marque-pages) : la
 *   flamme éteinte et son ancien total, en sable. S'ouvre seul une fois par
 *   série finie.
 * - `?reached=7` : le palier est atteint, la flamme brûle. S'ouvre seul une
 *   fois par palier.
 *
 *            🔥                  toucher un palier : la flamme se rallume
 *            17                  et le grand chiffre devient le palier,
 *          jours                 « jours à tenir »
 *   ┌──────────────────────────┐
 *   │ 3 jours       tranquille │  cartes de papier cousues ; choisie : le
 *   └──────────────────────────┘  ruban rouge léger de la série, fil rouge
 *   [ Relancer ma série ]
 *   [ Plus tard ]
 *
 * Rien de pré-choisi : le bouton s'allume quand un palier est touché. « Plus
 * tard » retire le palier : la gélule redevient un simple nombre.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Button3D from '../components/Button3D';
import PressableScale from '../components/ui/PressableScale';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { StitchBorder } from '../components/ui/Stitch';
import { STREAK_FLAME } from '../components/ui/StreakPill';
import { useMyStreak } from '../hooks/useMyStreak';
import { setStreakGoal } from '../services/supabase/database';
import { useProgressStore } from '../stores/progressStore';
import { borderRadius, colors, fonts, lowki, paperFrameGradient, spacing } from '../utils/constants';
import { buzz } from '../utils/feel';
import { oops } from '../utils/notice';
import { nextStreakGoals } from '../utils/streak';

/** Le petit mot de chaque palier, à droite de sa carte */
const GOAL_WORDS: Record<number, string> = {
  3: 'tranquille',
  7: 'bon rythme',
  14: 'gros mental',
  30: 'légendaire',
  60: 'inarrêtable',
  100: 'mythique',
  200: 'hors norme',
  365: 'une année',
};

/** Le ruban de la série (StreakDays), pour la carte choisie */
const PICKED = [`${lowki.red.light}24`, `${lowki.red.dark}24`] as const;

/** La flamme derrière le chiffre : toute la hauteur du héros */
const FLAME = 180;
const CARD_RADIUS = borderRadius.xl;
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN_OUT = Easing.inOut(Easing.sin);
/** Le temps que le sheet finisse de monter, avant que la flamme pousse */
const SHEET_RISE = 380;

export default function StreakGoalRoute() {
  const router = useRouter();
  const { reached: reachedParam } = useLocalSearchParams<{ reached?: string }>();
  const reached = Number(reachedParam) || 0;
  const { userId, challengeId, days, lastDays } = useMyStreak();
  const loadChallengeProgress = useProgressStore((s) => s.loadChallengeProgress);
  const [picked, setPicked] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const goals = nextStreakGoals(reached);

  const save = useCallback(
    async (goal: number | null) => {
      if (!userId || !challengeId || saving) return;
      setSaving(true);
      try {
        await setStreakGoal(challengeId, userId, goal);
        if (goal) buzz('success');
        await loadChallengeProgress(challengeId);
        router.back();
      } catch (error) {
        oops('Palier pas enregistré', error, { retry: () => save(goal) });
      } finally {
        setSaving(false);
      }
    },
    [userId, challengeId, saving, loadChallengeProgress, router],
  );

  const pick = (goal: number) => {
    if (goal === picked) return;
    buzz('selection');
    setPicked(goal);
  };

  return (
    <SheetPage
      title={reached ? 'Palier atteint' : 'Ma série est finie'}
      accent={reached ? 'atteint' : 'finie'}
    >
      <GoalHero
        number={picked ?? (reached ? days : lastDays)}
        lit={!!reached || !!picked}
        caption={picked ? 'jours à tenir' : undefined}
      />

      <View style={styles.cards}>
        {goals.map((goal) => (
          <GoalCard key={goal} goal={goal} selected={picked === goal} onPress={() => pick(goal)} />
        ))}
      </View>

      <SheetFooter>
        <Button3D
          onPress={() => picked && save(picked)}
          variant="primary"
          disabled={!picked}
          loading={saving && !!picked}
        >
          {reached ? 'Viser plus loin' : 'Relancer ma série'}
        </Button3D>
        <Button3D onPress={() => save(null)} variant="secondary" disabled={saving}>
          Plus tard
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}

/**
 * Le grand chiffre, au centre, la flamme derrière lui : grande, couchée en
 * perspective, légèrement floutée et pâlie, comme le « p. » derrière Ma page.
 * Elle grossit en arrivant, et encore un peu à chaque palier touché ; éteinte,
 * tout est en sable. Rien de tout ça avec « Réduire les animations ».
 */
function GoalHero({ number, lit, caption }: { number: number; lit: boolean; caption?: string }) {
  const reducedMotion = useReducedMotion();
  const grow = useSharedValue(reducedMotion ? 1 : 0.3);
  const first = useRef(true);

  useEffect(() => {
    if (reducedMotion) return;
    // Elle part petite et pousse franchement jusqu'à sa taille, puis respire
    // doucement. À l'ouverture, elle attend que le sheet soit monté (sinon
    // elle a fini de pousser avant qu'on la voie) ; à chaque palier touché,
    // elle repart de la moitié.
    const wait = first.current ? SHEET_RISE : 0;
    first.current = false;
    grow.value = withSequence(
      withTiming(Math.min(grow.value, 0.5), { duration: 0 }),
      withDelay(wait, withTiming(1, { duration: 1100, easing: EASE_OUT })),
      withRepeat(withTiming(1.06, { duration: 1600, easing: EASE_IN_OUT }), -1, true),
    );
  }, [number, lit, reducedMotion, grow]);

  // Décalée en bas à gauche du chiffre, comme le « p. » de Ma page
  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -FLAME * 0.22 },
      { translateY: FLAME * 0.08 },
      { perspective: 500 },
      { rotateX: '28deg' },
      { scale: grow.value },
    ],
  }));

  return (
    <View style={styles.hero} accessible accessibilityLabel={`${number} ${caption ?? 'jours'}`}>
      <Animated.View style={[styles.flameBehind, flameStyle]} pointerEvents="none">
        <Image
          source={STREAK_FLAME}
          style={[styles.flame, !lit && styles.flameOff]}
          tintColor={lit ? undefined : lowki.beige.light}
          blurRadius={3}
        />
      </Animated.View>
      <Animated.Text
        key={number}
        entering={reducedMotion ? undefined : FadeInDown.duration(240).easing(EASE_OUT)}
        style={[styles.number, !lit && styles.numberOff]}
      >
        {number}
      </Animated.Text>
      <Text style={[styles.caption, lit && styles.captionLit]}>
        {caption ?? (number > 1 ? 'jours' : 'jour')}
      </Text>
    </View>
  );
}

/** Un palier : une carte de papier cousue, « 7 jours » et son petit mot */
function GoalCard({ goal, selected, onPress }: { goal: number; selected: boolean; onPress: () => void }) {
  return (
    <PressableScale
      style={styles.card}
      pressedScale={0.98}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${goal} jours, ${GOAL_WORDS[goal] ?? ''}`}
    >
      <LinearGradient
        colors={selected ? PICKED : paperFrameGradient}
        style={[StyleSheet.absoluteFill, styles.cardFill]}
      />
      <StitchBorder radius={CARD_RADIUS} color={selected ? lowki.red.light : undefined} />
      <Text style={[styles.cardLabel, selected && styles.cardLabelPicked]}>{goal} jours</Text>
      {GOAL_WORDS[goal] && (
        <Text style={[styles.cardWord, selected && styles.cardWordPicked]}>{GOAL_WORDS[goal]}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    height: FLAME,
    marginBottom: spacing.md,
  },
  // La flamme, derrière tout le héros, posée un peu plus bas que le centre
  flameBehind: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flame: {
    width: FLAME,
    height: FLAME,
    opacity: 0.35,
  },
  flameOff: {
    opacity: 0.45,
  },
  number: {
    fontFamily: fonts.display,
    fontSize: 72,
    lineHeight: 80,
    color: lowki.red.light,
    fontVariant: ['tabular-nums'],
  },
  // Éteinte : beige foncé, ≥ 3:1 sur le papier à cette taille
  numberOff: {
    color: lowki.beige.dark,
  },
  caption: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.textTertiary,
  },
  captionLit: {
    color: lowki.red.light,
  },
  cards: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    borderRadius: CARD_RADIUS,
  },
  cardFill: {
    borderRadius: CARD_RADIUS,
  },
  cardLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  cardLabelPicked: {
    color: lowki.red.light,
  },
  cardWord: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textTertiary,
  },
  cardWordPicked: {
    color: lowki.red.light,
  },
});
