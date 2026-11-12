/**
 * La carte de lecture, quand on rejoint une lecture (lien ou code) : il n'y
 * a pas eu d'« Invite tes potes », la carte arrive donc côté livre, se
 * retourne, et ma carte de lecture s'écrit au verso pendant que tout
 * s'enregistre (essai A, Lea, 2026-11-12). En créant, la même fin se joue
 * directement sur la carte d'« Invite tes potes ».
 *
 * Les deux yeux arrivent chacun de leur côté et se retrouvent, comme au
 * splash : « Vous êtes trois ».
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, Keyframe, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
import { ONBOARDING_MAX_W, ONBOARDING_TITLE } from '../../components/onboarding/OnboardingScreen';
import { CardBook, CardPaper, FlipCard, ReadingCardBack, cardRows } from '../../components/onboarding/ReadingCard';
import AccentWord, { accentHeadroom } from '../../components/ui/AccentWord';
import { STAMP_FALL } from '../../components/ui/Stamp';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, motion, spacing } from '../../utils/constants';
import { useFinishOnboarding } from '../../utils/finishOnboarding';

/** La carte arrive, puis se retourne */
const FLIP_AFTER = 800;

const cardIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 90 }, { rotate: '6.5deg' }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { rotate: '0deg' }], easing: Easing.bezier(...motion.easing.easeOutQuart) },
}).duration(600).delay(150);

/** Un œil qui arrive de son côté et rejoint l'autre */
const eyeIn = (from: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateX: from }] },
    40: { opacity: 1 },
    100: { opacity: 1, transform: [{ translateX: 0 }], easing: Easing.bezier(0.2, 0.9, 0.3, 1) },
  }).duration(900).delay(600);

const COUNT = ['', '', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];

export default function CarteScreen() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const firstName = useAuthStore((s) => s.user?.first_name ?? '');
  const book = useOnboardingStore((s) => s.book);
  const invitation = useOnboardingStore((s) => s.invitation);
  const rows = useMemo(() => cardRows(useOnboardingStore.getState()), []);
  const end = useFinishOnboarding(!!book, rows.length, FLIP_AFTER);

  if (!book) return null;

  // Le groupe, moi comprise : « Vous êtes trois »
  const together = COUNT[(invitation?.readers?.length || 1) + 1] ?? 'plein';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.column}>
        <View style={styles.body}>
          <Animated.Text
            entering={reducedMotion ? undefined : FadeIn.duration(400)}
            style={[styles.title, accentHeadroom(ONBOARDING_TITLE)]}
            accessibilityRole="header"
          >
            {invitation ? (
              <AccentWord text={`Vous êtes ${together}`} accent={together} size={ONBOARDING_TITLE} />
            ) : (
              <AccentWord text="Tout est prêt" accent="Tout" size={ONBOARDING_TITLE} />
            )}
          </Animated.Text>

          <View style={styles.cardZone}>
            <View style={styles.meet} pointerEvents="none">
              <Animated.View entering={reducedMotion ? undefined : eyeIn(-220)}>
                <PopEyes variant="left" size="medium" />
              </Animated.View>
              <Animated.View entering={reducedMotion ? undefined : eyeIn(220)}>
                <PopEyes variant="right" size="medium" />
              </Animated.View>
            </View>

            <Animated.View entering={reducedMotion ? undefined : cardIn}>
              <FlipCard
                turned={end.turned}
                front={
                  <CardPaper>
                    <CardBook title={book.title} author={book.author} cover={book.cover} />
                  </CardPaper>
                }
                back={
                  <ReadingCardBack
                    firstName={firstName}
                    book={{ title: book.title, author: book.author, cover: book.cover }}
                    rows={rows}
                    written={end.written}
                    stamped={end.done}
                  />
                }
              />
            </Animated.View>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg }]}>
          {end.failed ? (
            <Animated.View entering={FadeIn.duration(250)} style={styles.failed}>
              <Text style={styles.failedText}>Ça n’a pas marché. Le réseau ?</Text>
              <Button3D variant="secondary" onPress={end.retry} style={styles.wide}>
                Réessayer
              </Button3D>
            </Animated.View>
          ) : end.done ? (
            <Animated.View entering={FadeInDown.duration(350).delay(STAMP_FALL + 250)}>
              <Button3D variant="primary" onPress={end.open} style={styles.wide}>
                Ouvrir le livre
              </Button3D>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
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
    gap: spacing['4xl'],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: ONBOARDING_TITLE,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  cardZone: {
    marginTop: spacing.xl,
  },
  meet: {
    position: 'absolute',
    top: -58,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  footer: {
    paddingHorizontal: spacing.xl,
  },
  failed: {
    gap: spacing.md,
    alignItems: 'center',
  },
  failedText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  wide: {
    width: '100%',
  },
});
