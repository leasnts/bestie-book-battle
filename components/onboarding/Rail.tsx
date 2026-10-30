/**
 * Rail — un choix court dans un rail arrondi : la case choisie glisse dedans.
 *
 *    ( [·p.·]   %  )        pages ou % (UnitButtons)
 *    ( 1 sem. [·2 sem.·] 3 sem. 4 sem. )   raccourcis de date (« On se donne une date de fin ? »)
 *
 * Même matière que les lignes d'OptionList : rail en papier crème, case au voile
 * beige et couture chocolat. Le glissement est court, pour que le choix réponde
 * tout de suite. Rien de choisi (`value` null) : pas de case.
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

export interface RailOption<K extends string> {
  key: K;
  label: string;
  /** Ce que lit VoiceOver, si le libellé est un signe (« p. ») */
  a11y?: string;
}

const HEIGHT = ROUND_BUTTON_SIZE;
/** L'écart entre la case et le bord du rail */
const PAD = 3;
const RADIUS = HEIGHT / 2;
const THUMB_RADIUS = RADIUS - PAD;
const SLIDE_MS = 160;

interface RailProps<K extends string> {
  options: RailOption<K>[];
  value: K | null;
  onChange: (key: K) => void;
  /** La largeur d'une case */
  segment?: number;
  /** Libellés dans la police d'accent (signes « p. », « % ») */
  accent?: boolean;
}

export default function Rail<K extends string>({ options, value, onChange, segment = 60, accent = false }: RailProps<K>) {
  const reduced = useReducedMotion();
  const index = options.findIndex((o) => o.key === value);
  const x = useSharedValue(Math.max(index, 0) * segment);
  const shown = useSharedValue(index >= 0 ? 1 : 0);

  useEffect(() => {
    if (index < 0) {
      shown.value = 0;
      return;
    }
    const target = index * segment;
    // La case apparaît sur place la première fois, puis glisse
    if (reduced || shown.value === 0) x.value = target;
    else x.value = withTiming(target, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) });
    shown.value = 1;
  }, [index, reduced, segment, x, shown]);

  const thumb = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.rail} accessibilityRole="radiogroup">
      <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
        <LinearGradient colors={PAPER} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.railRing]} />
      </View>

      <Animated.View style={[styles.thumb, { width: segment }, thumb]} pointerEvents="none">
        <LinearGradient colors={PAPER_ON} style={[StyleSheet.absoluteFill, styles.thumbClip]} />
        <View style={[StyleSheet.absoluteFill, styles.thumbRing]} />
        <StitchBorder radius={THUMB_RADIUS} inset={2} color={STITCH_ON} weight={STITCH_WEIGHT} />
      </Animated.View>

      {options.map((option) => {
        const selected = option.key === value;
        return (
          <PressableScale
            key={option.key}
            style={[styles.segment, { width: segment }]}
            pressedScale={0.94}
            onPress={() => {
              if (selected) return;
              feel('tic');
              onChange(option.key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.a11y ?? option.label}
          >
            <Text style={[accent ? styles.sign : styles.label, !selected && styles.idle]}>{option.label}</Text>
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
    borderRadius: THUMB_RADIUS,
  },
  thumbRing: {
    borderRadius: THUMB_RADIUS,
    borderWidth: 1,
    borderColor: RING_ON,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sign: {
    fontFamily: fonts.accent,
    fontSize: 22,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  idle: {
    color: colors.textTertiary,
  },
});
