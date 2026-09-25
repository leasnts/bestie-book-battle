/**
 * ProgressGauge — la progression du club en demi-cercle, pour la fiche du livre.
 *
 *          ╭───────╮
 *        ╱  ░░░▓▓▓  ╲        ← deux arcs, comme la piste de l'accueil :
 *       │            │         le club derrière (lie de vin clair),
 *                              moi devant (lie de vin)
 *      ● Club 30 %  ● Toi 34 %
 *
 * À l'apparition, les arcs se dessinent (le club, puis moi, décalé) et les
 * pourcentages comptent jusqu'à leur valeur, sur la même courbe. Avec « Réduire
 * les animations », tout est posé d'emblée.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { accentGradient, colors, fonts, motion, spacing } from '../../utils/constants';
import { CLUB_GRADIENT, RAIL_COLOR } from './GoalTrack';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ProgressGaugeProps {
  /** Médiane du club, 0 à 100 */
  clubPercent: number;
  /** Ma progression, 0 à 100 */
  myPercent: number;
}

/** Largeur du dessin ; il s'étire à la largeur de la tuile (viewBox) */
const WIDTH = 120;
const STROKE = 11;
const RADIUS = (WIDTH - STROKE) / 2;
/** Centre du cercle, une demi-épaisseur au-dessus du bas : les bouts ronds tiennent */
const CENTER_Y = RADIUS + STROKE / 2;
const HEIGHT = CENTER_Y + STROKE / 2;
/** Longueur du demi-cercle */
const ARC_LENGTH = Math.PI * RADIUS;
/** Le demi-cercle, de gauche à droite en passant par le haut */
const ARC = `M ${STROKE / 2} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${WIDTH - STROKE / 2} ${CENTER_Y}`;

const DURATION = 1100;
/** Je pars un peu après le club : on voit les deux arcs se chercher */
const ME_DELAY = 180;
const EASING = Easing.bezier(...motion.easing.easeOutQuart);

const clamp = (p: number) => Math.max(0, Math.min(100, p));

export default function ProgressGauge({ clubPercent, myPercent }: ProgressGaugeProps) {
  const reducedMotion = useReducedMotion();
  const club = useSharedValue(reducedMotion ? clamp(clubPercent) : 0);
  const me = useSharedValue(reducedMotion ? clamp(myPercent) : 0);

  useEffect(() => {
    const timing = { duration: reducedMotion ? 0 : DURATION, easing: EASING };
    club.value = withTiming(clamp(clubPercent), timing);
    me.value = withDelay(reducedMotion ? 0 : ME_DELAY, withTiming(clamp(myPercent), timing));
  }, [clubPercent, myPercent, reducedMotion, club, me]);

  const clubArc = useAnimatedProps(() => ({
    strokeDashoffset: ARC_LENGTH * (1 - club.value / 100),
  }));
  const meArc = useAnimatedProps(() => ({
    strokeDashoffset: ARC_LENGTH * (1 - me.value / 100),
  }));

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`La moitié du club est à ${Math.round(clubPercent)} %, toi à ${Math.round(myPercent)} %`}
    >
      <Svg width="100%" height={undefined} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={styles.svg}>
        <Defs>
          <LinearGradient id="gaugeMe" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={accentGradient[0]} />
            <Stop offset="1" stopColor={accentGradient[1]} />
          </LinearGradient>
          <LinearGradient id="gaugeClub" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CLUB_GRADIENT[0]} />
            <Stop offset="1" stopColor={CLUB_GRADIENT[1]} />
          </LinearGradient>
        </Defs>
        <Path d={ARC} stroke={RAIL_COLOR} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
        <AnimatedPath
          d={ARC}
          stroke="url(#gaugeClub)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
          fill="none"
          animatedProps={clubArc}
        />
        <AnimatedPath
          d={ARC}
          stroke="url(#gaugeMe)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
          fill="none"
          animatedProps={meArc}
        />
      </Svg>

      <View style={styles.legend}>
        <Legend label="Club" value={club} dot={CLUB_GRADIENT[1]} />
        <Legend label="Toi" value={me} dot={accentGradient[0]} />
      </View>
    </View>
  );
}

/** Un pourcentage qui compte en même temps que son arc */
function Legend({ label, value, dot }: { label: string; value: SharedValue<number>; dot: string }) {
  const [shown, setShown] = useState(() => Math.round(value.value));
  useAnimatedReaction(
    () => Math.round(value.value),
    (next, prev) => {
      if (next !== prev) runOnJS(setShown)(next);
    },
  );
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{shown} %</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  svg: {
    aspectRatio: WIDTH / HEIGHT,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  legendValue: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
