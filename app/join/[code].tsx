/**
 * Le lien d'invitation : bestie-book-battle://join/123456.
 *
 * Il ouvre directement la lecture, sans code à taper : on la cherche, puis
 * l'écran d'invitation. Lien périmé → l'écran du code. Déjà inscrit·e : le
 * parcours court (addJoin), sinon le parcours complet (join).
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { fetchInvitation } from '../../services/onboarding';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors } from '../../utils/constants';

export default function JoinLink() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  useEffect(() => {
    const store = useOnboardingStore.getState();
    store.begin(useAuthStore.getState().user ? 'addJoin' : 'join');
    fetchInvitation(code ?? '').then((invitation) => {
      if (!invitation) {
        router.replace('/onboarding/code');
        return;
      }
      useOnboardingStore.getState().patch({ invitation });
      router.replace('/onboarding/invitation');
    });
  }, [code, router]);

  // Le temps de la recherche : le papier de l'onboarding, rien d'autre
  return <View style={{ flex: 1, backgroundColor: colors.bgLight }} />;
}
