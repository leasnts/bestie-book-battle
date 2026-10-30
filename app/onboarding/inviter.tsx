/**
 * On invite qui ? Inviter, au milieu du parcours, quand le livre est choisi.
 *
 * La lecture se crée en arrivant ici (il faut son code pour le lien) ; si on
 * revient en arrière changer de livre, elle suit. Le message est un vrai lien
 * (bestie-book-battle://join/…) avec le code en secours. Envoyé : le fil se
 * coud entre moi et la place libre.
 */

import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckIcon, CopyIcon, ShareIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import Svg from 'react-native-svg';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import { COVER_RATIO, CoverImage } from '../../components/ui/BookCover';
import GlassButton from '../../components/ui/GlassButton';
import { Seam } from '../../components/ui/GoalTrack';
import { StitchBorder } from '../../components/ui/Stitch';
import { createReading, deadlineFrom, ensureProfile, updateReadingBook } from '../../services/onboarding';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useProjectStore } from '../../stores/projectStore';
import {
  accentGradient,
  borderRadius,
  colors,
  fonts,
  inkAlpha,
  inkGradient,
  lowki,
  paperFrameGradient,
  spacing,
} from '../../utils/constants';
import { feel } from '../../utils/feel';
import { nextStep } from '../../utils/onboardingFlow';
import { inviteLink, inviteMessage } from '../../utils/share';

const COVER_W = 84;
const DISC = 40;

export default function InviterScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { flow, book, createdChallengeId, invited, patch } = store;
  const firstName = useAuthStore((s) => s.user?.first_name ?? s.pendingUserData?.firstName ?? '');
  const challenge = useProjectStore((s) => s.challenges.find((c) => c.id === createdChallengeId) ?? null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  /** La lecture existe, et porte le livre choisi */
  const ensureReading = useCallback(async () => {
    if (!book) return;
    setFailed(false);
    try {
      const userId = await ensureProfile();
      const { dated, days } = useOnboardingStore.getState();
      const end = deadlineFrom(dated, days);
      if (!createdChallengeId) {
        const created = await createReading(userId, book, end);
        patch({ createdChallengeId: created.id });
      } else if (challenge && (challenge.book_title !== book.title || challenge.total_pages !== book.pages)) {
        await updateReadingBook(createdChallengeId, book);
      }
    } catch (error) {
      console.error('Création de la lecture :', error);
      setFailed(true);
    }
  }, [book, createdChallengeId, challenge, patch]);

  useEffect(() => {
    ensureReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!book) return null;
  const code = challenge?.invite_code ?? null;

  const share = async () => {
    if (!code) return;
    try {
      const result = await Share.share({ message: inviteMessage(book.title, code) });
      if (result.action === Share.sharedAction) {
        feel('inviter');
        patch({ invited: true });
      }
    } catch {
      // Annulé
    }
  };

  const copy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(inviteLink(code));
    feel('tic');
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <OnboardingScreen
      step="inviter"
      title="On invite qui ?"
      accent="qui"
      footer={
        invited ? (
          <Button3D variant="primary" onPress={() => router.push(nextStep(flow, 'inviter'))} style={styles.wide}>
            Continuer
          </Button3D>
        ) : (
          <>
            <Button3D variant="primary" icon={ShareIcon} iconPosition="left" disabled={!code} onPress={share} style={styles.wide}>
              Envoyer le lien
            </Button3D>
            <View style={styles.row}>
              <GlassButton icon={CopyIcon} onPress={copy} accessibilityLabel="Copier le lien" />
              <View style={styles.fill}>
                <Button3D variant="secondary" onPress={() => router.push(nextStep(flow, 'inviter'))} style={styles.wide}>
                  Plus tard
                </Button3D>
              </View>
            </View>
          </>
        )
      }
    >
      <Animated.View entering={rise(1)} style={styles.bubble}>
        <LinearGradient colors={paperFrameGradient} style={styles.art}>
          {book.cover ? (
            <CoverImage uri={book.cover} style={styles.cover} />
          ) : (
            <LinearGradient colors={[colors.white, colors.bgSecondary]} style={[styles.cover, styles.noCover]} />
          )}
        </LinearGradient>
        <View style={styles.bubbleText}>
          <Text style={styles.bubbleTitle} numberOfLines={2}>{`Lis ${book.title} avec moi`}</Text>
          {code ? (
            <Animated.Text entering={FadeIn.duration(200)} style={styles.link} numberOfLines={1}>
              {copied ? 'Lien copié' : `chapi · code ${code}`}
            </Animated.Text>
          ) : failed ? (
            <Text style={styles.link} onPress={ensureReading} accessibilityRole="button">
              Pas de réseau ? Toucher pour réessayer
            </Text>
          ) : (
            <View style={styles.skeleton} />
          )}
        </View>
      </Animated.View>

      <Animated.View entering={rise(2)}>
        <Pair me={firstName.charAt(0).toUpperCase() || 'M'} sewn={invited} />
      </Animated.View>
    </OnboardingScreen>
  );
}

/** Moi, le fil, la place libre : envoyé, le fil se coud point par point et la place se remplit */
function Pair({ me, sewn }: { me: string; sewn: boolean }) {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [read, setRead] = useState(sewn ? 1 : 0);

  useEffect(() => {
    if (!sewn || read >= 1) return;
    if (reducedMotion) {
      setRead(1);
      return;
    }
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setRead(step / SEW_STEPS);
      if (step >= SEW_STEPS) clearInterval(timer);
    }, SEW_MS / SEW_STEPS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sewn, reducedMotion]);

  return (
    <View style={styles.pair}>
      <View style={styles.disc}>
        <LinearGradient colors={inkGradient} style={StyleSheet.absoluteFill} />
        <Text style={styles.discText}>{me}</Text>
      </View>
      <View style={styles.fill} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={8}>
            <Seam width={width} readUntil={width * read} y={4} />
          </Svg>
        )}
      </View>
      <View style={styles.disc}>
        {read >= 1 ? (
          <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}>
            <LinearGradient colors={accentGradient} style={[StyleSheet.absoluteFill, styles.center]}>
              <CheckIcon size={18} color={lowki.butter.light} strokeWidth={2.5} />
            </LinearGradient>
          </Animated.View>
        ) : (
          <>
            <StitchBorder radius={DISC / 2} inset={0} />
            <Text style={styles.ghost}>?</Text>
          </>
        )}
      </View>
    </View>
  );
}

/** Le fil se coud en 700 ms, en 14 points */
const SEW_MS = 700;
const SEW_STEPS = 14;

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    alignSelf: 'flex-end',
    width: 280,
    borderRadius: 22,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.1),
  },
  art: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  cover: {
    width: COVER_W,
    height: COVER_W / COVER_RATIO,
  },
  noCover: {
    borderRadius: 2,
  },
  bubbleText: {
    padding: spacing.lg,
    gap: 2,
  },
  bubbleTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  link: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },
  skeleton: {
    height: 12,
    width: 140,
    marginTop: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: inkAlpha(0.06),
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discText: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: colors.white,
  },
  ghost: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: colors.textPlaceholder,
  },
});
