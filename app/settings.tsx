/**
 * Route /settings — les réglages, derrière la roue dentée du profil.
 *
 * Sheet natif (`SheetPage`). Des cadres papier regroupés par thème, une ligne
 * par réglage, cousus entre eux (`StitchLine`) :
 *
 *    Notifs       Rappel · [20:00]               (○)
 *                 Mon groupe                     (○)
 *    Dans l'app   Sons / Vibrations             (○)
 *                 Activité                       ›
 *    Aide         Inviter / Signaler             ›
 *    [ Se déconnecter ]
 *    Compte       Supprimer mon compte  (rouge : c'est irréversible)
 *
 * Les notifs (#178) partent du serveur, qui relit ces réglages à chaque envoi :
 * le rappel (à son heure, les jours sans lecture) et « Mon groupe » (une pote
 * passe devant, le carnet, la veille d'un cap). Allumer l'un demande d'abord
 * l'autorisation d'iOS si besoin.
 * Ouvrir un écran depuis ici ferme d'abord le sheet, sinon l'écran poussé
 * s'ouvrirait À L'INTÉRIEUR du sheet (cf. app/library.tsx).
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import {
  BellIcon,
  ChevronRightIcon,
  FlaskConicalIcon,
  InboxIcon,
  ShareIcon,
  TriangleAlertIcon,
  UsersIcon,
  VibrateIcon,
  Volume2Icon,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Button3D from '../components/Button3D';
import PressableScale from '../components/ui/PressableScale';
import SheetPage from '../components/ui/SheetPage';
import { StitchLine } from '../components/ui/Stitch';
import {
  notificationPrefs,
  registerPushToken,
  saveNotificationPrefs,
} from '../services/notifications';
import { useAuthStore } from '../stores/authStore';
import { useFeelStore } from '../stores/feelStore';
import { borderRadius, colors, fonts, fontSize, paperFrameGradient, spacing } from '../utils/constants';
import { buzz, feel } from '../utils/feel';
import { oops } from '../utils/notice';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0';

/** « 20:30 » ↔ une date du jour à 20 h 30, pour la roue d'iOS */
const toDate = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};
const toHHMM = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function SettingsRoute() {
  const router = useRouter();
  const { logout, deleteAccount } = useAuthStore();
  const { sounds, haptics, setSounds, setHaptics } = useFeelStore();
  const user = useAuthStore((st) => st.user);
  const prefs = notificationPrefs(user?.notification_preferences);
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);

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
    // Allumé alors qu'iOS les bloquait : l'autre réglage, lui, n'a pas bougé
    await savePrefs({ [key]: on });
  };

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
    <SheetPage title="Réglages">
      <Group label="Notifs">
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
      </Group>

      <Group label="Dans l’app">
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
        <StitchLine />
        <LinkRow icon={InboxIcon} label="Activité" onPress={() => openScreen('/activity')} />
      </Group>

      <Group label="Aide">
        <LinkRow icon={ShareIcon} label="Inviter" onPress={() => openScreen('/invite')} />
        <StitchLine />
        <LinkRow icon={TriangleAlertIcon} label="Signaler un problème" onPress={handleReport} />
        {__DEV__ && (
          <>
            <StitchLine />
            <LinkRow icon={FlaskConicalIcon} label="Tester l’onboarding" onPress={() => openScreen('/auth/login')} />
          </>
        )}
      </Group>

      <Button3D variant="secondary" onPress={handleLogout} disabled={busy} style={styles.logout}>
        Se déconnecter
      </Button3D>

      {/* Irréversible : seul, en rouge, loin du reste (demande de Lea) */}
      <Group label="Compte">
        <PressableScale
          style={styles.row}
          pressedScale={0.98}
          onPress={handleDelete}
          disabled={busy}
          accessibilityRole="button"
        >
          <Text style={[styles.label, styles.danger]}>Supprimer mon compte</Text>
        </PressableScale>
      </Group>

      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <Pressable onPress={() => Linking.openURL('https://chapi.leasantos.me/terms')} accessibilityRole="link">
            <Text style={styles.footerLink}>Conditions</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://chapi.leasantos.me/privacy')} accessibilityRole="link">
            <Text style={styles.footerLink}>Confidentialité</Text>
          </Pressable>
        </View>
        <Text style={styles.footerText}>chapi v{APP_VERSION}</Text>
      </View>
    </SheetPage>
  );
}

// ─── Un cadre papier titré ──────────────────────────────────────────────────

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.card}>
        <LinearGradient colors={paperFrameGradient} style={[StyleSheet.absoluteFill, styles.cardPaper]} />
        {children}
      </View>
    </View>
  );
}

// ─── Les lignes ─────────────────────────────────────────────────────────────

function ToggleRow({
  icon: Icon,
  label,
  accessory,
  on,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  /** Avant l'interrupteur : l'heure du rappel */
  accessory?: React.ReactNode;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Icon size={22} color={colors.textSecondary} />
      <Text style={styles.label}>{label}</Text>
      {accessory}
      <Switch
        value={on}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.white}
        accessibilityLabel={label}
      />
    </View>
  );
}

function LinkRow({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <PressableScale style={styles.row} pressedScale={0.98} onPress={onPress} accessibilityRole="button">
      <Icon size={22} color={colors.textSecondary} />
      <Text style={styles.label}>{label}</Text>
      <ChevronRightIcon size={20} color={colors.textTertiary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  groupLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  cardPaper: {
    borderRadius: borderRadius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    // Une marge et pas une hauteur fixe : avec minHeight, iOS colle le Switch en haut de la ligne
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  danger: {
    color: colors.accent,
  },
  logout: {
    marginBottom: spacing['2xl'],
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: spacing['2xl'],
  },
  footerLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.textTertiary,
    textDecorationLine: 'underline',
  },
  footerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.textTertiary,
  },
});
