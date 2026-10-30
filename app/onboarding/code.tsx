/**
 * Rejoindre avec un code, quand on n'a pas le lien : six cases centrées,
 * vérifiées toutes seules au sixième chiffre ; « Continuer » reste en bas,
 * grisé tant que le code n'est pas complet. Trouvé → l'invitation. On y arrive par
 * « J'ai un code » (Par où on commence ?), un lien au code inconnu, ou
 * « Rejoindre » sur l'accueil vide.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
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

  const check = async (value: string) => {
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

  const onChange = (value: string) => {
    setCode(value);
    setMissed(false);
    if (value.length === CODE_LENGTH) check(value);
  };

  return (
    <OnboardingScreen
      step="code"
      title="Insère le code juste ici"
      accent="code"
      footer={
        <Button3D variant="primary" loading={busy} disabled={code.length < CODE_LENGTH} onPress={() => check(code)} style={styles.wide}>
          Continuer
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)}>
        <CodeBoxes value={code} onChange={onChange} editable={!busy} accessibilityLabel="Code de la lecture" />
        {missed && <Text style={styles.missed} accessibilityLiveRegion="polite">Ce code ne mène à aucune lecture.</Text>}
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  missed: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
