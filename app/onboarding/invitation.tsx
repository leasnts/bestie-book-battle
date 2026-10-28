/**
 * L'invitation : ce qu'on rejoint, avant de créer un compte.
 *
 * La couverture d'abord (les yeux dépassent), « Lire avec Chloé », la piste de
 * Chloé et une place libre pour moi. Rejoindre → la connexion (puis « Ton
 * rythme »), ou directement « Tu en es où ? » si je suis déjà inscrit·e.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import ReaderTrack from '../../components/onboarding/ReaderTrack';
import { COVER_RATIO, CoverImage } from '../../components/ui/BookCover';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, inkAlpha, paperFrameGradient, spacing } from '../../utils/constants';
import { firstStep, nextStep } from '../../utils/onboardingFlow';

const COVER_W = 150;

export default function InvitationScreen() {
  const router = useRouter();
  const invitation = useOnboardingStore((s) => s.invitation);
  const flow = useOnboardingStore((s) => s.flow);
  const signedIn = useAuthStore((s) => !!s.user);

  if (!invitation) return null;
  const name = invitation.adminFirstName;

  const join = () => {
    // Venu·e de « Quel livre ? » (déjà connecté·e) : le rythme est déjà dit
    if (signedIn) router.push(flow === 'join' ? nextStep('join', 'rythme') : firstStep(flow));
    else router.push('/auth/login');
  };

  return (
    <OnboardingScreen
      step="invitation"
      title={`Lire avec ${name}`}
      accent="Lire"
      footer={
        <Button3D variant="primary" onPress={join} style={styles.wide}>
          {`Rejoindre ${name}`}
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)} style={styles.book}>
        <View style={styles.coverWrap}>
          <PopEyes vector size="small" style={styles.peek} />
          {invitation.cover ? (
            <CoverImage uri={invitation.cover} style={styles.cover} />
          ) : (
            <LinearGradient colors={paperFrameGradient} style={[styles.cover, styles.noCover]} />
          )}
        </View>
        <Text style={styles.bookTitle} numberOfLines={2}>{invitation.title}</Text>
        {!!invitation.author && <Text style={styles.author} numberOfLines={1}>{invitation.author}</Text>}
      </Animated.View>

      <Animated.View entering={rise(2)} style={styles.tracks}>
        <ReaderTrack initial={name.charAt(0).toUpperCase()} percent={invitation.groupPercent} other />
        <ReaderTrack percent={0} label="toi" />
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  book: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  coverWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  peek: {
    position: 'absolute',
    top: -34,
    alignSelf: 'center',
  },
  cover: {
    width: COVER_W,
    height: COVER_W / COVER_RATIO,
    transform: [{ rotate: '-2deg' }],
  },
  noCover: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: inkAlpha(0.1),
  },
  bookTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 21,
    lineHeight: 26,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  author: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  tracks: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  wide: {
    width: '100%',
  },
});
