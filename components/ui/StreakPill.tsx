/**
 * StreakPill — ma série, en haut à droite de l'accueil.
 *
 * Elle a quitté le cadre du livre (Lea, 2026-10-09) pour une gélule en verre,
 * en miroir du rond de la bibliothèque : même verre, même hauteur
 * (`ROUND_BUTTON_SIZE`), même ombre. La flamme Lowki à l'aquarelle, le nombre
 * de jours en rouge de la charte, sans « j ».
 *
 * Trois visages (voir `getStreakState`) :
 * - en cours (lu aujourd'hui) : la flamme pleine ;
 * - qui va mourir (pas encore lu aujourd'hui, ou hier manqué) : la flamme
 *   respire, pâlit et revient, comme une braise ;
 * - éteinte (pas de série) : une flamme sable et un 0.
 *
 * Un toucher ouvre la semaine de ma série (/streak).
 */

import React, { useEffect } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, lowki } from '../../utils/constants';
import type { StreakState } from '../../utils/streak';
import GlassPill from './GlassPill';

/** La flamme Lowki, à reprendre partout où l'on parle de la série */
export const STREAK_FLAME = require('../../assets/images/streak/streak-2.png');

interface StreakPillProps {
  /** Jours consécutifs de lecture */
  days: number;
  state: StreakState;
  onPress: () => void;
}

const LABELS: Record<StreakState, (days: number) => string> = {
  active: (d) => `Série de ${d} jour${d > 1 ? 's' : ''}`,
  atRisk: (d) => `Série de ${d} jour${d > 1 ? 's' : ''}, à garder aujourd'hui`,
  missed: (d) => `Série de ${d} jour${d > 1 ? 's' : ''}, hier manqué`,
  inactive: () => 'Pas de série',
};

export default function StreakPill({ days, state, onPress }: StreakPillProps) {
  const dying = state === 'atRisk' || state === 'missed';
  const off = state === 'inactive';

  // La braise : la flamme pâlit et revient, lentement
  const reduceMotion = useReducedMotion();
  const glow = useSharedValue(1);
  useEffect(() => {
    if (dying && !reduceMotion) {
      glow.value = withRepeat(withTiming(0.35, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true);
    } else {
      cancelAnimation(glow);
      glow.value = dying ? 0.5 : 1;
    }
  }, [dying, reduceMotion, glow]);
  const flameStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <GlassPill
      onPress={onPress}
      accessibilityLabel={LABELS[state](days)}
      accessibilityHint="Ouvre ma série de la semaine"
    >
      <Animated.View style={flameStyle}>
        <Image source={STREAK_FLAME} style={[styles.flame, off && styles.flameOff]} />
      </Animated.View>
      <Text style={[styles.days, off && styles.daysOff]} maxFontSizeMultiplier={1.3}>
        {days}
      </Text>
    </GlassPill>
  );
}

const styles = StyleSheet.create({
  flame: {
    width: 20,
    height: 20,
  },
  // Éteinte : la silhouette de la flamme, en sable
  flameOff: {
    tintColor: lowki.beige.light,
  },
  days: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: lowki.red.light,
    fontVariant: ['tabular-nums'],
  },
  daysOff: {
    color: colors.textTertiary,
  },
});
