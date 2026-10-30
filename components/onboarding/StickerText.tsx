/**
 * StickerText — un autocollant brodé (NoteSticker) qui porte une phrase courte,
 * posé un peu de travers, le coin en haut à gauche corné : la phrase qui
 * réagit au rythme choisi (« Le bon rythme. »).
 *
 * À chaque changement de `popKey`, il se colle : il arrive un peu plus grand et
 * soulevé, puis se plaque sur la page, sans rebond.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { colors, fonts, postIt, spacing } from '../../utils/constants';
import NoteSticker from '../ui/NoteSticker';

/** Le temps de se plaquer sur la page */
const STICK_MS = 200;

interface StickerTextProps {
  id: string;
  text: string;
  /** La petite ligne dessous (autrice et page, date de fin…) */
  caption?: string;
  color?: string;
  width?: number;
  height?: number;
  /** Change : l'autocollant se repose */
  popKey?: string | number;
  /** Inclinaison au repos, en degrés */
  angle?: number;
}

export default function StickerText({
  id,
  text,
  caption,
  color = postIt.sable,
  width = 240,
  height = 112,
  popKey,
  angle = -2,
}: StickerTextProps) {
  const reducedMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (popKey === undefined || reducedMotion) return;
    lift.value = withSequence(withTiming(1, { duration: 0 }), withTiming(0, { duration: STICK_MS, easing: Easing.out(Easing.cubic) }));
  }, [popKey, reducedMotion, lift]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - lift.value * 0.6,
    transform: [{ translateY: -10 * lift.value }, { scale: 1 + 0.08 * lift.value }, { rotate: `${angle - 2 * lift.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width, height }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <NoteSticker id={id} color={color} width={width} height={height} corner="top-left" />
      </View>
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={3}>
          {text}
        </Text>
        {caption && <Text style={styles.caption} numberOfLines={2}>{caption}</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 21,
    // Ce qui se lit sort du ton sur ton : l'encre (DESIGN.md › Charte Lowki)
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
