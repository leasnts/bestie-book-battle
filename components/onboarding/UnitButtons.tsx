/**
 * UnitButtons — compter en pages ou en % : deux boutons ronds, le signe écrit
 * dans la police d'accent (comme le « p. » de la règle) :
 *
 *    En pages ou en % ?            ( p. )  ( % )
 *
 * Même matière que les lignes d'OptionList : papier crème et couture pâle au
 * repos, voile beige et couture chocolat une fois choisi. Rien n'est choisi
 * d'avance.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { colors, fonts, motion, ROUND_BUTTON_SIZE, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import PressableScale from '../ui/PressableScale';
import { StitchBorder } from '../ui/Stitch';
import { EDGE, PAPER, PAPER_ON, RING_ON, STITCH_INSET, STITCH_ON, STITCH_WEIGHT } from './OptionList';

export type Unit = 'pages' | 'percent';

const UNITS: { key: Unit; sign: string; label: string }[] = [
  { key: 'pages', sign: 'p.', label: 'En pages' },
  { key: 'percent', sign: '%', label: 'En pourcentage' },
];

const SIZE = ROUND_BUTTON_SIZE;

export default function UnitButtons({ value, onChange }: { value: Unit | null; onChange: (unit: Unit) => void }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {UNITS.map((unit) => (
        <UnitButton key={unit.key} sign={unit.sign} label={unit.label} selected={unit.key === value} onPress={() => onChange(unit.key)} />
      ))}
    </View>
  );
}

function UnitButton({ sign, label, selected, onPress }: { sign: string; label: string; selected: boolean; onPress: () => void }) {
  const reduced = useReducedMotion();
  const on = useSharedValue(selected ? 1 : 0);
  const bump = useSharedValue(1);

  useEffect(() => {
    const target = selected ? 1 : 0;
    if (reduced) {
      on.value = target;
      return;
    }
    on.value = withTiming(target, { duration: motion.duration.standard });
    if (selected) {
      bump.value = withSequence(
        withTiming(1.08, { duration: motion.duration.instant }),
        withSpring(1, { damping: 11, stiffness: 260 }),
      );
    }
  }, [selected, reduced, on, bump]);

  const scale = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const fade = useAnimatedStyle(() => ({ opacity: on.value }));
  const idleFade = useAnimatedStyle(() => ({ opacity: 1 - on.value }));

  return (
    <PressableScale
      pressedScale={0.9}
      onPress={() => {
        if (selected) return;
        feel('tic');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.button, scale]}>
        <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
          <LinearGradient colors={PAPER} style={StyleSheet.absoluteFill} />
          <Animated.View style={[StyleSheet.absoluteFill, fade]}>
            <LinearGradient colors={PAPER_ON} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.View style={[styles.ring, styles.ringIdle, idleFade]} />
          <Animated.View style={[styles.ring, styles.ringOn, fade]} />
          <Animated.View style={[StyleSheet.absoluteFill, idleFade]}>
            <StitchBorder radius={SIZE / 2} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, fade]}>
            <StitchBorder radius={SIZE / 2} inset={STITCH_INSET} color={STITCH_ON} weight={STITCH_WEIGHT} />
          </Animated.View>
        </View>
        <Text style={[styles.sign, !selected && styles.signIdle]}>{sign}</Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clip: {
    borderRadius: SIZE / 2,
    overflow: 'hidden',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: SIZE / 2,
  },
  ringIdle: {
    borderWidth: 1,
    borderColor: EDGE,
  },
  ringOn: {
    borderWidth: 1,
    borderColor: RING_ON,
  },
  sign: {
    fontFamily: fonts.accent,
    fontSize: 22,
    color: colors.textPrimary,
  },
  signIdle: {
    color: colors.textTertiary,
  },
});
