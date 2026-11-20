/**
 * StreakHero — le grand chiffre de ma série en tête du sheet /streak-save :
 * la flamme Lowki, le nombre en rouge de la charte, « jours ».
 *
 * `dim` : hier manqué, la flamme ET le chiffre pâlissent ensemble.
 * `revive` : la série vient d'être gardée, elle reprend vie — un halo rouge
 * s'ouvre derrière la flamme, la flamme et le chiffre reprennent leur couleur
 * en se gonflant un instant, quelques braises montent. Sans rebond, et rien
 * de tout ça avec « Réduire les animations » (juste la couleur qui revient).
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, fonts, lowki, spacing } from '../../utils/constants';
import { STREAK_FLAME } from './StreakPill';

interface StreakHeroProps {
  days: number;
  /** `dim` : hier manqué, tout pâlit ; `off` : pas de série, flamme sable */
  flame?: 'lit' | 'dim' | 'off';
  /** Passe à true : la série reprend vie (après `delay` ms) */
  revive?: boolean;
  delay?: number;
}

const FLAME = 40;
const DIM = 0.4;
/** Le halo, centré sur la flamme */
const GLOW = 132;
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN_OUT = Easing.inOut(Easing.cubic);

/** Les braises : décalage horizontal de départ, dérive, hauteur, retard, taille */
const EMBERS = [
  { x: -9, drift: -12, rise: 50, delay: 40, size: 6 },
  { x: 3, drift: 6, rise: 64, delay: 0, size: 7 },
  { x: 10, drift: 16, rise: 44, delay: 120, size: 5 },
  { x: -3, drift: -6, rise: 72, delay: 180, size: 5 },
  { x: 6, drift: 2, rise: 38, delay: 260, size: 6 },
  { x: -12, drift: -18, rise: 34, delay: 320, size: 4 },
  { x: 12, drift: 20, rise: 56, delay: 380, size: 4 },
];

export default function StreakHero({ days, flame = 'lit', revive = false, delay = 0 }: StreakHeroProps) {
  const reducedMotion = useReducedMotion();
  const dimmed = flame === 'dim';
  // 0 = pâli, 1 = allumé
  const life = useSharedValue(dimmed ? 0 : 1);
  const pop = useSharedValue(0);
  const glow = useSharedValue(0);
  const embers = useSharedValue(0);

  useEffect(() => {
    if (!revive) return;
    if (reducedMotion) {
      life.value = withDelay(delay, withTiming(1, { duration: 250 }));
      return;
    }
    life.value = withDelay(delay, withTiming(1, { duration: 420, easing: EASE_OUT }));
    pop.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 240, easing: EASE_OUT }),
        withTiming(0, { duration: 520, easing: EASE_IN_OUT }),
      ),
    );
    glow.value = withDelay(delay, withTiming(1, { duration: 1100, easing: EASE_OUT }));
    embers.value = withDelay(delay + 80, withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }));
  }, [revive, reducedMotion, delay, life, pop, glow, embers]);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: DIM + (1 - DIM) * life.value,
    transform: [{ scale: 1 + 0.22 * pop.value }],
  }));
  const daysStyle = useAnimatedStyle(() => ({
    opacity: DIM + (1 - DIM) * life.value,
    transform: [{ scale: 1 + 0.08 * pop.value }],
  }));
  // Le halo s'ouvre puis s'éteint : il ne reste que la flamme
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value < 0.25 ? glow.value * 4 * 0.9 : 0.9 * (1 - (glow.value - 0.25) / 0.75),
    transform: [{ scale: 0.4 + 0.8 * glow.value }],
  }));

  return (
    <View
      style={styles.hero}
      accessible
      accessibilityLabel={days > 0 ? `${days} jour${days > 1 ? 's' : ''} d'affilée` : 'Pas de série'}
    >
      <View style={styles.flameBox}>
        {revive && (
          <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]}>
            <Svg width={GLOW} height={GLOW}>
              <Defs>
                <RadialGradient id="streakGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={lowki.red.light} stopOpacity={0.45} />
                  <Stop offset="0.5" stopColor={lowki.red.light} stopOpacity={0.15} />
                  <Stop offset="1" stopColor={lowki.red.light} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#streakGlow)" />
            </Svg>
          </Animated.View>
        )}
        {revive && !reducedMotion && EMBERS.map((e, i) => <Ember key={i} progress={embers} {...e} />)}
        <Animated.View style={flameStyle}>
          <Image
            source={STREAK_FLAME}
            style={styles.flame}
            tintColor={flame === 'off' ? lowki.beige.light : undefined}
          />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.days, daysStyle]}>{days}</Animated.Text>
      <Text style={styles.unit}>{days > 1 ? 'jours' : 'jour'}</Text>
    </View>
  );
}

/** Une braise : part du cœur de la flamme, monte en dérivant, s'éteint */
function Ember({
  progress,
  x,
  drift,
  rise,
  delay,
  size,
}: {
  progress: SharedValue<number>;
  x: number;
  drift: number;
  rise: number;
  delay: number;
  size: number;
}) {
  const style = useAnimatedStyle(() => {
    // Chaque braise a son propre départ dans la même course
    const start = delay / 1000;
    const t = Math.max(0, Math.min(1, (progress.value - start) / (1 - start)));
    return {
      opacity: t === 0 ? 0 : t < 0.2 ? t * 5 : 1 - (t - 0.2) / 0.8,
      transform: [{ translateX: x + drift * t }, { translateY: -rise * t }, { scale: 1 - 0.5 * t }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ember,
        { width: size, height: size, borderRadius: size / 2, marginLeft: -size / 2, marginTop: -size / 2 },
        style,
      ]}
    >
      <LinearGradient colors={[lowki.butter.light, lowki.red.light]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  flameBox: {
    width: FLAME,
    height: FLAME,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flame: {
    width: FLAME,
    height: FLAME,
  },
  glow: {
    position: 'absolute',
    left: (FLAME - GLOW) / 2,
    top: (FLAME - GLOW) / 2,
    width: GLOW,
    height: GLOW,
  },
  ember: {
    position: 'absolute',
    left: FLAME / 2,
    top: FLAME * 0.45,
    overflow: 'hidden',
  },
  days: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: lowki.red.light,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textTertiary,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
});
