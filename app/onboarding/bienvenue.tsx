/**
 * Bienvenue — juste après la connexion, avant la première question.
 *
 * Sur l'aquarelle de la connexion, une phrase à la fois, qui se remplacent :
 *
 *    Tu choisis un livre.  →  Tes ami·es te rejoignent.  →  Vous en parlez, page par page.
 *
 * puis les yeux et « Bienvenue, Léa · Ici, on lit ensemble. ». Pas de bouton ni
 * de minuteur : l'écran passe tout seul à la première question une fois le temps
 * de lecture passé ; un toucher passe tout de suite.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { BRAND_BG } from '../../components/brand/BrandLockup';
import { ONBOARDING_MAX_W } from '../../components/onboarding/OnboardingScreen';
import PopEyes from '../../components/PopEyes';
import AccentWord from '../../components/ui/AccentWord';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, motion, spacing } from '../../utils/constants';
import { nextStep } from '../../utils/onboardingFlow';

const WASH = require('../../assets/images/watercolor/login-wash.png');

const PHRASES = ['Tu choisis un livre.', 'Tes ami·es te rejoignent.', 'Vous en parlez, page par page.'];

/** Le temps de lire une phrase, puis le bonjour */
const PHRASE_MS = 2100;
const HELLO_MS = 2900;

/** Les yeux en crème, ton sur ton sur l'aquarelle */
const EYES_TINT = [colors.white, '#efe7da'] as const;

const enter = FadeInDown.duration(motion.duration.entrance + 200)
  .easing(Easing.bezier(...motion.easing.easeOutQuart))
  .withInitialValues({ transform: [{ translateY: 18 }] });
const leave = FadeOutUp.duration(motion.duration.slow + 100).withInitialValues({ transform: [{ translateY: 0 }] });

export default function BienvenueScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const firstName = useAuthStore((s) => s.pendingUserData?.firstName ?? s.user?.first_name ?? null);
  // 0, 1, 2 : les phrases ; 3 : le bonjour
  const [step, setStep] = useState(0);
  const done = useRef(false);

  const next = () => {
    if (done.current) return;
    done.current = true;
    router.replace(nextStep(flow, 'bienvenue'));
  };

  useEffect(() => {
    const wait = step < PHRASES.length ? PHRASE_MS : HELLO_MS;
    const timer = setTimeout(() => (step < PHRASES.length ? setStep(step + 1) : next()), wait);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <Pressable style={styles.root} onPress={next} accessibilityRole="button" accessibilityLabel="Passer l’introduction">
      <StatusBar style="light" />
      <LinearGradient colors={BRAND_BG} style={StyleSheet.absoluteFill} />
      <Image source={WASH} style={StyleSheet.absoluteFill} contentFit="cover" />

      <View style={styles.column}>
        {step < PHRASES.length ? (
          <Animated.Text key={step} entering={enter} exiting={leave} style={styles.phrase} accessibilityLiveRegion="polite">
            {PHRASES[step]}
          </Animated.Text>
        ) : (
          <Animated.View entering={enter}>
            <Animated.View entering={FadeIn.duration(motion.duration.entrance)}>
              <PopEyes vector size="large" tint={EYES_TINT} style={styles.eyes} />
            </Animated.View>
            <Text style={styles.hello}>{firstName ? `Bienvenue, ${firstName}` : 'Bienvenue'}</Text>
            <Text style={styles.title} accessibilityRole="header">
              <AccentWord text="Ici, on lit ensemble." accent="ensemble" size={TITLE} />
            </Text>
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

const TITLE = 31;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_BG[1],
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: ONBOARDING_MAX_W,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'] + 4,
    paddingBottom: spacing['6xl'],
  },
  phrase: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: colors.white,
  },
  eyes: {
    marginBottom: spacing['2xl'],
  },
  hello: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.white,
    opacity: 0.85,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: TITLE,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: colors.white,
  },
});
