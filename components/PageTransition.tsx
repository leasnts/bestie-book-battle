/**
 * PageTransition — Enveloppe chaque écran d'onglet avec une animation
 * d'entrée subtile : fade-in + glissement vers le haut.
 *
 * Pourquoi useFocusEffect et pas useEffect ?
 * Les écrans dans un Tabs navigator sont pré-montés une seule fois.
 * useEffect ne se déclenche qu'au premier montage — pas au retour sur un écran.
 * useFocusEffect se déclenche à chaque fois que l'écran devient actif,
 * ce qui donne une animation à chaque navigation.
 *
 * Pourquoi opacity + translateY ?
 * Ce sont les seules propriétés animées sur le GPU (pas de recalcul de layout).
 * → 60 fps garantis même sur des appareils anciens.
 */

import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface PageTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function PageTransition({ children, style }: PageTransitionProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useFocusEffect(
    useCallback(() => {
      // Réinitialise l'état de départ à chaque fois que l'écran entre en focus
      opacity.value = 0;
      translateY.value = 10;

      // Joue l'animation d'entrée : 220ms, décélération cubique
      opacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
