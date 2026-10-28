/**
 * Le code d'une lecture : six cases, vérifiées toutes seules au sixième
 * chiffre. Trouvé → `onFound` avec l'invitation ; sinon, on vide et on le dit.
 * Sur l'écran du code et dans « Tu lances ou tu rejoins ? » (J'ai un code).
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CodeBoxes, { CODE_LENGTH } from '../ui/CodeBoxes';
import { fetchInvitation } from '../../services/onboarding';
import type { InvitationDraft } from '../../stores/onboardingStore';
import { colors, fonts, fontSize } from '../../utils/constants';
import { feel } from '../../utils/feel';

export default function InvitationCode({ onFound }: { onFound: (invitation: InvitationDraft) => void }) {
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
    onFound(invitation);
  };

  return (
    <View>
      <CodeBoxes value={code} onChange={onChange} editable={!busy} accessibilityLabel="Code de la lecture" />
      {missed && <Text style={styles.missed} accessibilityLiveRegion="polite">Ce code ne mène à aucune lecture.</Text>}
    </View>
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
