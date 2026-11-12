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
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckIcon, ChevronLeftIcon, CopyIcon, ShareIcon, XIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_BG } from '../../components/brand/BrandLockup';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
import { ONBOARDING_MAX_W, ONBOARDING_TITLE, rise } from '../../components/onboarding/OnboardingScreen';
import { CardBook, CardPaper, FlipCard, ReadingCardBack, cardRows } from '../../components/onboarding/ReadingCard';
import AccentWord, { accentHeadroom } from '../../components/ui/AccentWord';
import { STAMP_FALL } from '../../components/ui/Stamp';
import GlassButton from '../../components/ui/GlassButton';
import Shimmer from '../../components/ui/Shimmer';
import { createReading, deadlineFrom, ensureProfile, updateReadingBook } from '../../services/onboarding';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useProjectStore } from '../../stores/projectStore';
import { borderRadius, colors, fonts, inkAlpha, lowki, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { FLIP_MS, useFinishOnboarding } from '../../utils/finishOnboarding';
import { inviteMessage } from '../../utils/share';

/** Les yeux de l'icône, en crème sur l'aquarelle rouge (comme « Bienvenue ») */
const EYES_TINT = [colors.white, '#efe7da'] as const;
const WASH = require('../../assets/images/watercolor/login-wash.png');

export default function InviterScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const navigation = useNavigation();
  const { book, createdChallengeId, patch } = store;
  const challenge = useProjectStore((s) => s.challenges.find((c) => c.id === createdChallengeId) ?? null);
  const [failed, setFailed] = useState(false);
  /** La fin : la carte se retourne, tout s'enregistre */
  const [finishing, setFinishing] = useState(false);
  const gone = useSharedValue(0);
  const rows = useMemo(() => cardRows(useOnboardingStore.getState()), []);
  const end = useFinishOnboarding(finishing, rows.length, 250);
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

  // Les yeux : ils montent une fois la carte retournée, puis un petit sursaut au tampon (sans rebond)
  const peek = useSharedValue(0);
  const hop = useSharedValue(0);
  useEffect(() => {
    if (end.turned) peek.value = withDelay(FLIP_MS - 150, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [end.turned, peek]);
  useEffect(() => {
    if (end.done) hop.value = withDelay(STAMP_FALL, withSequence(withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.inOut(Easing.quad) })));
  }, [end.done, hop]);
  const peekStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, peek.value * 3),
    transform: [{ translateY: 46 * (1 - peek.value) - 5 * hop.value }],
  }));

  // La fin : les mots d'invitation s'effacent, la carte reste et se retourne
  const fade = useAnimatedStyle(() => ({ opacity: 1 - gone.value }));
  const appear = useAnimatedStyle(() => ({ opacity: gone.value, transform: [{ translateY: (1 - gone.value) * 12 }] }));

  if (!book) return null;
  const code = challenge?.invite_code ?? null;
  /** Envoyé, ou « Plus tard » : la carte se retourne, tout s'enregistre */
  const finish = () => {
    if (finishing) return;
    navigation.setOptions({ gestureEnabled: false });
    gone.value = withTiming(1, { duration: 320 });
    setFinishing(true);
  };

  const share = async () => {
    if (!code) return;
    try {
      const result = await Share.share({ message: inviteMessage(book.title, code) });
      if (result.action === Share.sharedAction) {
        feel('inviter');
        patch({ invited: true });
        finish();
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
        <Animated.View style={[styles.header, fade]} pointerEvents={finishing ? 'none' : 'auto'}>
          <GlassButton icon={ChevronLeftIcon} onPress={() => router.back()} accessibilityLabel="Retour" />
          <GlassButton icon={XIcon} onPress={finish} accessibilityLabel="Plus tard" />
        </Animated.View>

        <Animated.View entering={rise(0)} style={styles.head}>
          <Animated.View style={fade} accessibilityElementsHidden={finishing} importantForAccessibility={finishing ? 'no-hide-descendants' : 'auto'}>
            <Text style={[styles.heading, accentHeadroom(ONBOARDING_TITLE)]} accessibilityRole="header">
              <AccentWord text="Invite tes potes" accent="potes" size={ONBOARDING_TITLE} />
            </Text>
            <Text style={styles.sub}>Ta lecture est prête</Text>
          </Animated.View>
          {finishing && (
            <Animated.View style={[styles.doneTitle, appear]}>
              <Text style={[styles.heading, accentHeadroom(ONBOARDING_TITLE)]} accessibilityRole="header">
                <AccentWord text="On y va !" accent="y va" size={ONBOARDING_TITLE} />
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View entering={rise(1)} style={styles.middle}>
          {/* La carte de lecture : le livre, puis son code en six cases (d'après la carte-pass d'Opal) ;
              à la fin elle se retourne, et ma carte de lecture s'écrit au verso */}
          <View>
          {/* Les yeux de chapi sortent de derrière la carte retournée, et sautent au coup de tampon */}
          <Animated.View style={[styles.peek, peekStyle]} pointerEvents="none">
            <PopEyes vector size="medium" tint={EYES_TINT} />
          </Animated.View>
          <FlipCard
            turned={end.turned}
            front={
              <CardPaper>
                <CardBook title={book.title} author={book.author} cover={book.cover} />
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
                          // Pas encore de code : la case en creux, et une lueur qui passe de case en case
                          <View style={styles.loading}>
                            <Shimmer delay={i * SHIMMER_STEP} />
                          </View>
                        )}
                      </LinearGradient>
                    ))}
                  </View>
                )}
              </CardPaper>
            }
            back={
              <ReadingCardBack
                book={{ title: book.title, author: book.author, cover: book.cover }}
                rows={rows}
                written={end.written}
                stamped={end.done}
              />
            }
          />
          </View>

          {!!code && (
            <Animated.View style={fade} pointerEvents={finishing ? 'none' : 'auto'}>
              <Pressable onPress={copy} hitSlop={12} style={styles.copy} accessibilityRole="button" accessibilityLabel={copied ? 'Code copié' : 'Copier le code'}>
                {copied ? <CheckIcon size={16} color={colors.white} /> : <CopyIcon size={16} color={colors.white} />}
                <Text style={styles.copyText}>{copied ? 'Copié' : 'Copier le code'}</Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View entering={rise(2)} style={styles.footer}>
          <Animated.View style={fade} pointerEvents={finishing ? 'none' : 'auto'}>
            <Button3D variant="secondary" icon={ShareIcon} iconPosition="left" disabled={!code} onPress={share} style={styles.wide}>
              Envoyer le lien
            </Button3D>
          </Animated.View>
          {/* À la place, une fois le tampon posé : ouvrir le livre (ou réessayer) */}
          {end.failed ? (
            <Animated.View entering={FadeIn.duration(250)} style={styles.over}>
              <Button3D variant="secondary" onPress={end.retry} style={styles.wide}>
                Réessayer
              </Button3D>
            </Animated.View>
          ) : end.done ? (
            <Animated.View entering={FadeInDown.duration(350).delay(STAMP_FALL + 250)} style={styles.over}>
              <Button3D variant="secondary" onPress={end.open} style={styles.wide}>
                Ouvrir le livre
              </Button3D>
            </Animated.View>
          ) : null}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const CODE_LENGTH = 6;
const DIGIT_SIZE = 30;
/** La lueur passe d'une case à la suivante */
const SHIMMER_STEP = 90;
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
  // « On y va ! » prend la place du titre d'invitation
  doneTitle: {
    position: 'absolute',
    top: spacing['2xl'],
    left: 0,
    right: 0,
  },
  // Les yeux, posés derrière le bord haut de la carte, côté gauche (le tampon est à droite)
  peek: {
    position: 'absolute',
    top: -44,
    left: spacing.xl,
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
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
    overflow: 'hidden',
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
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: inkAlpha(0.07),
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
  /** Le bouton de la fin, à la place d'« Envoyer le lien » */
  over: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  wide: {
    width: '100%',
  },
});
