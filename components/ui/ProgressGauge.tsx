/**
 * ProgressGauge — la progression du club en arche de pages, pour la fiche du livre.
 *
 *         ╷╷╷╷╷╷╷╷╷╷╷
 *      ╷╷╷           ╷╷╷      ← des traits verticaux, comme la tranche des pages,
 *    ▮▮    ● Toi 34 %    ╷╷      posés le long d'une arche aplatie ; ceux des
 *    ▮     ● Club 30 %    ╷      bouts touchent les côtés de la tuile
 *
 * Les traits se colorent de gauche à droite : le club derrière (lie de vin
 * clair), moi devant (lie de vin). À l'apparition, ils se remplissent (le club,
 * puis moi, décalé) et les pourcentages comptent jusqu'à leur valeur, sur la
 * même courbe. Avec « Réduire les animations », tout est posé d'emblée.
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
import Svg, { Defs, G, LinearGradient, Mask, Rect, Stop } from 'react-native-svg';
import { accentGradient, colors, fonts, inkAlpha, motion, spacing } from '../../utils/constants';
import { CLUB_GRADIENT } from './GoalTrack';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface ProgressGaugeProps {
  /** Médiane du club, 0 à 100 */
  clubPercent: number;
  /** Ma progression, 0 à 100 */
  myPercent: number;
  style?: StyleProp<ViewStyle>;
}

/** Nombre de traits, de bord à bord */
const BAR_COUNT = 34;
const BAR_WIDTH = 2.5;
/** Longueur d'un trait, centré sur la courbe */
const BAR_LENGTH = 12;
/** Hauteur de l'arche par rapport à sa demi-largeur : plus c'est petit, plus c'est plat */
const FLATNESS = 0.75;

/**
 * Les traits, à la taille réelle de la place qu'on leur donne : le premier
 * contre le bord gauche, le dernier contre le bord droit, régulièrement espacés,
 * chacun centré sur l'arche.
 */
function geometry(width: number, height: number) {
  const step = (width - BAR_WIDTH) / (BAR_COUNT - 1);
  const rx = (width - BAR_WIDTH) / 2;
  const centerX = width / 2;
  const baseY = height - BAR_LENGTH / 2;
  // Aplati, sans jamais dépasser la hauteur donnée
  const ry = Math.max(1, Math.min(baseY - BAR_LENGTH / 2, rx * FLATNESS));
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const x = i * step;
    const dx = (x + BAR_WIDTH / 2 - centerX) / rx;
    // Une parabole plutôt qu'un ovale : un ovale est vertical à ses bouts, et
    // les derniers traits y tombaient d'un coup
    const y = baseY - ry * (1 - dx * dx);
    return { x, y: y - BAR_LENGTH / 2 };
  });
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
  const width = size?.width ?? 0;
  const bars = size ? geometry(size.width, size.height) : [];

  // Les remplissages avancent de gauche à droite sous les traits
  const clubFill = useAnimatedProps(() => ({ width: (width * club.value) / 100 }));
  const meFill = useAnimatedProps(() => ({ width: (width * me.value) / 100 }));

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
            {/* Seuls les traits laissent voir les remplissages qui passent dessous */}
            <Mask
              id="gaugeBars"
              maskUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={size.width}
              height={size.height}
            >
              {bars.map((bar, i) => (
                <Rect
                  key={i}
                  x={bar.x}
                  y={bar.y}
                  width={BAR_WIDTH}
                  height={BAR_LENGTH}
                  rx={BAR_WIDTH / 2}
                  fill="#fff"
                />
              ))}
            </Mask>
          </Defs>
          <G mask="url(#gaugeBars)">
            <Rect width={size.width} height={size.height} fill={inkAlpha(0.12)} />
            <AnimatedRect height={size.height} fill="url(#gaugeClub)" animatedProps={clubFill} />
            <AnimatedRect height={size.height} fill="url(#gaugeMe)" animatedProps={meFill} />
          </G>
        </Svg>
      )}

      {/* Sous l'arche, l'un sous l'autre */}
      <View style={styles.legend}>
        <View style={styles.legendColumn}>
          <Legend label="Toi" value={me} dot={accentGradient[0]} />
          <Legend label="Club" value={club} dot={CLUB_GRADIENT[1]} />
        </View>
      </View>
    </View>
  );
}

/** Un pourcentage qui compte en même temps que ses traits */
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
