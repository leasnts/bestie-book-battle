/**
 * L'invitation : ce qu'on rejoint, avant de créer un compte.
 *
 * La couverture au milieu, « On rejoint Chloé ? », puis le
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
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import ReaderTrack from '../../components/onboarding/ReaderTrack';
import { TORN_EDGE_H } from '../../components/onboarding/TornEdge';
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
      <Animated.View entering={rise(2)} style={styles.bottom}>
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
  // Le livre au milieu de la place qui reste
  book: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  // Le cadre ferré en bas : 16 pt au-dessus du bord déchiré du pied
  bottom: {
    marginBottom: spacing.lg + TORN_EDGE_H - spacing.xl,
  },
  coverWrap: {
    marginBottom: spacing.md,
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
