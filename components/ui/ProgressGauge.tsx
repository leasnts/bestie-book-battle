/**
 * ProgressGauge — la progression du club en demi-cercle, pour la fiche du livre.
 *
 *          ╭┊┊┊┊┊┊┊╮
 *        ┊▮▮▮▮┊┊┊┊┊┊┊       ← un cadran gradué, comme la tranche des pages :
 *       ┊   ● Toi 34 %  ┊      les graduations se colorent, le club derrière
 *       ┊   ● Club 30 % ┊      (lie de vin clair), moi devant (lie de vin)
 *
 * À l'apparition, les graduations se remplissent (le club, puis moi, décalé)
 * et les pourcentages comptent jusqu'à leur valeur, sur la même courbe. Avec « Réduire les animations », tout est posé d'emblée.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
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
import Svg, { Defs, G, LinearGradient, Mask, Path, Stop } from 'react-native-svg';
import { accentGradient, colors, fonts, inkAlpha, motion, spacing } from '../../utils/constants';
import { CLUB_GRADIENT } from './GoalTrack';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ProgressGaugeProps {
  /** Médiane du club, 0 à 100 */
  clubPercent: number;
  /** Ma progression, 0 à 100 */
  myPercent: number;
  style?: StyleProp<ViewStyle>;
}

const STROKE = 12;
/** Une marge d'un point tout autour : aucun trait ne touche le bord du dessin */
const PAD = 1;
/**
 * Les graduations : un trait plein, un vide, le long de l'arc. L'écart est
 * calculé pour qu'un nombre entier de traits tombe pile de bout en bout : un
 * trait plein à chaque extrémité, jamais un demi-trait coupé.
 */
const TICK_COUNT = 36;
/** Part du trait dans une graduation (le reste est le vide) */
const TICK_RATIO = 0.45;
/** Hauteur du demi-ovale par rapport à sa demi-largeur : plus c'est petit, plus c'est plat */
const FLATNESS = 0.7;

/**
 * Le demi-ovale, dessiné à la taille réelle de la place qu'on lui donne : il
 * touche les deux côtés, aplati, posé en bas de la place donnée.
 */
function geometry(width: number, height: number) {
  const rx = (width - STROKE) / 2 - PAD;
  const centerY = height - PAD;
  // Aplati : la courbe s'étale en largeur, sans jamais dépasser la hauteur donnée
  const ry = Math.max(1, Math.min(centerY - STROKE / 2 - PAD, rx * FLATNESS));
  // Longueur du demi-ovale (approximation de Ramanujan, précise à 1e-5 près)
  const length = (Math.PI / 2) * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const period = length / (TICK_COUNT - 1 + TICK_RATIO);
  return {
    // De gauche à droite, en passant par le haut
    arc: `M ${PAD + STROKE / 2} ${centerY} A ${rx} ${ry} 0 0 1 ${width - PAD - STROKE / 2} ${centerY}`,
    length,
    ticks: `${period * TICK_RATIO} ${period * (1 - TICK_RATIO)}`,
  };
}

const DURATION = 1100;
/** Je pars un peu après le club : on voit les deux arcs se chercher */
const ME_DELAY = 180;
const EASING = Easing.bezier(...motion.easing.easeOutQuart);

const clamp = (p: number) => Math.max(0, Math.min(100, p));

export default function ProgressGauge({ clubPercent, myPercent, style }: ProgressGaugeProps) {
  const reducedMotion = useReducedMotion();
  const club = useSharedValue(reducedMotion ? clamp(clubPercent) : 0);
  const me = useSharedValue(reducedMotion ? clamp(myPercent) : 0);

  useEffect(() => {
    const timing = { duration: reducedMotion ? 0 : DURATION, easing: EASING };
    club.value = withTiming(clamp(clubPercent), timing);
    me.value = withDelay(reducedMotion ? 0 : ME_DELAY, withTiming(clamp(myPercent), timing));
  }, [clubPercent, myPercent, reducedMotion, club, me]);

  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const { arc, length, ticks } = geometry(size?.width ?? 120, size?.height ?? 60);

  const clubArc = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - club.value / 100),
  }));
  const meArc = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - me.value / 100),
  }));

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ width, height });
      }}
      accessible
      accessibilityLabel={`La moitié du club est à ${Math.round(clubPercent)} %, toi à ${Math.round(myPercent)} %`}
    >
      {size && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="gaugeMe" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accentGradient[0]} />
              <Stop offset="1" stopColor={accentGradient[1]} />
            </LinearGradient>
            <LinearGradient id="gaugeClub" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={CLUB_GRADIENT[0]} />
              <Stop offset="1" stopColor={CLUB_GRADIENT[1]} />
            </LinearGradient>
            {/* Seules les graduations laissent voir ce qu'il y a dessous */}
            {/*
            Zone du masque = tout le dessin. Par défaut, elle suit le tracé
            sans son épaisseur, et rognait le haut des graduations.
          */}
            <Mask
              id="gaugeTicks"
              maskUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={size.width}
              height={size.height}
            >
              <Path
                d={arc}
                stroke="#fff"
                strokeWidth={STROKE}
                strokeDasharray={ticks}
                fill="none"
              />
            </Mask>
          </Defs>
          <G mask="url(#gaugeTicks)">
            <Path d={arc} stroke={inkAlpha(0.12)} strokeWidth={STROKE} fill="none" />
            <AnimatedPath
              d={arc}
              stroke="url(#gaugeClub)"
              strokeWidth={STROKE}
              strokeDasharray={`${length} ${length}`}
              fill="none"
              animatedProps={clubArc}
            />
            <AnimatedPath
              d={arc}
              stroke="url(#gaugeMe)"
              strokeWidth={STROKE}
              strokeDasharray={`${length} ${length}`}
              fill="none"
              animatedProps={meArc}
            />
          </G>
        </Svg>
      )}

      {/* Dans le creux du demi-ovale, l'un sous l'autre */}
      <View style={styles.legend}>
        <View style={styles.legendColumn}>
          <Legend label="Toi" value={me} dot={accentGradient[0]} />
          <Legend label="Club" value={club} dot={CLUB_GRADIENT[1]} />
        </View>
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
    marginTop: spacing.sm,
  },
  legend: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  /** Les points l'un sous l'autre, le bloc centré dans le creux */
  legendColumn: {
    alignItems: 'flex-start',
    gap: 2,
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
    // « Toi » et « Club » font la même largeur : les pourcentages s'alignent
    minWidth: 32,
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
