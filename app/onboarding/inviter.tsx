/**
 * On invite qui ? Inviter, au milieu du parcours, quand le livre est choisi.
 *
 *    ┌──────────────────────┐
 *    │ ▐██▌ La Femme de …   │     le livre, la même carte qu'à « On lit quoi ? »
 *    └──────────────────────┘
 *    ┌──────────────────────┐
 *    │ 578006           (⧉) │     le code, encadré, et de quoi le copier
 *    └──────────────────────┘
 *
 * La lecture se crée en arrivant ici (il faut son code pour le lien) ; si on
 * revient en arrière changer de livre, elle suit. Le message est un vrai lien
 * (bestie-book-battle://join/…) avec le code en secours.
 */

import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { CheckIcon, CopyIcon, ShareIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import BookBanner from '../../components/onboarding/BookBanner';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import GlassSection from '../../components/ui/GlassSection';
import GlassButton from '../../components/ui/GlassButton';
import { createReading, deadlineFrom, ensureProfile, updateReadingBook } from '../../services/onboarding';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useProjectStore } from '../../stores/projectStore';
import { borderRadius, colors, fonts, inkAlpha, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { nextStep } from '../../utils/onboardingFlow';
import { inviteMessage } from '../../utils/share';

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
      <Animated.View entering={rise(1)}>
        <BookBanner book={book} />
      </Animated.View>

      <Animated.View entering={rise(2)}>
        <GlassSection>
          <View style={styles.codeRow}>
            {code ? (
              <Animated.Text
                entering={FadeIn.duration(200)}
                style={styles.codeText}
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
            <GlassButton icon={copied ? CheckIcon : CopyIcon} onPress={copy} accessibilityLabel={copied ? 'Code copié' : 'Copier le code'} />
          </View>
        </GlassSection>
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  codeText: {
    flex: 1,
    // Comme les chiffres du code reçu par email (CodeBoxes)
    fontFamily: fonts.body,
    fontSize: 26,
    letterSpacing: 4,
    color: colors.textPrimary,
  },
  retry: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },
  skeleton: {
    flex: 1,
    height: 20,
    borderRadius: borderRadius.sm,
    backgroundColor: inkAlpha(0.06),
  },
});
