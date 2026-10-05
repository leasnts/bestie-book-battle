/**
 * Splash Screen Animé — « Aimant »
 *
 * Animation (≈ 1 s) :
 * 1. Le logo entier (yeux collés) et « Lowki » en Welcome Valentines dessous, sur
 *    fond lie de vin. C'est exactement l'image du splash natif
 *    (SplashScreen.storyboard), affichée pendant le chargement de l'app : le
 *    relais est invisible. (Yeux écartés pendant le chargement = ~1,5 s figés.)
 * 2. Dès que React prend la main, les yeux se décollent d'un coup en se penchant,
 *    s'attirent, se cognent (petit écrasement), reculent un poil, se recollent,
 *    puis se redressent.
 * 3. Fade out global → l'app.
 *
 * Réglages choisis par Lea dans le labo HTML le 2026-10-05 (vitesse 1, rebond 0,5).
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { accentGradient } from '../utils/constants';
import {
  LOGO_EYES_CLIP,
  LOGO_EYES_PATH,
  LOGO_EYES_VIEWBOX,
  LOGO_WORD_PATH,
  LOGO_WORD_RATIO,
  LOGO_WORD_VIEWBOX,
} from './brand/logoEyesPath';

/** Côté du carré du logo, en points. Le splash natif utilise la même taille. */
export const SPLASH_LOGO_SIZE = 220;
/** Jusqu'où chaque œil se décolle, dans le repère 1200 du SVG. */
const SPREAD = 130;
const U = SPLASH_LOGO_SIZE / LOGO_EYES_VIEWBOX;

/** Les yeux en crème, clair en haut → un peu plus foncé en bas (jamais d'aplat). */
const EYES_GRADIENT = ['#fdfcfa', '#efe6e0'] as const;

// Ressorts : rebond 0,5 du labo = amorti à 59 % de l'amorti critique (2√raideur).
const SQUASH_SPRING = { stiffness: 400, damping: 23.6, mass: 1 };
const LEAN_SPRING = { stiffness: 220, damping: 17.5, mass: 1 };

// Décollés en 160 ms, contact à 440 ms, recollés à 720 ms.
const T_SPREAD = 160;
const T_CONTACT = 440;
const T_RECONTACT = 720;

/**
 * « Lowki » sous les yeux, en tracé (pas en <Text>, ni en image : les deux
 * arrivent après la première image). Placement identique au storyboard : les
 * yeux remontés de 34 pt, le mot centré 82 pt sous le centre de l'écran, pour
 * centrer l'ensemble yeux + mot.
 */
const WORD_HEIGHT = 51.5;
const WORD = { width: WORD_HEIGHT * LOGO_WORD_RATIO, height: WORD_HEIGHT };
const WORD_COLOR = '#fdfcfa';
const LOGO_SHIFT_Y = -34;
const WORD_CENTER_Y = 82;

interface AnimatedSplashProps {
  onFinish: () => void;
  /** Si fourni, le splash reste visible jusqu'à ce que cette condition soit true.
   * Utile pour attendre l'init auth et éviter le flash "nouvel utilisateur"
   * (photo par défaut, pas de prénom, empty state) au démarrage. */
  waitFor?: boolean;
}

type Side = 'left' | 'right';

/** Un œil seul, dans le carré complet du logo (pour garder sa place exacte). */
function Eye({ side }: { side: Side }) {
  return (
    <Svg width={SPLASH_LOGO_SIZE} height={SPLASH_LOGO_SIZE} viewBox={`0 0 ${LOGO_EYES_VIEWBOX} ${LOGO_EYES_VIEWBOX}`}>
      <Defs>
        <SvgGradient id="eyes" gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="0" y2="1010">
          <Stop offset="0" stopColor={EYES_GRADIENT[0]} />
          <Stop offset="1" stopColor={EYES_GRADIENT[1]} />
        </SvgGradient>
        <ClipPath id="cut">
          <Path d={LOGO_EYES_CLIP[side]} />
        </ClipPath>
      </Defs>
      <Path d={LOGO_EYES_PATH} fill="url(#eyes)" clipPath="url(#cut)" />
    </Svg>
  );
}

function useEyeStyle(x: SharedValue<number>, r: SharedValue<number>, sx: SharedValue<number>, sy: SharedValue<number>) {
  return useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { rotate: `${r.value}deg` },
      { scaleX: sx.value },
      { scaleY: sy.value },
    ],
  }));
}

