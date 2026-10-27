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
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { lowki } from '../utils/constants';
import { POP_EYES_HEIGHT, POP_EYES_PATH, POP_EYES_WIDTH } from './brand/popEyesPath';

interface PopEyesProps {
  variant?: 'together' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  /** Le tracé vectoriel (eyes.svg) en chocolat Lowki plutôt que l'image, yeux ensemble seulement. */
  vector?: boolean;
  style?: ViewStyle;
}

/** Une seule forme en chocolat Lowki ; les traits évidés laissent voir le fond. */
function VectorEyes({ width }: { width: number }) {
  return (
    <Svg
      width={width}
      height={(width * POP_EYES_HEIGHT) / POP_EYES_WIDTH}
      viewBox={`0 0 ${POP_EYES_WIDTH} ${POP_EYES_HEIGHT}`}
    >
      <Defs>
        <LinearGradient id="eyes" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lowki.chocolate.light} />
          <Stop offset="1" stopColor={lowki.chocolate.dark} />
        </LinearGradient>
      </Defs>
      <Path d={POP_EYES_PATH} fill="url(#eyes)" />
    </Svg>
  );
}

const SIZES = {
  small: { width: 40, height: 40 },
  medium: { width: 60, height: 60 },
  large: { width: 80, height: 80 },
};

export default function PopEyes({ 
  variant = 'together', 
  size = 'medium', 
  vector = false,
  style 
}: PopEyesProps) {
  const dimensions = SIZES[size];

  if (vector && variant === 'together') {
    return (
      <View style={[styles.container, dimensions, style]}>
        <VectorEyes width={dimensions.width} />
      </View>
    );
  }

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
