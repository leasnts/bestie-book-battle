/**
 * L'invitation : ce qu'on rejoint, avant de créer un compte.
 *
 * La couverture d'abord (les yeux dépassent), « On rejoint Chloé ? », puis le
 * cadre de la Progression : celles qui lisent déjà (photo, piste, %) et ma
 * place, encore à 0 %. Rejoindre → la connexion (puis « Ton
 * rythme »), ou directement « Où en est ta lecture ? » si je suis déjà inscrit·e.
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
import GlassSection from '../../components/ui/GlassSection';
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
    // Venu·e de « Par où on commence ? » (déjà connecté·e) : le rythme est déjà dit
    if (signedIn) router.push(flow === 'join' ? nextStep('join', 'formats') : firstStep(flow));
    else router.push('/auth/login');
  };

  return (
    <OnboardingScreen
      step="invitation"
      title={`On rejoint ${name} ?`}
      accent="rejoint"
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

      {/* Comme la Progression de l'accueil : celles qui lisent déjà, puis ma place, encore à 0 */}
      <Animated.View entering={rise(2)}>
        <GlassSection>
          <View style={styles.tracks}>
            {(invitation.readers?.length ? invitation.readers : [{ name, photoUrl: null, percent: invitation.groupPercent }]).map((reader, i) => (
              <ReaderTrack key={i} name={reader.name} photoUrl={reader.photoUrl} percent={reader.percent} />
            ))}
            <ReaderTrack percent={0} free />
          </View>
        </GlassSection>
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
    gap: spacing.xs,
  },
  wide: {
    width: '100%',
  },
});
