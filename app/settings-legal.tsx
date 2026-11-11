/**
 * Route /settings-legal — confidentialité et conditions, posées sur les réglages.
 *
 *    ‹  Confidentialité et conditions
 *       Confidentialité   ›
 *       Conditions        ›
 *
 * Apple exige que la politique de confidentialité s'ouvre depuis l'app : les
 * deux pages vivent sur le site (chapi.leasantos.me).
 */

import { useRouter } from 'expo-router';
import { FileTextIcon, ShieldCheckIcon } from 'lucide-react-native';
import React from 'react';
import { Linking } from 'react-native';
import SheetPage from '../components/ui/SheetPage';
import { LinkRow, SettingsCard } from '../components/ui/SettingsRows';
import { StitchLine } from '../components/ui/Stitch';

export default function LegalSettingsRoute() {
  const router = useRouter();
  return (
    <SheetPage title="Confidentialité et conditions" titleLines={2} onBack={() => router.back()}>
      <SettingsCard>
        <LinkRow
          icon={ShieldCheckIcon}
          label="Confidentialité"
          onPress={() => Linking.openURL('https://chapi.leasantos.me/privacy')}
        />
        <StitchLine />
        <LinkRow
          icon={FileTextIcon}
          label="Conditions"
          onPress={() => Linking.openURL('https://chapi.leasantos.me/terms')}
        />
      </SettingsCard>
    </SheetPage>
  );
}
