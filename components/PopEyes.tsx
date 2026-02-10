/**
 * Composant PopEyes - Yeux mascotte BBB
 * 
 * Affiche les yeux de la mascotte BBB.
 * Peut afficher soit les yeux ensemble, soit séparés (gauche/droite).
 * Utilisé dans le splash screen, les écrans d'onboarding, etc.
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface PopEyesProps {
  variant?: 'together' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const SIZES = {
  small: { width: 40, height: 40 },
  medium: { width: 60, height: 60 },
  large: { width: 80, height: 80 },
};

export default function PopEyes({ 
  variant = 'together', 
  size = 'medium', 
  style 
}: PopEyesProps) {
  const dimensions = SIZES[size];

  const getImageSource = () => {
    switch (variant) {
      case 'left':
        return require('../assets/images/pop-eye-left.png');
      case 'right':
        return require('../assets/images/pop-eye-right.png');
      case 'together':
      default:
        return require('../assets/images/pop-eyes.png');
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={getImageSource()}
        style={[styles.image, dimensions]}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    // Dimensions définies dynamiquement via props
  },
});
