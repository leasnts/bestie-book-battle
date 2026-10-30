/**
 * UnitButtons — compter en pages ou en % : un rail arrondi, la case choisie
 * glisse dedans, le signe écrit dans la police d'accent (comme le « p. » de la règle) :
 *
 *    ( [·p.·]   %  )
 *
 * Même matière que les lignes d'OptionList : rail en papier crème, case au voile
 * beige et couture chocolat. Le glissement est court, pour que le choix réponde
 * tout de suite.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts, ROUND_BUTTON_SIZE } from '../../utils/constants';
import { feel } from '../../utils/feel';
import PressableScale from '../ui/PressableScale';
import { StitchBorder } from '../ui/Stitch';
import { EDGE, PAPER, PAPER_ON, RING_ON, STITCH_ON, STITCH_WEIGHT } from './OptionList';

export type Unit = 'pages' | 'percent';

const UNITS: { key: Unit; sign: string; label: string }[] = [
  { key: 'pages', sign: 'p.', label: 'En pages' },
  { key: 'percent', sign: '%', label: 'En pourcentage' },
];

const HEIGHT = ROUND_BUTTON_SIZE;
/** La largeur d'une case */
const SEGMENT = 60;
/** L'écart entre la case et le bord du rail */
const PAD = 3;
const RADIUS = HEIGHT / 2;
const THUMB_RADIUS = RADIUS - PAD;
const SLIDE_MS = 160;

export default function UnitButtons({ value, onChange }: { value: Unit | null; onChange: (unit: Unit) => void }) {
  const reduced = useReducedMotion();
  const index = UNITS.findIndex((u) => u.key === value);
  const x = useSharedValue(Math.max(index, 0) * SEGMENT);

  useEffect(() => {
    if (index < 0) return;
    const target = index * SEGMENT;
    x.value = reduced ? target : withTiming(target, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) });
  }, [index, reduced, x]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.rail} accessibilityRole="radiogroup">
      <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
        <LinearGradient colors={PAPER} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.railRing]} />
      </View>

      {index >= 0 && (
        <Animated.View style={[styles.thumb, thumb]} pointerEvents="none">
          <LinearGradient colors={PAPER_ON} style={[StyleSheet.absoluteFill, styles.thumbClip]} />
          <View style={[StyleSheet.absoluteFill, styles.thumbRing]} />
          <StitchBorder radius={THUMB_RADIUS} inset={2} color={STITCH_ON} weight={STITCH_WEIGHT} />
        </Animated.View>
      )}

      {UNITS.map((unit) => {
        const selected = unit.key === value;
        return (
          <PressableScale
            key={unit.key}
            style={styles.segment}
            pressedScale={0.94}
            onPress={() => {
              if (selected) return;
              feel('tic');
              onChange(unit.key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={unit.label}
          >
            <Text style={[styles.sign, !selected && styles.signIdle]}>{unit.sign}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexDirection: 'row',
    height: HEIGHT,
    padding: PAD,
    borderRadius: RADIUS,
  },
  clip: {
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  railRing: {
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: EDGE,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    width: SEGMENT,
  },
  thumbClip: {
    borderRadius: THUMB_RADIUS,
  },
  thumbRing: {
    borderRadius: THUMB_RADIUS,
    borderWidth: 1,
    borderColor: RING_ON,
  },
  segment: {
    width: SEGMENT,
    alignItems: 'center',
    justifyContent: 'center',
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
