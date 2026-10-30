/**
 * Les notifs — après la carte de lecture, sur le seuil de l'accueil : l'onboarding
 * est fini, cet écran n'est pas dans le fil de progression.
 *
 * Sur l'aquarelle rouge de la bienvenue, un titre court et le haut d'un vrai
 * iPhone 17 Pro verrouillé, en image : deux notifications de chapi (une amie
 * qui annote, le moment lecture). L'image est rendue depuis
 * store-screenshots (téléphone du moteur, écran verrouillé en HTML, police SF). Un
 * seul gros bouton, à toucher par réflexe ; « Plus tard » discret. Une ligne
 * chaleureuse dit pourquoi, sans se justifier (Lea, 2026-10-30). La fenêtre d'iOS ne s'affiche qu'après le
 * bouton : elle ne s'affiche qu'une fois, on ne la gaspille pas.
 */

import MaskedView from '../../components/ui/MaskedView';
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
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, motion, spacing } from '../../utils/constants';

const LOCK_SCREEN = require('../../assets/images/onboarding/lock-screen.png');
const WASH = require('../../assets/images/watercolor/login-wash.png');

/** Une notification qui descend du haut, après `delay` ms */
const drop = (delay: number) =>
  FadeInDown.duration(500).delay(delay).easing(Easing.bezier(...motion.easing.easeOutQuart));

export default function NotificationsScreen() {
  const router = useRouter();
  const moments = useOnboardingStore((s) => s.moments);
  const [asking, setAsking] = useState(false);

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
          <View style={styles.head}>
            <Text style={styles.heading} accessibilityRole="header">
              <AccentWord text="On te fait signe ?" accent="signe" size={TITLE} />
            </Text>
            <Text style={styles.sub}>Quand tes potes annotent, et pour ton moment lecture</Text>
          </View>
          {/* Le haut d'un iPhone verrouillé, en image (assets/images/onboarding/lock-screen.png) ; il s'efface avant le bouton */}
          <Animated.View entering={drop(250)} style={styles.phone}>
            <MaskedView
              style={styles.lock}
              maskElement={<LinearGradient colors={['#000', '#000', 'transparent']} locations={[0, 0.5, 0.95]} style={StyleSheet.absoluteFill} />}
            >
              <Image source={LOCK_SCREEN} style={styles.lock} contentFit="cover" contentPosition="top" accessible accessibilityLabel="Un iPhone verrouillé : Lou vient d’annoter p. 112, et ton moment lecture" />
            </MaskedView>
          </Animated.View>
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

const TITLE = 31;
/** Ce que le téléphone glisse sous le pied */
const UNDER_FOOTER = 90;
/** L'image : le haut du téléphone, 1266 × 2000 */
const LOCK_RATIO = 1266 / 2000;

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
    paddingTop: spacing['3xl'],
    gap: spacing['2xl'],
  },
  head: {
    gap: spacing.sm,
  },
  sub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
    opacity: 0.85,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: TITLE,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: colors.white,
  },
  // Le téléphone passe sous le bouton et s'efface dans l'aquarelle avant lui
  phone: {
    flex: 1,
    marginBottom: -UNDER_FOOTER,
    overflow: 'hidden',
  },
  lock: {
    width: '100%',
    aspectRatio: LOCK_RATIO,
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
});
