/**
 * Splash Screen Animé — « Ils se retrouvent »
 *
 * Animation (≈ 1,5 s), sans rebond :
 * 1. Le fond rouge seul. C'est exactement l'image du splash natif
 *    (SplashScreen.storyboard), affichée pendant le chargement : relais invisible.
 * 2. Les deux yeux arrivent chacun de son bord, comme deux potes qui se croisent
 *    dans la rue, ralentissent et se collent. « Lowki » apparaît en fondu au
 *    moment où ils se rejoignent.
 * 3. Le petit œil fait un clin d'œil.
 * 4. Fade out global → l'app.
 *
 * Variante choisie par Lea dans le labo HTML le 2026-10-05.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import {
  LOGO_EYES_CLIP,
  LOGO_EYES_PATH,
  LOGO_EYES_VIEWBOX,
  LOGO_WORD_PATH,
  LOGO_WORD_RATIO,
  LOGO_WORD_VIEWBOX,
} from './brand/logoEyesPath';

/** Côté du carré du logo, en points. */
const SPLASH_LOGO_SIZE = 220;

/**
 * Ton sur ton, comme les visuels officiels de Lea (« lowki_red ») : fond rouge,
 * logo d'un rouge plus profond, et un liseré clair d'1 pt sous chaque forme pour
 * l'effet gravé dans le papier. Dégradés partout (jamais d'aplat), sauf le mot.
 */
const SPLASH_BG = ['#a3232b', '#8f1c24'] as const;
const SHAPE_GRADIENT = ['#6c1419', '#561115'] as const;
const SHAPE_WORD = '#5f1216';
const DEBOSS_LIGHT = '#c0454c';
const DEBOSS_OPACITY = 0.55;
/** Décalage du liseré, 1 pt, dans le repère 1200 des yeux et celui de la police. */
const DEBOSS_EYES = 5.5;
const DEBOSS_WORD = 32;

// Les yeux arrivent en 900 ms en ralentissant, se posent, puis le clin d'œil.
const T_MEET = 900;
const T_WINK = T_MEET + 180;
/** « Lowki » se dévoile quand les yeux se touchent (l'arrivée ralentie les colle visuellement vers 550 ms). */
const T_WORD = 550;
const WORD_FADE = 450;
const MEET_EASING = Easing.out(Easing.poly(5));
/** Le clin d'œil se ferme de haut en bas, comme une paupière : vers le bas du petit œil (y = 920 sur 1200). */
const WINK_PIVOT_Y = (920 / LOGO_EYES_VIEWBOX) * SPLASH_LOGO_SIZE;

/**
 * « Lowki » sous les yeux, en tracé (pas en <Text> : la police n'est pas encore
 * chargée). Les yeux remontés de 34 pt, le mot centré 83 pt sous le centre de
 * l'écran, pour centrer l'ensemble yeux + mot.
 */
const WORD_HEIGHT = 51.5;
// Le cadre du mot descend de 2 pt (64 unités) pour laisser la place au liseré
const WORD = { width: WORD_HEIGHT * LOGO_WORD_RATIO, height: WORD_HEIGHT + 2 };
const WORD_VIEWBOX = LOGO_WORD_VIEWBOX.replace(/ 1643$/, ' 1707');
const LOGO_SHIFT_Y = -34;
const WORD_CENTER_Y = 83;

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
          <Stop offset="0" stopColor={SHAPE_GRADIENT[0]} />
          <Stop offset="1" stopColor={SHAPE_GRADIENT[1]} />
        </SvgGradient>
        <ClipPath id="cut">
          <Path d={LOGO_EYES_CLIP[side]} />
        </ClipPath>
      </Defs>
      <G transform={`translate(0 ${DEBOSS_EYES})`}>
        <Path d={LOGO_EYES_PATH} fill={DEBOSS_LIGHT} fillOpacity={DEBOSS_OPACITY} clipPath="url(#cut)" />
      </G>
      <Path d={LOGO_EYES_PATH} fill="url(#eyes)" clipPath="url(#cut)" />
    </Svg>
  );
}

export default function AnimatedSplash({ onFinish, waitFor }: AnimatedSplashProps) {
  // Au départ, chaque œil est poussé d'une largeur d'écran : hors champ.
  const { width: screenWidth } = useWindowDimensions();
  const leftX = useSharedValue(-screenWidth);
  const rightX = useSharedValue(screenWidth);
  const winkY = useSharedValue(1);
  const wordOpacity = useSharedValue(0);

  const screenOpacity = useSharedValue(1);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const [entryDone, setEntryDone] = useState(false);
  const [fadeOutDone, setFadeOutDone] = useState(false);
  const [forceExit, setForceExit] = useState(false);

  // Phase 1 — Animation d'entrée. Pas de fade-out ici.
  // useLayoutEffect : l'animation part dans la même image que le premier affichage.
  useLayoutEffect(() => {
    const meet = { duration: T_MEET, easing: MEET_EASING };
    leftX.value = withTiming(0, meet);
    rightX.value = withTiming(0, meet);

    wordOpacity.value = withDelay(T_WORD, withTiming(1, { duration: WORD_FADE, easing: Easing.inOut(Easing.quad) }));

    // Clin d'œil : la paupière du petit œil descend, une fraction de seconde, remonte
    winkY.value = withDelay(
      T_WINK,
      withSequence(
        withTiming(0.1, { duration: 110, easing: Easing.in(Easing.quad) }),
        withDelay(70, withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) })),
      ),
    );

    const entryTimer = setTimeout(() => setEntryDone(true), T_WINK + 500);

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

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftX.value }],
  }));
  // scaleY s'écrase autour du centre de la vue : on recale pour que le bas du
  // petit œil reste fixe (transformOrigin n'était pas appliqué, l'œil se fermait
  // vers le haut).
  const rightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rightX.value },
      { translateY: (WINK_PIVOT_Y - SPLASH_LOGO_SIZE / 2) * (1 - winkY.value) },
      { scaleY: winkY.value },
    ],
  }));

  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value }));

  // Fade out global de tout l'écran
  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <LinearGradient colors={SPLASH_BG} style={StyleSheet.absoluteFill} />
      <View style={styles.logo}>
        <Animated.View style={[styles.eye, leftStyle]}>
          <Eye side="left" />
        </Animated.View>
        <Animated.View style={[styles.eye, rightStyle]}>
          <Eye side="right" />
        </Animated.View>
        <Animated.View style={[styles.word, wordStyle]}>
          <Svg width="100%" height="100%" viewBox={WORD_VIEWBOX}>
            <G transform={`translate(0 ${DEBOSS_WORD})`}>
              <Path d={LOGO_WORD_PATH} fill={DEBOSS_LIGHT} fillOpacity={DEBOSS_OPACITY} />
            </G>
            <Path d={LOGO_WORD_PATH} fill={SHAPE_WORD} />
          </Svg>
        </Animated.View>
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
  eye: {
    ...StyleSheet.absoluteFillObject,
  },
  word: {
    position: 'absolute',
    ...WORD,
    left: (SPLASH_LOGO_SIZE - WORD.width) / 2,
    top: SPLASH_LOGO_SIZE / 2 + WORD_CENTER_Y - LOGO_SHIFT_Y - WORD.height / 2,
  },
});
