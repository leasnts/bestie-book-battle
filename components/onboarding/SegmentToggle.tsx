/**
 * SegmentToggle — un petit interrupteur à deux ou trois mots, pour un choix
 * qui ne mérite pas une ligne par option (pages ou %) :
 *
 *    ( ·Pages·· |   %   )     la case choisie : le voile et la couture d'OptionList
 *
 * Rien n'est choisi d'avance : la case n'apparaît qu'au premier toucher, puis
 * glisse d'un mot à l'autre.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { borderRadius, colors, fonts, motion } from '../../utils/constants';
import { feel } from '../../utils/feel';
import PressableScale from '../ui/PressableScale';
import { StitchBorder } from '../ui/Stitch';
import { EDGE, PAPER, PAPER_ON, RING_ON, STITCH_INSET, STITCH_ON, STITCH_WEIGHT } from './OptionList';

interface SegmentToggleProps<K extends string> {
  options: { key: K; label: string; accessibilityLabel?: string }[];
  /** null = rien de choisi */
  value: K | null;
  onChange: (key: K) => void;
}

const HEIGHT = 44;
const RADIUS = borderRadius.lg;
/** L'écart entre la case et le bord du rail */
const PAD = 3;

export default function SegmentToggle<K extends string>({ options, value, onChange }: SegmentToggleProps<K>) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const segment = width > 0 ? (width - PAD * 2) / options.length : 0;
  const index = options.findIndex((o) => o.key === value);
  const x = useSharedValue(0);
  const shown = useSharedValue(0);

  useEffect(() => {
    if (index < 0 || segment === 0) return;
    const target = index * segment;
    // La première fois, la case naît à sa place ; ensuite elle glisse
    x.value = reduced || shown.value === 0 ? target : withSpring(target, { damping: 18, stiffness: 240 });
    shown.value = reduced ? 1 : withTiming(1, { duration: motion.duration.standard });
  }, [index, segment, reduced, x, shown]);

  const thumb = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateX: x.value }] }));

  return (
    <View
      style={styles.rail}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="radiogroup"
    >
      <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
        <LinearGradient colors={PAPER} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.railRing]} />
      </View>

      {segment > 0 && (
        <Animated.View style={[styles.thumb, { width: segment }, thumb]} pointerEvents="none">
          <LinearGradient colors={PAPER_ON} style={[StyleSheet.absoluteFill, styles.thumbClip]} />
          <View style={[StyleSheet.absoluteFill, styles.thumbRing]} />
          <StitchBorder radius={RADIUS - PAD} inset={STITCH_INSET - 1} color={STITCH_ON} weight={STITCH_WEIGHT} />
        </Animated.View>
      )}

      {options.map((option) => {
        const selected = option.key === value;
        return (
          <PressableScale
            key={option.key}
            style={styles.segment}
            pressedScale={0.96}
            onPress={() => {
              if (selected) return;
              feel('tic');
              onChange(option.key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
          >
            <Text style={[styles.label, !selected && styles.labelIdle]}>{option.label}</Text>
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
  },
  thumbClip: {
    borderRadius: RADIUS - PAD,
  },
  thumbRing: {
    borderRadius: RADIUS - PAD,
    borderWidth: 1,
    borderColor: RING_ON,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  labelIdle: {
    color: colors.textTertiary,
  },
});
