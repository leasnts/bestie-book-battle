/**
 * ProgressGauge — la progression du club en traits, pour la fiche du livre.
 *
 *    ▮▮▮▮▮▮▮▮▮▮▮╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷   ← moi : des traits verticaux, comme la
 *    ▪▪▪▪▪▪▪▪▪··················      tranche des pages ; dessous, le club, en
 *      ● Toi 34 %       ● Club 30 %      plus court. Bouts contre les côtés de la tuile
 *
 * Deux rangées dans les mêmes colonnes, pour que les deux se voient toujours
 * (sur une seule rangée, le club disparaissait sous moi) : moi en lie de vin,
 * le club en lie de vin clair. À l'apparition, ils se remplissent (le club,
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
import { accentGradient, colors, fonts, inkAlpha, motion } from '../../utils/constants';
import { CLUB_GRADIENT } from './GoalTrack';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface ProgressGaugeProps {
  /** Médiane du club, 0 à 100 */
  clubPercent: number;
  /** Ma progression, 0 à 100 */
  myPercent: number;
  /**
   * Retrait de la légende depuis le bord : quand la jauge déborde de la marge
   * de sa tuile, la légende, elle, reste alignée sur le titre
   */
  legendInset?: number;
  style?: StyleProp<ViewStyle>;
}

/** Nombre de traits, de bord à bord */
const BAR_COUNT = 30;
const BAR_WIDTH = 3.5;
/** Deux rangées, dans les mêmes colonnes : moi (longue) au-dessus du club */
const ME_LENGTH = 18;
const CLUB_LENGTH = 9;
const ROW_GAP = 4;
const CLUB_Y = ME_LENGTH + ROW_GAP;
const HEIGHT = CLUB_Y + CLUB_LENGTH;

/** Les traits, du bord gauche au bord droit, régulièrement espacés */
function barsFor(width: number) {
  const step = (width - BAR_WIDTH) / (BAR_COUNT - 1);
  return Array.from({ length: BAR_COUNT }, (_, i) => i * step);
}

const DURATION = 1100;
/** Je pars un peu après le club : on voit les deux arcs se chercher */
const ME_DELAY = 180;
const EASING = Easing.bezier(...motion.easing.easeOutQuart);

const clamp = (p: number) => Math.max(0, Math.min(100, p));

export default function ProgressGauge({
  clubPercent,
  myPercent,
  legendInset = 0,
  style,
}: ProgressGaugeProps) {
  const reducedMotion = useReducedMotion();
  const club = useSharedValue(reducedMotion ? clamp(clubPercent) : 0);
  const me = useSharedValue(reducedMotion ? clamp(myPercent) : 0);

  useEffect(() => {
    const timing = { duration: reducedMotion ? 0 : DURATION, easing: EASING };
    club.value = withTiming(clamp(clubPercent), timing);
    me.value = withDelay(reducedMotion ? 0 : ME_DELAY, withTiming(clamp(myPercent), timing));
  }, [clubPercent, myPercent, reducedMotion, club, me]);

  const [size, setSize] = useState<{ width: number } | null>(null);
  const width = size?.width ?? 0;
  const bars = size ? barsFor(size.width) : [];

  // Les remplissages avancent de gauche à droite sous les traits
  const clubFill = useAnimatedProps(() => ({ width: (width * club.value) / 100 }));
  const meFill = useAnimatedProps(() => ({ width: (width * me.value) / 100 }));

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout;
        setSize({ width });
      }}
      accessible
      accessibilityLabel={`La moitié du club est à ${Math.round(clubPercent)} %, toi à ${Math.round(myPercent)} %`}
    >
      {/* Les traits, centrés dans la place entre le titre et la légende */}
      <View style={styles.barsArea}>
        {size && (
          <Svg width={size.width} height={HEIGHT}>
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
                height={HEIGHT}
              >
                {bars.map((x, i) => (
                  <G key={i}>
                    <Rect
                      x={x}
                      y={0}
                      width={BAR_WIDTH}
                      height={ME_LENGTH}
                      rx={BAR_WIDTH / 2}
                      fill="#fff"
                    />
                    <Rect
                      x={x}
                      y={CLUB_Y}
                      width={BAR_WIDTH}
                      height={CLUB_LENGTH}
                      rx={BAR_WIDTH / 2}
                      fill="#fff"
                    />
                  </G>
                ))}
              </Mask>
            </Defs>
            <G mask="url(#gaugeBars)">
              <Rect width={size.width} height={HEIGHT} fill={inkAlpha(0.12)} />
              <AnimatedRect
                y={CLUB_Y}
                height={CLUB_LENGTH}
                fill="url(#gaugeClub)"
                animatedProps={clubFill}
              />
              <AnimatedRect height={ME_LENGTH} fill="url(#gaugeMe)" animatedProps={meFill} />
            </G>
          </Svg>
        )}
      </View>

      {/* Sous les traits, côte à côte */}
      <View style={{ paddingHorizontal: legendInset }}>
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
  },
  barsArea: {
    flex: 1,
    justifyContent: 'center',
  },
  /** Toi à gauche, le club à droite */
  legendColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