export default function AnimatedSplash({ onFinish, waitFor }: AnimatedSplashProps) {
  const leftX = useSharedValue(0);
  const rightX = useSharedValue(0);
  const leftR = useSharedValue(0);
  const rightR = useSharedValue(0);
  // L'écrasement est le même pour les deux yeux
  const squashX = useSharedValue(1);
  const squashY = useSharedValue(1);

  const screenOpacity = useSharedValue(1);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const [entryDone, setEntryDone] = useState(false);
  const [fadeOutDone, setFadeOutDone] = useState(false);
  const [forceExit, setForceExit] = useState(false);

  // Phase 1 — Animation d'entrée. Pas de fade-out ici.
  // useLayoutEffect et non useEffect : au lancement, le fil JS est occupé (auth,
  // polices, stores) et un useEffect partait ~1 s après l'affichage, yeux figés.
  useLayoutEffect(() => {
    const lean = { duration: 220, easing: Easing.inOut(Easing.quad) };
    leftR.value = withTiming(7, lean);
    rightR.value = withTiming(-7, lean);

    // Décollés d'un coup, attirés (accélère jusqu'au contact), petit recul, recollés
    const attract = (side: number) =>
      withSequence(
        withTiming(side * SPREAD * U, { duration: T_SPREAD, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: T_CONTACT - T_SPREAD, easing: Easing.in(Easing.cubic) }),
        withTiming(side * 26 * U, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) }),
      );
    leftX.value = attract(-1);
    rightX.value = attract(1);

    const impact = (amount: number) => {
      squashX.value = withSequence(withTiming(1 - 0.07 * amount, { duration: 0 }), withSpring(1, SQUASH_SPRING));
      squashY.value = withSequence(withTiming(1 + 0.05 * amount, { duration: 0 }), withSpring(1, SQUASH_SPRING));
    };
    const contactTimer = setTimeout(() => impact(1.2), T_CONTACT);
    const recontactTimer = setTimeout(() => {
      impact(0.5);
      leftR.value = withSpring(0, LEAN_SPRING);
      rightR.value = withSpring(0, LEAN_SPRING);
    }, T_RECONTACT);

    const entryTimer = setTimeout(() => setEntryDone(true), 1100);

    // Filet de sécurité : si après 8s le splash est toujours visible
    // (Supabase hang, réseau mort…), on force la sortie quand même.
    const bailoutTimer = setTimeout(() => setForceExit(true), 8000);

    return () => {
      clearTimeout(contactTimer);
      clearTimeout(recontactTimer);
      clearTimeout(entryTimer);
      clearTimeout(bailoutTimer);
    };
  }, []);

  // Phase 2 — Lancer le fade-out quand :
  //   (entrée finie ET waitFor prêt) OU forceExit (timeout 8s)
  //
  // Le minuteur de fin vit dans une ref et n'est annulé qu'au démontage. Il était
  // autrefois annulé par le cleanup de cet effet : si `waitFor` passait à true
  // pendant les 300 ms du fondu (typiquement l'auth qui répond pile au moment du
  // bailout de 8 s), l'effet se relançait, annulait le minuteur, puis sortait tout
  // de suite puisque le fondu était déjà lancé. onFinish n'était jamais appelé :
  // splash invisible posé sur l'app, écran entièrement blanc (2026-09-15).
  const hasStartedFadeOut = useRef(false);
  const fadeOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (hasStartedFadeOut.current) return;

    const waitForReady = waitFor === undefined || waitFor;
    const canProceed = (entryDone && waitForReady) || forceExit;
    if (!canProceed) return;

    hasStartedFadeOut.current = true;
    screenOpacity.value = withTiming(0, { duration: 300 });
    fadeOutTimer.current = setTimeout(() => setFadeOutDone(true), 300);
  }, [entryDone, waitFor, forceExit]);

  useEffect(() => () => {
    if (fadeOutTimer.current) clearTimeout(fadeOutTimer.current);
  }, []);

  // Phase 3 — Appeler onFinish une seule fois quand le fade-out est terminé
  const hasCalledFinishRef = useRef(false);
  useEffect(() => {
    if (!fadeOutDone || hasCalledFinishRef.current) return;
    hasCalledFinishRef.current = true;
    onFinishRef.current();
  }, [fadeOutDone]);

  const leftStyle = useEyeStyle(leftX, leftR, squashX, squashY);
  const rightStyle = useEyeStyle(rightX, rightR, squashX, squashY);

  // Fade out global de tout l'écran
  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
      <View style={styles.logo}>
        <Animated.View style={[styles.eye, styles.leftPivot, leftStyle]}>
          <Eye side="left" />
        </Animated.View>
        <Animated.View style={[styles.eye, styles.rightPivot, rightStyle]}>
          <Eye side="right" />
        </Animated.View>
        <Svg style={styles.word} viewBox={LOGO_WORD_VIEWBOX}>
          <Path d={LOGO_WORD_PATH} fill={WORD_COLOR} />
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: SPLASH_LOGO_SIZE,
    height: SPLASH_LOGO_SIZE,
    transform: [{ translateY: LOGO_SHIFT_Y }],
  },
  word: {
    position: 'absolute',
    ...WORD,
    left: (SPLASH_LOGO_SIZE - WORD.width) / 2,
    top: SPLASH_LOGO_SIZE / 2 + WORD_CENTER_Y - LOGO_SHIFT_Y - WORD.height / 2,
  },
  eye: {
    ...StyleSheet.absoluteFillObject,
  },
  // Chaque œil se penche et s'écrase depuis sa base (repère 1200 du SVG)
  leftPivot: { transformOrigin: `${(380 / 12).toFixed(1)}% ${(1000 / 12).toFixed(1)}%` },
  rightPivot: { transformOrigin: `${(900 / 12).toFixed(1)}% ${(930 / 12).toFixed(1)}%` },
});
