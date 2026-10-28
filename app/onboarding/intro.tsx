/**
 * Ouverture : le problème, et ce que chapi y fait, en un seul écran (Lea,
 * 2026-10-28 : l'ouverture et la promesse fusionnées).
 *
 * Trois volets défilent seuls, en plein écran aux couleurs Lowki : rouge (dans
 * la continuité du splash), chocolat, beige. Chacun pose un problème de
 * lectrice et montre la fonctionnalité qui y répond :
 * - décrocher au chapitre 3 → ta page, sa page ;
 * - personne à qui en parler → des notes en marge ;
 * - « je m'y remets demain » → une série qui tient.
 * Toucher le volet passe au suivant ; le pied reste : Commencer, ou J'ai un
 * lien ou un code. Ne se montre d'office qu'une fois (rejouable du profil).
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
import { ONBOARDING_MAX_W, ONBOARDING_TITLE } from '../../components/onboarding/OnboardingScreen';
import ReaderTrack from '../../components/onboarding/ReaderTrack';
import StickerText from '../../components/onboarding/StickerText';
import AccentWord from '../../components/ui/AccentWord';
import StreakPill from '../../components/ui/StreakPill';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { borderRadius, colors, fonts, inkAlpha, lowki, motion, postIt, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { firstStep } from '../../utils/onboardingFlow';

const SLIDES = [
  { text: 'Lire à deux, et décrocher au chapitre 3 ?', accent: 'décrocher', feature: 'Ta page, sa page', pair: lowki.red, ink: lowki.butter.light, eyes: [lowki.red.dark, lowki.red.deep] },
  { text: 'Un livre génial, et personne à qui en parler ?', accent: 'parler', feature: 'Des notes en marge', pair: lowki.chocolate, ink: lowki.butter.light, eyes: [lowki.chocolate.dark, colors.dark950] },
  { text: 'Toujours « je m’y remets demain » ?', accent: 'demain', feature: 'Une série qui tient', pair: lowki.beige, ink: colors.dark900, eyes: [lowki.beige.dark, colors.textTertiary] },
] as const;

/** Le temps de lire un volet */
const DWELL = 3400;

const textIn = FadeInDown.duration(450).delay(120).easing(Easing.bezier(...motion.easing.easeOutQuart));

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const next = () => setIndex((i) => (i + 1) % SLIDES.length);

  // Défilement seul, en boucle ; un toucher passe au suivant et relance le compte
  useEffect(() => {
    const timer = setTimeout(next, DWELL);
    return () => clearTimeout(timer);
  }, [index]);

  const start = () => {
    const store = useOnboardingStore.getState();
    store.setIntroSeen();
    store.begin('create');
    // Déjà connecté·e (onboarding rejoué depuis le profil) : pas de connexion
    if (useAuthStore.getState().user) router.push(firstStep('create'));
    else router.push('/auth/login');
  };

  const haveCode = () => {
    feel('tic');
    const store = useOnboardingStore.getState();
    store.setIntroSeen();
    store.begin('join');
    router.push('/onboarding/code');
  };

  return (
    <View style={styles.root}>
      {SLIDES.map((s, i) => (
        <Backdrop key={i} colors={[s.pair.light, s.pair.dark]} visible={i === index} />
      ))}

      <SafeAreaView style={styles.column} edges={['top']}>
        <Pressable style={styles.slide} onPress={next} accessibilityRole="button" accessibilityHint="Volet suivant">
          <View style={styles.eyes}>
            {/* Ton sur ton : les yeux dans le foncé de la couleur du volet */}
            <PopEyes vector size="medium" tint={slide.eyes} />
          </View>

          <View style={styles.textZone}>
            <Animated.Text
              key={`t${index}`}
              entering={textIn}
              exiting={FadeOutUp.duration(250)}
              style={[styles.problem, { color: slide.ink }]}
              accessibilityLiveRegion="polite"
            >
              <AccentWord text={slide.text} accent={slide.accent} size={ONBOARDING_TITLE} />
            </Animated.Text>
          </View>

          {/* La réponse de chapi : la fonctionnalité, sur une carte de papier */}
          <Animated.View
            key={`f${index}`}
            entering={FadeIn.duration(400).delay(350)}
            exiting={FadeOut.duration(200)}
            style={styles.feature}
            pointerEvents="none"
          >
            <Text style={[styles.featureName, { color: slide.ink }]}>{slide.feature}</Text>
            <View style={styles.card}>
              <Feature index={index} />
            </View>
          </Animated.View>

          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: slide.ink, opacity: i === index ? 1 : 0.35 }, i === index && styles.dotOn]}
              />
            ))}
          </View>
        </Pressable>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}>
          <Button3D variant="secondary" onPress={start} style={styles.wide}>
            Commencer
          </Button3D>
          <Pressable onPress={haveCode} hitSlop={8} accessibilityRole="button" style={styles.link}>
            <Text style={[styles.linkText, { color: slide.ink }]}>J'ai un lien ou un code</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Ce que chapi montre pour chaque problème */
function Feature({ index }: { index: number }) {
  if (index === 0) {
    return (
      <View style={styles.tracks}>
        <ReaderTrack initial="L" percent={38} />
        <ReaderTrack initial="C" percent={56} other />
      </View>
    );
  }
  if (index === 1) {
    return (
      <View style={styles.center}>
        <StickerText id="intro-note" text="« Cette phrase, je la garde. »" caption="Chloé · page 112" color={postIt.rose} width={236} height={100} />
      </View>
    );
  }
  return (
    <View style={styles.center}>
      <StreakPill days={12} state="active" onPress={() => {}} />
    </View>
  );
}

/** Un fond en dégradé qui se fond dans le suivant (600 ms) */
function Backdrop({ colors: pair, visible }: { colors: readonly [string, string]; visible: boolean }) {
  const opacity = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 600, easing: Easing.bezier(...motion.easing.easeOutQuart) });
  }, [visible, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient colors={pair} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: lowki.red.dark,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: ONBOARDING_MAX_W,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  eyes: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  textZone: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  problem: {
    fontFamily: fonts.display,
    fontSize: ONBOARDING_TITLE,
    lineHeight: 36,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  feature: {
    gap: spacing.md,
  },
  featureName: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  card: {
    height: 150,
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  tracks: {
    gap: spacing.lg,
  },
  center: {
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xl,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOn: {
    width: 16,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  wide: {
    width: '100%',
  },
  link: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
