/**
 * Composant PressableScale
 *
 * Un Pressable qui se « rentre » légèrement quand on appuie dessus, puis revient
 * à sa taille normale au relâchement.
 *
 * Pourquoi ce composant :
 * Sur mobile il n'y a pas de survol (hover) — le seul retour visuel possible au
 * toucher est l'état pressé. Sans lui, l'interface paraît morte : on tape et
 * rien ne bouge avant que l'écran suivant s'ouvre.
 *
 * Comment ça marche :
 * - `onPressIn` lance une animation du scale vers `pressedScale` (0.97 par défaut)
 * - `onPressOut` le ramène à 1
 * - L'animation passe par Reanimated, donc elle tourne sur le thread natif :
 *   elle reste fluide même si le thread JS est occupé
 * - On anime uniquement `transform` (et `opacity`), les deux seules propriétés
 *   qui ne déclenchent pas de recalcul de layout
 * - Si l'utilisateur a activé « Réduire les animations » dans iOS, on n'anime
 *   rien du tout (règle d'accessibilité non négociable)
 */

import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../../utils/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Échelle atteinte pendant l'appui. Plus l'élément est grand, plus on reste proche de 1. */
  pressedScale?: number;
  /** Opacité pendant l'appui (1 = pas de changement) */
  pressedOpacity?: number;
}

export default function PressableScale({
  children,
  style,
  pressedScale = 0.97,
  pressedOpacity = 1,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const progress = useSharedValue(0); // 0 = au repos, 1 = enfoncé
  const reducedMotion = useReducedMotion();

  const timing = {
    duration: motion.duration.instant,
    easing: Easing.bezier(...motion.easing.easeOutQuart),
  };

  const animatedStyle = useAnimatedStyle(() => {
    // progress va de 0 à 1, on interpole manuellement pour rester lisible
    const scale = 1 + (pressedScale - 1) * progress.value;
    const opacity = 1 + (pressedOpacity - 1) * progress.value;
    return { transform: [{ scale }], opacity };
  });

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[style, disabled && { opacity: 0.5 }, !reducedMotion && animatedStyle]}
      onPressIn={(e) => {
        progress.value = withTiming(1, timing);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        progress.value = withTiming(0, timing);
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
