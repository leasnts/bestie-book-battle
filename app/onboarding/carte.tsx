/**
 * La carte de lecture : le moment fort de la fin (idée reprise de la carte de
 * Basta, en version bibliothèque).
 *
 * Tout ce qu'elle vient de dire devient un objet à son prénom : le livre, le
 * format, où elle en est, ses moments, la date de fin, avec qui.
 * La carte glisse et se pose de travers, puis le tampon du jour s'écrase
 * (feel('bienvenue')). Les yeux dépassent derrière ; en rejoignant, les deux
 * yeux arrivent chacun de leur côté et se retrouvent, comme au splash.
 */

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
import { MOMENTS } from '../../components/onboarding/choices';
import { ONBOARDING_MAX_W, ONBOARDING_TITLE } from '../../components/onboarding/OnboardingScreen';
import AccentWord from '../../components/ui/AccentWord';
import { COVER_RATIO, CoverImage } from '../../components/ui/BookCover';
import { InkStamp, STAMP_FALL } from '../../components/ui/Stamp';
import { deadlineFrom } from '../../services/onboarding';
import { useAuthStore } from '../../stores/authStore';
import { bookFormat, useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, inkAlpha, lowki, motion, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';

/** Le tampon tombe une fois la carte posée */
const STAMP_AT = 1050;
const THUMB_W = 64;

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

export default function CarteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const store = useOnboardingStore();
  const firstName = useAuthStore((s) => s.user?.first_name ?? '');
  const { book, invitation, start, dated, days, moments, invited, flow } = store;
  const format = bookFormat(store);
  const percent = format !== 'papier';

  useEffect(() => {
    const timer = setTimeout(() => feel('bienvenue'), reducedMotion ? 0 : STAMP_AT + STAMP_FALL);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  const rows = useMemo(() => {
    if (!book) return [];
    const end = deadlineFrom(dated, days);
    const list: [string, string][] = [
      ['Livre', book.title],
      ['Format', format === 'papier' ? ['Papier', book.publisher].filter(Boolean).join(' · ') : `${format === 'liseuse' ? 'Liseuse' : 'Audio'} · en %`],
      ['Où', percent ? `${start} %` : `p. ${start} / ${book.pages}`],
    ];
    if (flow === 'create' || flow === 'join') {
      list.push(['Quand', MOMENTS.filter((m) => moments.includes(m.key)).map((m) => m.label).join(', ') || '—']);
    }
    if (!invitation) list.push(['Fin', end ? new Date(`${end}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'Sans date']);
    if (invitation) list.push(['Avec', `${invitation.adminFirstName} · ${Math.round(invitation.groupPercent)} %`]);
    else if (invited) list.push(['Avec', 'invitation envoyée']);
    return list;
  }, [book, invitation, start, dated, days, moments, invited, flow, format, percent]);

  if (!book) return null;

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const open = async () => {
    feel('appui');
    // Première fois : les notifications, sur le seuil de l'accueil (si iOS n'a pas déjà sa réponse)
    if (flow === 'create' || flow === 'join') {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'undetermined') return router.replace('/onboarding/notifications');
    }
    useOnboardingStore.getState().reset();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.column}>
      <View style={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          {invitation ? (
            <AccentWord text="Vous êtes deux" accent="deux" size={ONBOARDING_TITLE} />
          ) : (
            <AccentWord text="Tout est prêt" accent="Tout" size={ONBOARDING_TITLE} />
          )}
        </Text>

        <View style={styles.cardZone}>
          {invitation ? (
            <View style={styles.meet} pointerEvents="none">
              <Animated.View entering={reducedMotion ? undefined : eyeIn(-220)}>
                <PopEyes variant="left" size="medium" />
              </Animated.View>
              <Animated.View entering={reducedMotion ? undefined : eyeIn(220)}>
                <PopEyes variant="right" size="medium" />
              </Animated.View>
            </View>
          ) : (
            <PopEyes vector size="large" style={styles.peek} />
          )}

          <View style={styles.tilt}>
          <Animated.View entering={reducedMotion ? undefined : cardIn} style={styles.card}>
            <View style={styles.hole} />
            <View style={styles.head}>
              <Text style={styles.headText}>Carte de lecture</Text>
              <Text style={styles.headText} numberOfLines={1}>{firstName}</Text>
            </View>
            <View style={styles.cardBody}>
              {book.cover ? <CoverImage uri={book.cover} style={styles.thumb} /> : null}
              <View style={styles.rows}>
                {rows.map(([label, value]) => (
                  <View key={label} style={styles.row}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.value} numberOfLines={1}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
            <InkStamp label={today} delay={STAMP_AT} angle={-9} style={styles.stamp} />
          </Animated.View>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg }]}>
        <Button3D variant="primary" onPress={open} style={styles.wide}>
          Ouvrir le livre
        </Button3D>
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
  peek: {
    position: 'absolute',
    top: -50,
    right: spacing['3xl'],
  },
  meet: {
    position: 'absolute',
    top: -58,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  card: {
    padding: spacing.lg,
    paddingTop: spacing.xl + 2,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.1),
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
  },
  /** La carte posée de travers ; son entrée part de là */
  tilt: {
    transform: [{ rotate: '-1.5deg' }],
  },
  hole: {
    position: 'absolute',
    top: 9,
    alignSelf: 'center',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: inkAlpha(0.12),
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: lowki.red.light,
  },
  headText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: lowki.red.dark,
  },
  cardBody: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  thumb: {
    width: THUMB_W,
    height: THUMB_W / COVER_RATIO,
    transform: [{ rotate: '2deg' }],
  },
  rows: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  stamp: {
    right: spacing.md,
    bottom: -16,
  },
  footer: {
    paddingHorizontal: spacing.xl,
  },
  wide: {
    width: '100%',
  },
});
