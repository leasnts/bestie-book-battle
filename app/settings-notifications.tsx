/**
 * Route /settings-notifications — les notifs, posées sur les réglages.
 *
 *    ‹  Notifications
 *       Rappel · [20:30]   (○)
 *       Mon groupe         (○)
 *
 * Les notifs (#178) partent du serveur, qui relit ces réglages à chaque envoi :
 * le rappel (à son heure, les jours sans lecture) et « Mon groupe » (une pote
 * passe devant, le carnet, la veille d'un cap). Allumer l'un demande d'abord
 * l'autorisation d'iOS si besoin.
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { BellIcon, UsersIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import SheetPage from '../components/ui/SheetPage';
import { SettingsCard, ToggleRow } from '../components/ui/SettingsRows';
import { StitchLine } from '../components/ui/Stitch';
import { notificationPrefs, registerPushToken, saveNotificationPrefs } from '../services/notifications';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../utils/constants';
import { oops } from '../utils/notice';

/** « 20:30 » ↔ une date du jour à 20 h 30, pour la roue d'iOS */
const toDate = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};
const toHHMM = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function NotificationSettingsRoute() {
  const router = useRouter();
  const user = useAuthStore((st) => st.user);
  const prefs = notificationPrefs(user?.notification_preferences);
  const [allowed, setAllowed] = useState(false);

  // Une notif n'est « allumée » que si iOS les laisse aussi passer
  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => setAllowed(status === 'granted'));
  }, []);

  /** Allumer : l'autorisation d'iOS d'abord ; refusée une fois, seuls ses Réglages peuvent rouvrir */
  const ensureAllowed = async (): Promise<boolean> => {
    if (allowed) return true;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Notifications coupées', 'Active-les pour chapi dans les Réglages de ton iPhone.', [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Ouvrir les Réglages', onPress: () => Linking.openURL('app-settings:') },
      ]);
      return false;
    }
    setAllowed(true);
    if (user) registerPushToken(user.id).catch((e) => console.warn('[notifs] jeton', e));
    return true;
  };

  const savePrefs = async (patch: Parameters<typeof saveNotificationPrefs>[1]) => {
    if (!user) return;
    try {
      await saveNotificationPrefs(user.id, patch);
    } catch (error) {
      oops('Réglage pas enregistré', error, { retry: () => savePrefs(patch) });
    }
  };

  const toggle = async (key: 'daily_reminder' | 'group', on: boolean) => {
    if (on && !(await ensureAllowed())) return;
    await savePrefs({ [key]: on });
  };

  return (
    <SheetPage title="Notifications" onBack={() => router.back()}>
      <SettingsCard>
        <ToggleRow
          icon={BellIcon}
          label="Rappel"
          on={prefs.daily_reminder && allowed}
          onChange={(on) => toggle('daily_reminder', on)}
          accessory={
            prefs.daily_reminder && allowed ? (
              <DateTimePicker
                value={toDate(prefs.daily_reminder_time)}
                mode="time"
                display="compact"
                minuteInterval={5}
                locale="fr-FR"
                accentColor={colors.accent}
                onChange={(_, date) => date && savePrefs({ daily_reminder_time: toHHMM(date) })}
                accessibilityLabel="Heure du rappel"
              />
            ) : null
          }
        />
        <StitchLine />
        <ToggleRow
          icon={UsersIcon}
          label="Mon groupe"
          on={prefs.group && allowed}
          onChange={(on) => toggle('group', on)}
        />
      </SettingsCard>
    </SheetPage>
  );
}
