/**
 * Le meilleur moment pour lire ? La lectrice en général, avant de parler d'un livre.
 *
 * Plusieurs moments possibles ; le plus tard fixe l'heure du rappel. Rien
 * d'obligatoire, rien de choisi d'avance. Les formats suivent, sur leur propre
 * écran (« Ton support préféré ? »).
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import { ToggleOptionList } from '../../components/onboarding/OptionList';
import { MOMENTS } from '../../components/onboarding/choices';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { nextStep } from '../../utils/onboardingFlow';

export default function RythmeScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const moments = useOnboardingStore((s) => s.moments);
  const patch = useOnboardingStore((s) => s.patch);

  return (
    <OnboardingScreen
      step="rythme"
      title="Le meilleur moment pour lire ?"
      accent="meilleur moment"
      footer={
        <Button3D variant="primary" onPress={() => router.push(nextStep(flow, 'rythme'))} style={styles.wide}>
          Continuer
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)}>
        <ToggleOptionList options={MOMENTS} values={moments} onChange={(values) => patch({ moments: values })} />
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
});
