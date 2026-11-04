/**
 * Invite tes potes : le seuil. Les questions sont finies, la lecture est
 * lancée, il ne manque que les potes. Hors du fil de progression, sur
 * l'aquarelle rouge des notifs (Lea, 2026-11-04 : « c'est plus une question »).
 *
 *    ‹                               ✕     retour, et ✕ = pas maintenant
 *    Invite tes 𝓹𝓸𝓽𝓮𝓼
 *    Ta lecture est prête
 *
 *              ▐████▌                      la couverture, au milieu
 *              ▐████▌
 *            578006 (⧉)                    le code en Valentine, de quoi le copier
 *
 *    [      Envoyer le lien      ]         partagé → l'écran suivant, tout seul
 *
 * La lecture se crée en arrivant ici (il faut son code pour le lien) ; si on
 * revient en arrière changer de livre, elle suit. Le message est un vrai lien
 * (bestie-book-battle://join/…) avec le code en secours.
 */

import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckIcon, ChevronLeftIcon, CopyIcon, ShareIcon, XIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_BG } from '../../components/brand/BrandLockup';
import Button3D from '../../components/Button3D';
import { ONBOARDING_MAX_W, ONBOARDING_TITLE, rise } from '../../components/onboarding/OnboardingScreen';
import AccentWord, { accentHeadroom } from '../../components/ui/AccentWord';
import { COVER_RATIO, CoverImage } from '../../components/ui/BookCover';
import GlassButton from '../../components/ui/GlassButton';
import { createReading, deadlineFrom, ensureProfile, updateReadingBook } from '../../services/onboarding';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useProjectStore } from '../../stores/projectStore';
import { borderRadius, colors, fonts, paperFrameGradient, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { nextStep } from '../../utils/onboardingFlow';
import { inviteMessage } from '../../utils/share';

const WASH = require('../../assets/images/watercolor/login-wash.png');
const COVER_W = 150;

export default function InviterScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { flow, book, createdChallengeId, patch } = store;
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
  const next = () => router.push(nextStep(flow, 'inviter'));

  const share = async () => {
    if (!code) return;
    try {
      const result = await Share.share({ message: inviteMessage(book.title, code) });
      if (result.action === Share.sharedAction) {
        feel('inviter');
        patch({ invited: true });
        next();
      }
    } catch {
      // Annulé
    }
  };

  const copy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    feel('tic');
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={BRAND_BG} style={StyleSheet.absoluteFill} />
      <Image source={WASH} style={StyleSheet.absoluteFill} contentFit="cover" />

      <SafeAreaView style={styles.column} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <GlassButton icon={ChevronLeftIcon} onPress={() => router.back()} accessibilityLabel="Retour" />
          <GlassButton icon={XIcon} onPress={next} accessibilityLabel="Plus tard" />
        </View>

        <Animated.View entering={rise(0)} style={styles.head}>
          <Text style={[styles.heading, accentHeadroom(ONBOARDING_TITLE)]} accessibilityRole="header">
            <AccentWord text="Invite tes potes" accent="potes" size={ONBOARDING_TITLE} />
          </Text>
          <Text style={styles.sub}>Ta lecture est prête</Text>
        </Animated.View>

        <Animated.View entering={rise(1)} style={styles.book}>
          {book.cover ? (
            <CoverImage uri={book.cover} style={styles.cover} />
          ) : (
            <LinearGradient colors={paperFrameGradient} style={styles.cover} />
          )}

          <View style={styles.codeRow}>
            {code ? (
              <Animated.Text
                entering={FadeIn.duration(200)}
                style={[styles.codeText, accentHeadroom(CODE_SIZE)]}
                accessibilityLabel={`Code de la lecture : ${code.split('').join(' ')}`}
              >
                {code}
              </Animated.Text>
            ) : failed ? (
              <Text style={styles.retry} onPress={ensureReading} accessibilityRole="button">
                Pas de réseau ? Toucher pour réessayer
              </Text>
            ) : (
              <View style={styles.skeleton} />
            )}
            {!failed && (
              <GlassButton icon={copied ? CheckIcon : CopyIcon} onPress={copy} accessibilityLabel={copied ? 'Code copié' : 'Copier le code'} />
            )}
          </View>
        </Animated.View>

        <Animated.View entering={rise(2)} style={styles.footer}>
          <Button3D variant="secondary" icon={ShareIcon} iconPosition="left" disabled={!code} onPress={share} style={styles.wide}>
            Envoyer le lien
          </Button3D>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const CODE_SIZE = 34;

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
  // Les deux ronds en verre, aux bords de l'écran comme dans les questions
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -(spacing.xl - spacing.lg),
    paddingTop: spacing.sm,
  },
  head: {
    paddingTop: spacing['2xl'],
    gap: spacing.sm,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: ONBOARDING_TITLE,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.white,
  },
  sub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
    opacity: 0.85,
  },
  // Le livre et son code au milieu de la place qui reste
  book: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  cover: {
    width: COVER_W,
    height: COVER_W / COVER_RATIO,
    borderRadius: 2,
    transform: [{ rotate: '-2deg' }],
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  codeText: {
    // Dans la police d'accent, comme le chiffre de Ma page
    fontFamily: fonts.accent,
    fontSize: CODE_SIZE,
    letterSpacing: 3,
    color: colors.white,
  },
  retry: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    opacity: 0.85,
  },
  skeleton: {
    width: 140,
    height: 20,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  wide: {
    width: '100%',
  },
});
