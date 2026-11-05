/**
 * Shimmer — la lueur d'un squelette : une bande de lumière qui traverse la
 * vue, pour dire « ça arrive » sans spinner. À poser dans une vue
 * `overflow: 'hidden'` (absolue, ne touche pas la mise en page).
 *
 * `delay` décale la lueur : plusieurs squelettes côte à côte (les cases du
 * code) font passer la même vague de gauche à droite. Mouvement réduit :
 * une respiration douce à la place du passage.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Un passage, pause comprise */
const CYCLE_MS = 1500;
/** La part du cycle où la lueur traverse ; le reste, elle attend hors de la vue */
const SWEEP = 0.7;
const GLOW = ['rgba(255,255,255,0)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)'] as const;

export default function Shimmer({ delay = 0 }: { delay?: number }) {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.inOut(Easing.quad) }), -1, reducedMotion),
    );
  }, [delay, reducedMotion, progress]);

  const band = Math.max(width * 0.9, 24);
  const style = useAnimatedStyle(() =>
    reducedMotion
      ? { opacity: interpolate(progress.value, [0, 1], [0.2, 0.6]), transform: [{ translateX: 0 }] }
      : { opacity: 1, transform: [{ translateX: interpolate(progress.value, [0, SWEEP, 1], [-band, width, width]) }] },
  );

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Animated.View style={[styles.band, { width: reducedMotion ? width : band }, style]}>
          <LinearGradient colors={GLOW} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
