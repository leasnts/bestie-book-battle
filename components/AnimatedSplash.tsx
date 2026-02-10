/**
 * Splash Screen Animé
 * 
 * Animation :
 * 1. Fade in du texte "b estie / b ook / b attle"
 * 2. Les yeux arrivent vers nous (gros) et se rétrécissent
 *    pour se poser sur les "oo" de "book" — pas de rebond, immobiles à la fin
 * 3. Temps de latence pour lire le splash
 * 4. Fade out global → transition vers l'écran de sign in
 */

import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors, fontSize, fontWeight } from '../utils/constants';
import PopEyes from './PopEyes';

// Asset texture de fond
const TEXTURE_IMAGE = require('../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

interface AnimatedSplashProps {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  // Texte
  const textOpacity = useSharedValue(0);
  
  // Yeux : commencent gros (scale 3) et se rétrécissent vers 1
  const eyesScale = useSharedValue(3);
  const eyesOpacity = useSharedValue(0);

  // Fade out global à la fin
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // Timeline :
    // 0ms       → Fade in du texte (700ms)
    // 1000ms    → Les yeux apparaissent (opacity 0→1) en zoomant depuis gros (3→1)
    //             durée 250ms, easing decelerate → effet "ça vient vers nous et se pose"
    // 1250ms    → Yeux posés, immobiles
    // 3200ms    → Fade out global (500ms)
    // 3700ms    → onFinish → écran de sign in

    // 1. Fade in du texte
    textOpacity.value = withTiming(1, { duration: 700 });
    
    // 2. Les yeux arrivent : opacity 0→1 + scale 3→1
    eyesOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 200 })
    );
    eyesScale.value = withDelay(
      1000,
      withTiming(1, { 
        duration: 250,
        easing: Easing.out(Easing.cubic), // Décélère en arrivant → se "pose"
      })
    );
    
    // 3. Temps de latence (~2s pour lire), puis fade out global
    screenOpacity.value = withDelay(
      3200,
      withTiming(0, { duration: 500 })
    );

    // 4. Quand le fade out est fini, on passe à l'écran suivant
    const timer = setTimeout(() => {
      onFinish();
    }, 3700);
    
    return () => clearTimeout(timer);
  }, []);

  // Style animé pour le texte
  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // Style animé pour les yeux : scale + opacity
  const eyesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: eyesOpacity.value,
    transform: [
      { scale: eyesScale.value },
    ],
  }));

  // Fade out global de tout l'écran
  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      {/* Fond noir avec texture */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.background} />
        <Image
          source={TEXTURE_IMAGE}
          style={styles.texture}
          contentFit="cover"
        />
      </View>

      {/* Texte "b estie / b ook / b attle" centré */}
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.text}>b estie</Text>
        {/* La ligne "b ook" contient un marqueur invisible pour positionner les yeux */}
        <View style={styles.bookLine}>
          <Text style={styles.text}>b </Text>
          <View style={styles.ooContainer}>
            {/* Les "oo" du texte — cachés par les yeux quand ils sont posés */}
            <Text style={styles.text}>oo</Text>
            {/* Yeux mascotte positionnés exactement par-dessus les "oo" */}
            <Animated.View style={[styles.eyesOverlay, eyesAnimatedStyle]}>
              <PopEyes size="large" />
            </Animated.View>
          </View>
          <Text style={styles.text}>k</Text>
        </View>
        <Text style={styles.text}>b attle</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark950,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.dark950,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontFamily: 'Rokkitt_Bold',
    fontSize: fontSize['6xl'], // 72px
    fontWeight: fontWeight.bold as any,
    color: colors.white,
    letterSpacing: -1.44,
    lineHeight: 86,
  },
  bookLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ooContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyesOverlay: {
    position: 'absolute',
    // Centré exactement par-dessus les "oo"
    alignSelf: 'center',
  },
});
