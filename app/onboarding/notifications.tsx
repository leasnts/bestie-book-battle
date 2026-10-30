/**
 * Les notifs — après la carte de lecture, sur le seuil de l'accueil : l'onboarding
 * est fini, cet écran n'est pas dans le fil de progression.
 *
 * Sur l'aquarelle rouge de la bienvenue, un titre court et les deux
 * notifications qu'elle recevra, qui descendent du haut comme les vraies. Un
 * seul gros bouton, à toucher par réflexe ; « Plus tard » discret. Pas de
 * justification (Lea, 2026-10-30). La fenêtre d'iOS ne s'affiche qu'après le
 * bouton : elle ne s'affiche qu'une fois, on ne la gaspille pas.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_BG } from '../../components/brand/BrandLockup';
import Button3D from '../../components/Button3D';
import { ONBOARDING_MAX_W } from '../../components/onboarding/OnboardingScreen';
import AccentWord from '../../components/ui/AccentWord';
import { requestNotificationPermission, scheduleEveningReminder } from '../../services/notifications';
import { reminderTime } from '../../services/onboarding';
import { bookFormat, useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, inkAlpha, motion, shadowAlpha, spacing } from '../../utils/constants';

const APP_ICON = require('../../assets/images/app_icon.png');
const WASH = require('../../assets/images/watercolor/login-wash.png');

/** Une notification qui descend du haut, après `delay` ms */
const drop = (delay: number) =>
  FadeInDown.duration(500).delay(delay).easing(Easing.bezier(...motion.easing.easeOutQuart));

export default function NotificationsScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { moments, start, book, invitation } = store;
  const [asking, setAsking] = useState(false);

  const percent = bookFormat(store) !== 'papier';
  // Une soirée de lecture, pour l'exemple
  const step = percent ? 4 : 20;
  const goal = percent
    ? `${start} % → ${Math.min(100, start + step)} % ?`
    : `Page ${start} → ${Math.min(book?.pages ?? start + step, start + step)} ?`;
  const other = invitation
    ? { title: `${invitation.adminFirstName} vient d’annoter`, body: invitation.title }
    : { title: 'Quelqu’un a rejoint ta lecture', body: book?.title ?? '' };

  /** L'accueil ; le brouillon de l'onboarding n'a plus lieu d'être */
  const home = () => {
    useOnboardingStore.getState().reset();
    router.replace('/(tabs)');
  };

  const ask = async () => {
    setAsking(true);
    try {
      if (await requestNotificationPermission()) await scheduleEveningReminder(reminderTime(moments));
    } finally {
      home();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={BRAND_BG} style={StyleSheet.absoluteFill} />
      <Image source={WASH} style={StyleSheet.absoluteFill} contentFit="cover" />

      <SafeAreaView style={styles.column} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.heading} accessibilityRole="header">
            <AccentWord text="Ne rate rien" accent="rien" size={TITLE} />
          </Text>
          <View style={styles.stack}>
            <Animated.View entering={drop(300)}>
              <Notification time="maintenant" title={other.title} body={other.body} />
            </Animated.View>
            <Animated.View entering={drop(750)}>
              <Notification time={reminderTime(moments)} title="Ton moment lecture" body={goal} />
            </Animated.View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button3D variant="secondary" loading={asking} onPress={ask} style={styles.wide}>
            Activer les notifs
          </Button3D>
          <Pressable onPress={home} disabled={asking} hitSlop={12} accessibilityRole="button">
            <Text style={styles.later}>Plus tard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Une notification de l'écran verrouillé, en papier */
function Notification({ time, title, body }: { time: string; title: string; body: string }) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${title}. ${body}`}>
      <Image source={APP_ICON} style={styles.icon} />
      <View style={styles.text}>
        <View style={styles.head}>
          <Text style={styles.app}>chapi</Text>
          <Text style={styles.app}>{time}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.body} numberOfLines={1}>{body}</Text>
      </View>
    </View>
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
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing['2xl'],
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: TITLE,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: colors.white,
  },
  stack: {
    gap: spacing.md,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  wide: {
    width: '100%',
  },
  later: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.white,
    opacity: 0.8,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md + 2,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
    shadowColor: shadowAlpha(1),
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 9,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  app: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textTertiary,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
