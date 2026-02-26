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
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors, fontSize } from '../utils/constants';
import PopEyes from './PopEyes';
import TEXTURE_IMAGE from '../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png';

interface AnimatedSplashProps {
  onFinish: () => void;
  /** Si fourni, le splash reste visible jusqu'à ce que cette condition soit true.
   * Utile pour attendre l'init auth et éviter le flash "nouvel utilisateur"
   * (photo par défaut, pas de prénom, empty state) au démarrage. */
  waitFor?: boolean;
}

export default function AnimatedSplash({ onFinish, waitFor }: AnimatedSplashProps) {
  const textOpacity = useSharedValue(0);
  
  const eyesScale = useSharedValue(3);
  const eyesOpacity = useSharedValue(0);

  const screenOpacity = useSharedValue(1);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const [entryDone, setEntryDone] = useState(false);
  const [fadeOutDone, setFadeOutDone] = useState(false);
  const [forceExit, setForceExit] = useState(false);

  // Phase 1 — Animation d'entrée (texte + yeux). Pas de fade-out ici.
  useEffect(() => {
    textOpacity.value = withTiming(1, { duration: 600 });
    
    eyesOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 180 })
    );
    eyesScale.value = withDelay(
      600,
      withTiming(1, { 
        duration: 220,
        easing: Easing.out(Easing.cubic),
      })
    );

    const entryTimer = setTimeout(() => setEntryDone(true), 1500);

    // Filet de sécurité : si après 8s le splash est toujours visible
    // (Supabase hang, réseau mort…), on force la sortie quand même.
    const bailoutTimer = setTimeout(() => setForceExit(true), 8000);
    
    return () => {
      clearTimeout(entryTimer);
      clearTimeout(bailoutTimer);
    };
  }, []);

  // Phase 2 — Lancer le fade-out quand :
  //   (entrée finie ET waitFor prêt) OU forceExit (timeout 8s)
  const hasStartedFadeOut = useRef(false);
  useEffect(() => {
    if (hasStartedFadeOut.current) return;

    const waitForReady = waitFor === undefined || waitFor;
    const canProceed = (entryDone && waitForReady) || forceExit;
    if (!canProceed) return;

    hasStartedFadeOut.current = true;
    screenOpacity.value = withTiming(0, { duration: 300 });

    const timer = setTimeout(() => setFadeOutDone(true), 300);
    return () => clearTimeout(timer);
  }, [entryDone, waitFor, forceExit]);

  // Phase 3 — Appeler onFinish une seule fois quand le fade-out est terminé
  const hasCalledFinishRef = useRef(false);
  useEffect(() => {
    if (!fadeOutDone || hasCalledFinishRef.current) return;
    hasCalledFinishRef.current = true;
    onFinishRef.current();
  }, [fadeOutDone]);

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
    alignItems: 'flex-start', // Aligne à gauche pour que les "b" soient empilés verticalement
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontFamily: 'Rokkitt_700Bold',
    fontSize: fontSize['6xl'], // 72px
    fontWeight: '700',
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
