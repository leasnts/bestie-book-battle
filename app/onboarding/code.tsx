/**
 * Rejoindre avec un code, quand on n'a pas le lien : six cases, vérifiées
 * toutes seules au sixième chiffre. Trouvé → l'invitation.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import CodeBoxes, { CODE_LENGTH } from '../../components/ui/CodeBoxes';
import { fetchInvitation } from '../../services/onboarding';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, fontSize } from '../../utils/constants';
import { feel } from '../../utils/feel';

export default function CodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [missed, setMissed] = useState(false);

  const onChange = async (value: string) => {
    setCode(value);
    setMissed(false);
    if (value.length < CODE_LENGTH) return;
    setBusy(true);
    const invitation = await fetchInvitation(value);
    setBusy(false);
    if (!invitation) {
      feel('erreur');
      setMissed(true);
      setCode('');
      return;
    }
    useOnboardingStore.getState().patch({ invitation });
    router.push('/onboarding/invitation');
  };

  return (
    <OnboardingScreen step="code" title="Ton code" accent="code">
      <Animated.View entering={rise(1)}>
        <CodeBoxes value={code} onChange={onChange} editable={!busy} accessibilityLabel="Code de la lecture" />
        {missed && <Text style={styles.missed} accessibilityLiveRegion="polite">Ce code ne mène à aucune lecture.</Text>}
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  missed: {
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
