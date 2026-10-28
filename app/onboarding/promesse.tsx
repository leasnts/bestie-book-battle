/**
 * La promesse, avant toute demande (avant la connexion).
 *
 * Les yeux, « Lire ensemble » et un tampon « à deux » qui s'écrase dessus ;
 * dessous, les trois forces de chapi en vignettes qui se relaient seules
 * (lire à deux, annoter, tenir un rythme). On ne demande encore rien.
 *
 * - Commencer → la connexion, puis « Ton rythme ».
 * - J'ai un lien ou un code → le code, puis l'invitation.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
import { ONBOARDING_MAX_W, ONBOARDING_TITLE, rise } from '../../components/onboarding/OnboardingScreen';
import ReaderTrack from '../../components/onboarding/ReaderTrack';
import StickerText from '../../components/onboarding/StickerText';
import AccentWord from '../../components/ui/AccentWord';
import { InkStamp } from '../../components/ui/Stamp';
import StreakPill from '../../components/ui/StreakPill';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { firstStep } from '../../utils/onboardingFlow';
import { borderRadius, colors, fonts, inkAlpha, postIt, spacing } from '../../utils/constants';

/** Une vignette reste le temps d'être vue */
const VIGNETTE = 2600;

export default function PromesseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [vignette, setVignette] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => setVignette((v) => (v + 1) % 3), VIGNETTE);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const start = () => {
    const store = useOnboardingStore.getState();
    store.setIntroSeen();
    store.begin('create');
    // Déjà connecté·e (onboarding rejoué depuis le profil) : pas de connexion
    if (useAuthStore.getState().user) router.push(firstStep('create'));
    else router.push('/auth/login');
  };

  const haveCode = () => {
    const store = useOnboardingStore.getState();
    store.setIntroSeen();
    store.begin('join');
    router.push('/onboarding/code');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.column}>
      <View style={styles.body}>
        <Animated.View entering={rise(0)} style={styles.eyes}>
          <PopEyes vector size="hero" />
          <InkStamp label="à deux" delay={700} angle={-12} style={styles.stamp} />
        </Animated.View>

        <Animated.View entering={rise(1)}>
          <Text style={styles.title} accessibilityRole="header">
            <AccentWord text="Lire ensemble" accent="ensemble" size={ONBOARDING_TITLE} />
          </Text>
        </Animated.View>

        <Animated.View entering={rise(2)} style={styles.vignette}>
          <LinearGradient colors={[colors.white, colors.bgSecondary]} style={[StyleSheet.absoluteFill, styles.vignetteFill]} />
          <Animated.View key={vignette} entering={FadeIn.duration(400).delay(150)} exiting={FadeOut.duration(200)} style={styles.vignetteContent} pointerEvents="none">
            {vignette === 0 && (
              <>
                <Text style={styles.vignetteTitle}>Ta page, sa page</Text>
                <ReaderTrack initial="L" percent={38} />
                <ReaderTrack initial="C" percent={56} other />
              </>
            )}
            {vignette === 1 && (
              <>
                <Text style={styles.vignetteTitle}>Des notes en marge</Text>
                <View style={styles.center}>
                  <StickerText id="promesse-note" text="« Cette phrase, je la garde. »" caption="Chloé · page 112" color={postIt.rose} width={236} height={100} />
                </View>
              </>
            )}
            {vignette === 2 && (
              <>
                <Text style={styles.vignetteTitle}>Un rythme qui tient</Text>
                <View style={styles.center}>
                  <StreakPill days={12} state="active" onPress={() => {}} />
                </View>
              </>
            )}
          </Animated.View>
        </Animated.View>

        <Animated.View entering={rise(3)} style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === vignette && styles.dotOn]} />
          ))}
        </Animated.View>
      </View>

      <Animated.View entering={rise(4)} style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}>
        <Button3D variant="primary" onPress={start} style={styles.wide}>
          Commencer
        </Button3D>
        <Pressable onPress={haveCode} hitSlop={8} accessibilityRole="button" style={styles.link}>
          <Text style={styles.linkText}>J'ai un lien ou un code</Text>
        </Pressable>
      </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: ONBOARDING_MAX_W,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    gap: spacing.xl,
  },
  eyes: {
    alignItems: 'center',
  },
  stamp: {
    right: '18%',
    bottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: ONBOARDING_TITLE,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  vignette: {
    height: 210,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
    overflow: 'hidden',
  },
  vignetteFill: {
    borderRadius: borderRadius.xl,
  },
  vignetteContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  vignetteTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  center: {
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: -spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: inkAlpha(0.15),
  },
  dotOn: {
    width: 16,
    backgroundColor: colors.textPrimary,
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
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
