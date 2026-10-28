/**
 * StickerText — un autocollant brodé (NoteSticker) qui porte une phrase courte,
 * posé un peu de travers : la note de Chloé sur la promesse, la phrase qui
 * réagit au rythme choisi (« Le bon rythme. »).
 *
 * `pop` : à chaque changement de `popKey`, il se repose (glisse et se tourne).
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { colors, fonts, postIt, spacing } from '../../utils/constants';
import NoteSticker from '../ui/NoteSticker';

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
    lift.value = withSequence(withTiming(1, { duration: 0 }), withSpring(0, { damping: 13, stiffness: 260 }));
  }, [popKey, reducedMotion, lift]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - lift.value * 0.8,
    transform: [{ translateY: 14 * lift.value }, { rotate: `${angle + 3 * lift.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width, height }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <NoteSticker id={id} color={color} width={width} height={height} corner="none" />
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
