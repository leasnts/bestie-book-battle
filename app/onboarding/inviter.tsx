/**
 * Invite tes potes : le seuil. Les questions sont finies, la lecture est
 * lancée, il ne manque que les potes. Hors du fil de progression, sur
 * l'aquarelle rouge des notifs (Lea, 2026-11-04 : « c'est plus une question »).
 *
 *    ‹                               ✕     retour, et ✕ = pas maintenant
 *    Invite tes 𝓹𝓸𝓽𝓮𝓼
 *    Ta lecture est prête
 *
 *    ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐
 *    ┊ ▐█▌ Fourth Wing             ┊      la carte de lecture, papier cousu
 *    ┊ ─────────────────────────── ┊      (d'après la carte-pass d'Opal)
 *    ┊ [4][2][4][2][4][2]          ┊      le code en six cases, en Valentine
 *    └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘
 *            ⧉ Copier le code
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
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_BG } from '../../components/brand/BrandLockup';
import Button3D from '../../components/Button3D';
import { ONBOARDING_MAX_W, ONBOARDING_TITLE, rise } from '../../components/onboarding/OnboardingScreen';
import AccentWord, { accentHeadroom } from '../../components/ui/AccentWord';
import BookCover, { COVER_RATIO } from '../../components/ui/BookCover';
import { StitchBorder } from '../../components/ui/Stitch';
import GlassButton from '../../components/ui/GlassButton';
import { createReading, deadlineFrom, ensureProfile, updateReadingBook } from '../../services/onboarding';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useProjectStore } from '../../stores/projectStore';
import { borderRadius, colors, fonts, inkAlpha, lowki, paperFrameGradient, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { nextStep } from '../../utils/onboardingFlow';
import { inviteMessage } from '../../utils/share';

const WASH = require('../../assets/images/watercolor/login-wash.png');

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

        <Animated.View entering={rise(1)} style={styles.middle}>
          {/* La carte de lecture : le livre, puis son code en six cases (d'après la carte-pass d'Opal) */}
          <LinearGradient colors={paperFrameGradient} style={styles.card}>
            <StitchBorder radius={borderRadius.xl} />
            <View style={styles.bookRow}>
              <View style={styles.thumb}>
                <BookCover coverUrl={book.cover} />
              </View>
              <View style={styles.texts}>
                <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
                {!!book.author && <Text style={styles.author} numberOfLines={1}>{book.author}</Text>}
              </View>
            </View>
            <View style={styles.rule} />
            {failed && !code ? (
              <Text style={styles.retry} onPress={ensureReading} accessibilityRole="button">
                Pas de réseau ? Toucher pour réessayer
              </Text>
            ) : (
              <View
                style={styles.cases}
                accessible
                accessibilityLabel={code ? `Code de la lecture : ${code.split('').join(' ')}` : 'Code en préparation'}
              >
                {Array.from({ length: CODE_LENGTH }, (_, i) => (
                  <LinearGradient key={i} colors={CASE_GRADIENT} style={styles.case}>
                    {code ? (
                      <Animated.Text entering={FadeIn.duration(200).delay(i * 40)} style={[styles.digit, accentHeadroom(DIGIT_SIZE)]}>
                        {code[i]}
                      </Animated.Text>
                    ) : (
                      <View style={styles.skeleton} />
                    )}
                  </LinearGradient>
                ))}
              </View>
            )}
          </LinearGradient>

          {!!code && (
            <Pressable onPress={copy} hitSlop={12} style={styles.copy} accessibilityRole="button" accessibilityLabel={copied ? 'Code copié' : 'Copier le code'}>
              {copied ? <CheckIcon size={16} color={colors.white} /> : <CopyIcon size={16} color={colors.white} />}
              <Text style={styles.copyText}>{copied ? 'Copié' : 'Copier le code'}</Text>
            </Pressable>
          )}
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

const CODE_LENGTH = 6;
const DIGIT_SIZE = 30;
const THUMB_W = 48;
/** Une case du code : papier un cran plus clair que la carte */
const CASE_GRADIENT = ['#fffdf9', '#f4eee5'] as const;

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
  // La carte au milieu de la place qui reste
  middle: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: THUMB_W,
    aspectRatio: COVER_RATIO,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textTertiary,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: inkAlpha(0.12),
    marginVertical: spacing.lg,
  },
  cases: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  case: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: inkAlpha(0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    // Dans la police d'accent, comme le chiffre de Ma page
    fontFamily: fonts.accent,
    fontSize: DIGIT_SIZE,
    color: lowki.chocolate.dark,
  },
  skeleton: {
    width: 14,
    height: 20,
    borderRadius: borderRadius.xs,
    backgroundColor: inkAlpha(0.06),
  },
  retry: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
  },
  copyText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.white,
    opacity: 0.9,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  wide: {
    width: '100%',
  },
});
