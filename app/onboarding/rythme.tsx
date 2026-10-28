/**
 * Ton rythme : la lectrice en général, avant de parler d'un livre.
 *
 * - Quand ? Plusieurs moments possibles ; le plus tard fixe l'heure du rappel.
 * - En général, tu lis en… plusieurs formats possibles (papier le soir,
 *   liseuse dans le métro, audio en marchant) ; ils préremplissent le format de
 *   chaque nouveau livre. Rien d'obligatoire.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { QuestionLabel, rise } from '../../components/onboarding/OnboardingScreen';
import { FORMATS, MOMENTS } from '../../components/onboarding/choices';
import { ToggleChips } from '../../components/ui/FilterChips';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { spacing } from '../../utils/constants';
import { nextStep } from '../../utils/onboardingFlow';

export default function RythmeScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const moments = useOnboardingStore((s) => s.moments);
  const usualFormats = useOnboardingStore((s) => s.usualFormats);
  const patch = useOnboardingStore((s) => s.patch);

  return (
    <OnboardingScreen
      step="rythme"
      title="Ton rythme"
      accent="rythme"
      footer={
        <Button3D variant="primary" onPress={() => router.push(nextStep(flow, 'rythme'))} style={styles.wide}>
          Continuer
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)} style={styles.group}>
        <QuestionLabel>Quand ?</QuestionLabel>
        <ToggleChips large options={MOMENTS} values={moments} onChange={(values) => patch({ moments: values })} />
      </Animated.View>
      <Animated.View entering={rise(2)} style={styles.group}>
        <QuestionLabel>En général, tu lis en</QuestionLabel>
        <ToggleChips large options={FORMATS} values={usualFormats} onChange={(values) => patch({ usualFormats: values })} />
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.lg,
  },
  wide: {
    width: '100%',
  },
});
