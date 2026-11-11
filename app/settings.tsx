/**
 * Route /settings — les réglages, derrière la roue dentée du profil.
 *
 * Sheet natif (`SheetPage`). Des cadres papier sans titre : chaque ligne se
 * suffit (icône + mot), cousues entre elles (`StitchLine`) :
 *
 *    Notifications                 ›   (sheet posé dessus : rappel, groupe)
 *    Sons / Vibrations           (○)
 *    Inviter / Signaler            ›
 *    [ Se déconnecter ]
 *    Supprimer mon compte  (seul dans son cadre, rouge : irréversible)
 *
 *    Confidentialité et conditions  ›   (sheet posé dessus)
 *
 * Ouvrir un écran depuis ici ferme d'abord le sheet, sinon l'écran poussé
 * s'ouvrirait À L'INTÉRIEUR du sheet (cf. app/library.tsx). Les notifs et les
 * pages légales se posent dessus, avec un retour.
 */

import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import {
  BellIcon,
  LogOutIcon,
  ShieldCheckIcon,
  ShareIcon,
  Trash2Icon,
  TriangleAlertIcon,
  VibrateIcon,
  Volume2Icon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Linking, StyleSheet } from 'react-native';
import Button3D from '../components/Button3D';
import SheetPage from '../components/ui/SheetPage';
import { LinkRow, SettingsCard, ToggleRow } from '../components/ui/SettingsRows';
import { StitchLine } from '../components/ui/Stitch';
import { useAuthStore } from '../stores/authStore';
import { useFeelStore } from '../stores/feelStore';
import { spacing } from '../utils/constants';
import { buzz, feel } from '../utils/feel';
import { oops } from '../utils/notice';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0';

export default function SettingsRoute() {
  const router = useRouter();
  const { logout, deleteAccount } = useAuthStore();
  const { sounds, haptics, setSounds, setHaptics } = useFeelStore();
  const [busy, setBusy] = useState(false);

  // Ferme le sheet, puis ouvre l'écran (sinon il s'ouvre dans le sheet)
  const openScreen = (href: Href) => {
    router.back();
    router.push(href);
  };

  const handleReport = async () => {
    const subject = encodeURIComponent("[chapi] Signalement d'un problème");
    const body = encodeURIComponent(`Décris ton problème ici :\n\n\n---\nApp version : ${APP_VERSION}`);
    const mailUrl = `mailto:support@leasantos.me?subject=${subject}&body=${body}`;
    if (await Linking.canOpenURL(mailUrl)) {
      Linking.openURL(mailUrl);
    } else {
      Alert.alert('Aucune app Mail', 'Configure une app Mail sur ton iPhone pour envoyer un signalement.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Se déconnecter', 'Tu veux te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusy(true);
            await logout();
            router.dismissAll();
            router.replace('/auth/login');
          } catch (error) {
            oops('Toujours connecté·e', error);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Ton profil, tes lectures et ta progression seront définitivement supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer mon compte',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Tu es sûr·e ?', 'Dernière chance. Ton compte sera supprimé définitivement.', [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Oui, supprimer',
                style: 'destructive',
                onPress: async () => {
                  try {
                    setBusy(true);
                    await deleteAccount();
                    router.dismissAll();
                    router.replace('/auth/login');
                  } catch (error) {
                    oops('Compte pas supprimé', error, { hint: 'Rien n’a été effacé, réessaie dans un instant' });
                  } finally {
                    setBusy(false);
                  }
                },
              },
            ]),
        },
      ],
    );
  };

  return (
    <SheetPage title="Réglages" scrollEnabled={false}>
      <SettingsCard>
        <LinkRow icon={BellIcon} label="Notifications" onPress={() => router.push('/settings-notifications')} />
        <StitchLine />
        <ToggleRow
          icon={Volume2Icon}
          label="Sons"
          on={sounds}
          onChange={(on) => {
            setSounds(on);
            if (on) feel('appui');
          }}
        />
        <StitchLine />
        <ToggleRow
          icon={VibrateIcon}
          label="Vibrations"
          on={haptics}
          onChange={(on) => {
            setHaptics(on);
            if (on) buzz();
          }}
        />
      </SettingsCard>

      <SettingsCard>
        <LinkRow icon={ShareIcon} label="Inviter" onPress={() => openScreen('/invite')} />
        <StitchLine />
        <LinkRow icon={TriangleAlertIcon} label="Signaler un problème" onPress={handleReport} />
        <StitchLine />
        <LinkRow
          icon={ShieldCheckIcon}
          label="Confidentialité et conditions"
          onPress={() => router.push('/settings-legal')}
        />
      </SettingsCard>

      <Button3D variant="secondary" icon={LogOutIcon} onPress={handleLogout} disabled={busy} style={styles.logout}>
        Se déconnecter
      </Button3D>

      {/* Irréversible : seul dans son cadre, en rouge d'erreur (pas le rouge Lowki) */}
      <SettingsCard>
        <LinkRow icon={Trash2Icon} label="Supprimer mon compte" danger disabled={busy} onPress={handleDelete} />
      </SettingsCard>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  logout: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
