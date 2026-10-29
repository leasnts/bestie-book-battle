/**
 * Tu lis sur quoi ? Les formats habituels, en général : plusieurs possibles
 * (papier le soir, liseuse dans le métro, audio en marchant). Ils ne choisissent
 * rien à la place de la personne pour un livre : « Tu en es où ? » redemande le
 * format de ce livre-là. Rien d'obligatoire, rien de choisi d'avance.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import { ToggleOptionList } from '../../components/onboarding/OptionList';
import { FORMATS } from '../../components/onboarding/choices';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { nextStep } from '../../utils/onboardingFlow';

export default function FormatsScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const usualFormats = useOnboardingStore((s) => s.usualFormats);
  const patch = useOnboardingStore((s) => s.patch);

  return (
    <OnboardingScreen
      step="formats"
      title="Tu lis sur quoi ?"
      accent="quoi"
      footer={
        <Button3D variant="primary" onPress={() => router.push(nextStep(flow, 'formats'))} style={styles.wide}>
          Continuer
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)}>
        <ToggleOptionList options={FORMATS} values={usualFormats} onChange={(values) => patch({ usualFormats: values })} />
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
});
