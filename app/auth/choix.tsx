/**
 * Commencer ou rejoindre ? Le choix de la V1, dans un sheet : il s'ouvre sur
 * l'écran de connexion, juste après Apple ou l'email, pour un nouveau compte
 * (ou un compte sans lecture). Les liens d'invitation l'évitent.
 */

import { useRouter, type Href } from 'expo-router';
import { BookPlusIcon, MailOpenIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Button3D from '../../components/Button3D';
import SheetPage from '../../components/ui/SheetPage';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { firstStep, isAddFlow } from '../../utils/onboardingFlow';

export default function ChoixSheet() {
  const router = useRouter();
  const adding = useOnboardingStore((s) => isAddFlow(s.flow));

  /** Le sheet se ferme, l'onboarding remplace l'écran de connexion */
  const go = (href: Href) => {
    feel('tic');
    router.dismissAll();
    router.replace(href);
  };

  const start = () => {
    const flow = adding ? 'add' : 'create';
    useOnboardingStore.getState().patch({ flow });
    go(firstStep(flow));
  };

  const join = () => {
    useOnboardingStore.getState().patch({ flow: adding ? 'addJoin' : 'join' });
    go('/onboarding/code');
  };

  return (
    <SheetPage title="Ta lecture" accent="lecture">
      <View style={styles.buttons}>
        <Button3D
          variant="primary"
          onPress={start}
          iconComponent={<BookPlusIcon size={22} color={colors.white} />}
          iconPosition="left"
          style={styles.wide}
        >
          Commencer une lecture
        </Button3D>
        <Button3D
          variant="secondary"
          onPress={join}
          iconComponent={<MailOpenIcon size={22} color={colors.textPrimary} />}
          iconPosition="left"
          style={styles.wide}
        >
          Rejoindre avec un code
        </Button3D>
      </View>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  buttons: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  wide: {
    width: '100%',
  },
});
