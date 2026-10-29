/**
 * Tu lances ou tu rejoins ? Un écran à lui seul, juste avant le livre : le
 * moment où le parcours se sépare. Lancer → « Quel livre ? » ; rejoindre →
 * « Ton code », puis l'invitation. Les liens d'invitation l'évitent.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import OptionList from '../../components/onboarding/OptionList';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { isAddFlow, nextStep } from '../../utils/onboardingFlow';

type Way = 'lancer' | 'rejoindre';
const WAYS = [
  { key: 'lancer' as const, label: 'Je lance une lecture', illustration: require('../../assets/images/onboarding/lancer.png') },
  { key: 'rejoindre' as const, label: "J'ai un code", illustration: require('../../assets/images/onboarding/code.png') },
];

export default function ChoixScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const [way, setWay] = useState<Way | null>(null);

  const next = () => {
    if (!way) return;
    const adding = isAddFlow(flow);
    if (way === 'lancer') {
      const own = adding ? 'add' : 'create';
      useOnboardingStore.getState().patch({ flow: own, invitation: null });
      router.push(nextStep(own, 'choix'));
    } else {
      useOnboardingStore.getState().patch({ flow: adding ? 'addJoin' : 'join' });
      router.push('/onboarding/code');
    }
  };

  return (
    <OnboardingScreen
      step="choix"
      title="Tu lances ou tu rejoins ?"
      accent="rejoins"
      footer={
        <Button3D variant="primary" onPress={next} disabled={!way} style={styles.wide}>
          Continuer
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)}>
        <OptionList options={WAYS} value={way} onChange={setWay} />
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
});
