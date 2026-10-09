/**
 * ProgressGauge — la progression du club en traits, pour la fiche du livre.
 *
 *    ● Toi                      34 %
 *    ▮▮▮▮▮▮▮▮▮▮▮╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷╷   ← moi : des traits verticaux, comme la
 *    ● Club                     30 %     tranche des pages ; dessous, le club, en
 *    ▪▪▪▪▪▪▪▪▪··················      plus court. Bouts contre les côtés de la tuile
 *
 * Deux rangées dans les mêmes colonnes, pour que les deux se voient toujours
 * (sur une seule rangée, le club disparaissait sous moi) : moi en rouge,
 * le club en beurre. À l'apparition, ils se remplissent (le club,
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
import { AccentUnit } from './AccentWord';

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
/** Deux rangées, dans les mêmes colonnes : moi (plus longue) au-dessus du club */
const ME_LENGTH = 12;
const CLUB_LENGTH = 8;

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
      {/* Toi puis le club : chacun son libellé et son pourcentage, sa rangée de traits dessous */}
      <View style={styles.rows}>
        <GaugeRow
          id="gaugeMe"
          label="Toi"
          value={me}
          gradient={accentGradient}
          length={ME_LENGTH}
          width={width}
          bars={bars}
          fill={meFill}
          legendInset={legendInset}
        />
        <GaugeRow
          id="gaugeClub"
          label="Club"
          value={club}
          gradient={CLUB_GRADIENT}
          length={CLUB_LENGTH}
          width={width}
          bars={bars}
          fill={clubFill}
          legendInset={legendInset}
        />
      </View>
    </View>
  );
}

/** Une rangée : « ● Toi … 34 % », puis ses traits qui se remplissent dessous */
function GaugeRow({
  id,
  label,
  value,
  gradient,
  length,
  width,
  bars,
  fill,
  legendInset,
}: {
  id: string;
  label: string;
  value: SharedValue<number>;
  gradient: readonly [string, string];
  length: number;
  width: number;
  bars: number[];
  fill: Partial<{ width: number }>;
  legendInset: number;
}) {
  return (
    <View style={styles.row}>
      <View style={{ paddingHorizontal: legendInset }}>
        <Legend label={label} value={value} dot={gradient[1]} />
      </View>
      {width > 0 && (
        <Svg width={width} height={length}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="1" stopColor={gradient[1]} />
            </LinearGradient>
            {/* Seuls les traits laissent voir le remplissage qui passe dessous */}
            <Mask id={`${id}Bars`} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={length}>
              {bars.map((x, i) => (
                <Rect key={i} x={x} y={0} width={BAR_WIDTH} height={length} rx={BAR_WIDTH / 2} fill="#fff" />
              ))}
            </Mask>
          </Defs>
          <G mask={`url(#${id}Bars)`}>
            <Rect width={width} height={length} fill={inkAlpha(0.12)} />
            <AnimatedRect height={length} fill={`url(#${id})`} animatedProps={fill} />
          </G>
        </Svg>
      )}
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
      <Text style={[styles.legendLabel, styles.legendLabelGrow]}>{label}</Text>
      <Text style={styles.legendValue}>{shown} <AccentUnit size={styles.legendValue.fontSize} color={styles.legendValue.color}>%</AccentUnit></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  /** Toi, puis le club dessous : côte à côte, ils se collaient dans la tuile */
  /** Calées en bas de la tuile, comme les chiffres des autres tuiles : de l'air sous le titre */
  rows: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  row: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  legendLabelGrow: {
    flex: 1,
  },
  legendValue: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
