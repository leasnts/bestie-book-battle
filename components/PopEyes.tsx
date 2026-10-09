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

import { POP_EYES_HEIGHT, POP_EYES_PATH, POP_EYES_WIDTH } from './brand/popEyesPath';

interface PopEyesProps {
  variant?: 'together' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  /** `ink` : l'image chocolat. `paper` : ton sur ton avec le fond de l'app (bgApp), yeux ensemble seulement. */
  tone?: 'ink' | 'paper';
  style?: ViewStyle;
}

/** Les 5 formes du tracé, peintes dans l'ordre (cf. popEyesPath.ts). */
const [STICKER, BIG_LINE, BIG_WHITE, SMALL_LINE, SMALL_WHITE] = POP_EYES_PATH.split(/(?=M)/);

/** Ton sur ton avec bgApp (#ede8e0) : sticker un cran dessous, trait en sable, blanc crème. */
const PAPER_TONES = {
  sticker: ['#e3dcd0', '#d6ccbe'],
  line: ['#c9bba7', '#ad9c86'],
  white: ['#faf8f4', '#efe9e0'],
} as const;

function PaperEyes({ width }: { width: number }) {
  return (
    <Svg
      width={width}
      height={(width * POP_EYES_HEIGHT) / POP_EYES_WIDTH}
      viewBox={`0 0 ${POP_EYES_WIDTH} ${POP_EYES_HEIGHT}`}
    >
      <Defs>
        {Object.entries(PAPER_TONES).map(([id, [top, bottom]]) => (
          <LinearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        ))}
      </Defs>
      <Path d={STICKER} fill="url(#sticker)" />
      <Path d={BIG_LINE} fill="url(#line)" />
      <Path d={BIG_WHITE} fill="url(#white)" />
      <Path d={SMALL_LINE} fill="url(#line)" />
      <Path d={SMALL_WHITE} fill="url(#white)" />
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
  tone = 'ink',
  style 
}: PopEyesProps) {
  const dimensions = SIZES[size];

  if (tone === 'paper' && variant === 'together') {
    return (
      <View style={[styles.container, dimensions, style]}>
        <PaperEyes width={dimensions.width} />
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
