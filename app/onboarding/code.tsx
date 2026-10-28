/**
 * Rejoindre avec un code, quand on n'a pas le lien (un lien au code inconnu,
 * « Rejoindre » de l'accueil vide). Trouvé → l'invitation.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import Animated from 'react-native-reanimated';
import InvitationCode from '../../components/onboarding/InvitationCode';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import { useOnboardingStore } from '../../stores/onboardingStore';

export default function CodeScreen() {
  const router = useRouter();
  return (
    <OnboardingScreen step="code" title="Ton code" accent="code">
      <Animated.View entering={rise(1)}>
        <InvitationCode
          onFound={(invitation) => {
            useOnboardingStore.getState().patch({ invitation });
            router.push('/onboarding/invitation');
          }}
        />
      </Animated.View>
    </OnboardingScreen>
  );
}
