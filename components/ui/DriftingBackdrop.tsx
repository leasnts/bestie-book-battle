/**
 * DriftingBackdrop — un fond vivant : des taches douces qui dérivent lentement.
 *
 * Derrière la pile des nouvelles du carnet. Les trois tons de l'app, adoucis
 * (sable, chocolat clair, un souffle de lie de vin), en deux couches qui
 * glissent en sens contraire sur une quinzaine de secondes : ça respire sans
 * attirer l'œil loin de la note.
 *
 * - Les couches débordent de l'écran (20 % de chaque côté) : en dérivant, leur
 *   bord ne se voit jamais.
 * - N'anime que `transform` ; « Réduire les animations » fige le fond.
 * - Taches en `radial-gradient` (`experimental_backgroundImage`), comme
 *   `CoverBackdrop` : pas d'image, pas de bibliothèque.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../utils/constants';

/** Sable et chocolat clair : le gros des taches */
const BACK = [
  'radial-gradient(60% 40% at 20% 20%, rgba(205,184,163,0.55) 0%, rgba(205,184,163,0) 70%)',
  'radial-gradient(55% 35% at 85% 70%, rgba(168,143,123,0.32) 0%, rgba(168,143,123,0) 70%)',
].join(', ');

/** Un souffle de lie de vin et de sable clair, qui passe devant */
const FRONT = [
  'radial-gradient(45% 30% at 80% 25%, rgba(140,59,76,0.13) 0%, rgba(140,59,76,0) 70%)',
  'radial-gradient(50% 32% at 25% 80%, rgba(226,212,196,0.6) 0%, rgba(226,212,196,0) 70%)',
].join(', ');

/** Un aller (ou un retour) : lent, pour que ça respire */
const DRIFT = 15000;

export default function DriftingBackdrop() {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(
      withTiming(1, { duration: DRIFT, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [reduced, t]);

  const back = useAnimatedStyle(() => ({
    transform: [
      { translateX: -30 + t.value * 60 },
      { translateY: 20 - t.value * 40 },
      { scale: 1 + t.value * 0.06 },
    ],
  }));
  const front = useAnimatedStyle(() => ({
    transform: [
      { translateX: 40 - t.value * 80 },
      { translateY: -25 + t.value * 50 },
    ],
  }));

  return (
    <View style={styles.paper} pointerEvents="none">
      <Animated.View style={[styles.layer, { experimental_backgroundImage: BACK }, back]} />
      <Animated.View style={[styles.layer, { experimental_backgroundImage: FRONT }, front]} />
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgLight,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: '-20%',
    bottom: '-20%',
    left: '-20%',
    right: '-20%',
  },
});
