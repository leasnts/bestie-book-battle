/**
 * On invite qui ? Inviter, au milieu du parcours, quand le livre est choisi.
 *
 *    ┌──────────────────┐
 *    │  aquarelle chapi │     l'aperçu du message : la couverture sur le fond
 *    │      ▐██▌        │     rouge de chapi, « Lis … avec moi »
 *    │ Lis X avec moi   │
 *    └──────────────────┘
 *    [A][B][C][D][E][F]       le code, comme celui reçu par email
 *         Copier
 *
 * La lecture se crée en arrivant ici (il faut son code pour le lien) ; si on
 * revient en arrière changer de livre, elle suit. Le message est un vrai lien
 * (bestie-book-battle://join/…) avec le code en secours.
 */

import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CheckIcon, CopyIcon, ShareIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BRAND_BG } from '../../components/brand/BrandLockup';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import { COVER_RATIO, CoverImage } from '../../components/ui/BookCover';
import CodeBoxes from '../../components/ui/CodeBoxes';
import { createReading, deadlineFrom, ensureProfile, updateReadingBook } from '../../services/onboarding';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useProjectStore } from '../../stores/projectStore';
import { colors, fonts, inkAlpha, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { nextStep } from '../../utils/onboardingFlow';
import { inviteMessage } from '../../utils/share';

const WASH = require('../../assets/images/watercolor/login-wash.png');
const COVER_W = 84;

export default function InviterScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { flow, book, createdChallengeId, invited, patch } = store;
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
    await Clipboard.setStringAsync(code);
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
            <Button3D variant="secondary" onPress={() => router.push(nextStep(flow, 'inviter'))} style={styles.wide}>
              Plus tard
            </Button3D>
          </>
        )
      }
    >
      <Animated.View entering={rise(1)} style={styles.bubble}>
        <View style={styles.art}>
          <Image source={WASH} style={StyleSheet.absoluteFill} contentFit="cover" />
          {book.cover ? <CoverImage uri={book.cover} style={styles.cover} /> : <View style={[styles.cover, styles.noCover]} />}
        </View>
        <View style={styles.bubbleText}>
          <Text style={styles.bubbleTitle} numberOfLines={2}>{`Lis ${book.title} avec moi`}</Text>
          {failed && !code ? (
            <Text style={styles.link} onPress={ensureReading} accessibilityRole="button">
              Pas de réseau ? Toucher pour réessayer
            </Text>
          ) : (
            <Text style={styles.link}>chapi</Text>
          )}
        </View>
      </Animated.View>

      {code && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.code}>
          <CodeBoxes value={code} accessibilityLabel="Code de la lecture" />
          <Button3D variant="secondary" size="small" icon={copied ? CheckIcon : CopyIcon} iconPosition="left" onPress={copy}>
            {copied ? 'Copié' : 'Copier'}
          </Button3D>
        </Animated.View>
      )}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
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
  // Le fond de chapi : l'aquarelle rouge de la connexion
  art: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: BRAND_BG[1],
  },
  cover: {
    width: COVER_W,
    height: COVER_W / COVER_RATIO,
    borderRadius: 3,
  },
  noCover: {
    backgroundColor: colors.bgSecondary,
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
  code: {
    alignItems: 'center',
    gap: spacing.md,
  },
});
