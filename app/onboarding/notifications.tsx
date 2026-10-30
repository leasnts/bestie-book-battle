/**
 * Un petit rappel ? Montrer la notification avant de la demander.
 *
 * Les deux notifications qu'elle recevra descendent du haut, comme les vraies :
 * son moment lecture, à SON heure (déduite de ses moments), et l'autre qui
 * avance. La fenêtre d'iOS ne s'affiche qu'après « Me prévenir » : elle ne
 * s'affiche qu'une fois, on ne la gaspille pas.
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen from '../../components/onboarding/OnboardingScreen';
import { requestNotificationPermission } from '../../services/notifications';
import { reminderTime } from '../../services/onboarding';
import { bookFormat, useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, inkAlpha, motion, shadowAlpha, spacing } from '../../utils/constants';
import { nextStep } from '../../utils/onboardingFlow';

const APP_ICON = require('../../assets/images/app_icon.png');

/** Une notification qui descend du haut, après `delay` ms */
const drop = (delay: number) =>
  FadeInDown.duration(500).delay(delay).easing(Easing.bezier(...motion.easing.easeOutQuart));

export default function NotificationsScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { flow, moments, start, book, invitation } = store;
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

  const next = () => router.push(nextStep(flow, 'notifications'));

  const ask = async () => {
    setAsking(true);
    try {
      await requestNotificationPermission();
    } finally {
      setAsking(false);
      next();
    }
  };

  return (
    <OnboardingScreen
      step="notifications"
      title="Un petit rappel ?"
      accent="rappel"
      footer={
        <>
          <Button3D variant="primary" loading={asking} onPress={ask} style={styles.wide}>
            Me prévenir
          </Button3D>
          <Button3D variant="secondary" disabled={asking} onPress={next} style={styles.wide}>
            Plus tard
          </Button3D>
        </>
      }
    >
      <View style={styles.stack}>
        <Animated.View entering={drop(250)}>
          <Notification time={reminderTime(moments)} title="Ton moment lecture" body={goal} />
        </Animated.View>
        <Animated.View entering={drop(700)}>
          <Notification time="maintenant" title={other.title} body={other.body} />
        </Animated.View>
      </View>
    </OnboardingScreen>
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

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  stack: {
    gap: spacing.md,
    marginTop: spacing.sm,
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
