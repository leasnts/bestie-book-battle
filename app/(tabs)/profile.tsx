/**
 * 👤 Page Profil — v3
 *
 * Structure (défile si le contenu dépasse, footer poussé en bas sinon) :
 * 1. HEADER   : titre "Profil" (onglet de la barre native, pas de bouton retour)
 * 2. PROFIL   : photo + prénom en Fraunces + bouton "Modifier"
 * 3. SETTINGS : notifications (toggle natif), inviter, signaler, déconnexion
 * 4. FOOTER   : liens légaux cliquables + version dynamique
 *
 * Notifications :
 * - Au montage, on lit l'état réel des permissions iOS via expo-notifications
 * - Toggle ON  → requestPermissionsAsync (si refusé → Settings iOS)
 * - Toggle OFF → iOS ne permet pas de couper programmatiquement les notifs
 *   d'une app, on redirige vers les Settings du téléphone
 * - Compatible Expo Go + build production (App Store)
 */

import * as Notifications from 'expo-notifications';
// Icônes maison plutôt que lucide-react-native : même tracé, même API
// (size / color / strokeWidth), et un jeu d'icônes de moins à maintenir.
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageTransition from '../../components/PageTransition';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import {
  colors,
  creamAlpha,
  fonts,
  inkAlpha,
  shadowAlpha,
  spacing,
} from '../../utils/constants';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import { resolvePhotoSource } from '../../utils/profilePhoto';
import { BellIcon, ChevronRightIcon, InboxIcon, FlaskConicalIcon, LogOutIcon, PencilIcon, ShareIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react-native';

// ─── Constantes ────────────────────────────────────────────────────────────────

const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');
const APP_VERSION = Constants.expoConfig?.version ?? '1.0';

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const { user, logout, deleteAccount } = useAuthStore();
  const { challenges, loadUserChallenges } = useProjectStore();


  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // ─── Init : permissions notifs + challenges ─────────────────────────────────

  useEffect(() => {
    // Lit l'état réel des permissions au montage pour initialiser le toggle
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotificationsEnabled(status === 'granted');
    });
  }, []);

  useEffect(() => {
    // Charge les challenges si pas encore en mémoire (ex: arrivée directe sur profil)
    if (user?.id && challenges.length === 0) {
      loadUserChallenges(user.id);
    }
  }, [user?.id]);

  // ─── Toggle notifications ───────────────────────────────────────────────────

  /**
   * iOS ne permet pas de désactiver les notifs programmatiquement depuis l'app.
   * - ON  → on demande la permission (ou on informe si déjà accordée)
   * - OFF → on renvoie l'user dans les Réglages iOS pour couper lui-même
   */
  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      // L'user veut activer
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsEnabled(true);
      } else {
        // Permission refusée ou non déterminée → Settings
        Alert.alert(
          'Notifications désactivées',
          'Pour recevoir des rappels de lecture, active les notifications pour bestiebookbattle dans tes Réglages.',
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Ouvrir les Réglages',
              onPress: () => Linking.openURL('app-settings:'),
            },
          ]
        );
      }
    } else {
      // L'user veut désactiver → redirection Réglages iOS
      Alert.alert(
        'Désactiver les notifications',
        'Pour désactiver les notifications, rends-toi dans tes Réglages → bestiebookbattle → Notifications.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Ouvrir les Réglages',
            onPress: () => Linking.openURL('app-settings:'),
          },
        ]
      );
    }
  };

  // ─── Déconnexion ────────────────────────────────────────────────────────────

  const handleLogoutPress = () => {
    Alert.alert(
      'Se déconnecter',
      'Tu veux te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await logout();
              router.replace('/auth/login');
            } catch (error: any) {
              Alert.alert('Erreur', error?.message || 'Impossible de te déconnecter. Réessaie.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // ─── Signalement ────────────────────────────────────────────────────────────

  const handleReportIssue = async () => {
    const subject = encodeURIComponent('[BBB] Signalement d\'un problème');
    const body = encodeURIComponent(
      `Décris ton problème ici :\n\n\n---\nApp version : ${APP_VERSION}\niOS : ${Platform.OS === 'ios' ? 'oui' : 'non'}`
    );
    const mailUrl = `mailto:support@leasantos.me?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(mailUrl);
    if (canOpen) {
      Linking.openURL(mailUrl);
    } else {
      Alert.alert('Aucune app Mail', 'Configure une app Mail sur ton iPhone pour envoyer un signalement.');
    }
  };

  // ─── Suppression du compte ──────────────────────────────────────────────────

  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données (profil, challenges, progression) seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer mon compte',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Tu es sûr·e ?',
              'Dernière chance. Ton compte sera supprimé définitivement.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Oui, supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsDeletingAccount(true);
                      await deleteAccount();
                      router.replace('/auth/login');
                    } catch (error: any) {
                      Alert.alert('Erreur', error?.message || 'Impossible de supprimer ton compte. Réessaie.');
                    } finally {
                      setIsDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const photoSource = resolvePhotoSource(user?.profile_photo_url, user?.updated_at);

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <PageTransition>
    <View style={styles.container}>
      <Image source={TEXTURE_IMAGE} style={styles.backgroundTexture} contentFit="cover" />

      {/*
        Défilement : la barre d'onglets flottante prend ~70 pt en bas, le contenu
        ne tient plus d'un bloc sur les petits écrans ni en gros corps de texte.
        Marges manuelles : insets en haut, useTabBarInset() en bas.
      */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
      {/* ═══════════ HEADER ═══════════ */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* ═══════════ SECTION PROFIL ═══════════ */}
      <View style={styles.profileSection}>
        <View style={styles.profileRow}>
          <View style={styles.photoWrapper}>
            <Image source={photoSource} style={styles.photo} contentFit="cover" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.first_name || 'Lecteur'}</Text>
            {user?.email && (
              <Text style={styles.profileEmail}>{user.email}</Text>
            )}
            <EditButton onPress={() => router.push('/edit-profile')} />
          </View>
        </View>
      </View>

      {/* ═══════════ LISTE PARAMÈTRES ═══════════ */}
      <View style={styles.settingsList}>

        <View style={[styles.settingRow, styles.settingRowFirst]}>
          <View style={styles.settingLeft}>
            <BellIcon size={24} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Notifications push</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.white}
          />
        </View>

        {/* Le fil des notifications : avant, une cloche sur l'accueil */}
        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
          onPress={() => router.push('/activity')}
        >
          <View style={styles.settingLeft}>
            <InboxIcon size={24} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <ChevronRightIcon size={24} color={colors.textTertiary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
          onPress={() => router.push('/invite')}
        >
          <View style={styles.settingLeft}>
            <ShareIcon size={24} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Inviter un ami</Text>
          </View>
          <ChevronRightIcon size={24} color={colors.textTertiary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
          onPress={handleReportIssue}
        >
          <View style={styles.settingLeft}>
            <TriangleAlertIcon size={24} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Signaler un problème</Text>
          </View>
          <ChevronRightIcon size={24} color={colors.textTertiary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
          onPress={handleLogoutPress}
          disabled={isLoggingOut}
        >
          <View style={styles.settingLeft}>
            <LogOutIcon size={24} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Se déconnecter</Text>
          </View>
          <ChevronRightIcon size={24} color={colors.textTertiary} />
        </Pressable>

      </View>

      {/* ═══════════ DEV TOOLS ═══════════ */}
      {__DEV__ && (
        <View style={styles.settingsList}>
          <Pressable
            style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
            onPress={() => router.push('/onboarding')}
          >
            <View style={styles.settingLeft}>
              <FlaskConicalIcon size={24} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Tester l'onboarding</Text>
            </View>
            <ChevronRightIcon size={24} color={colors.textTertiary} />
          </Pressable>
        </View>
      )}

      {/* ═══════════ ZONE DANGER ═══════════ */}
      <View style={styles.dangerZone}>
        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
          onPress={handleDeleteAccountPress}
          disabled={isDeletingAccount}
        >
          <View style={styles.settingLeft}>
            <Trash2Icon size={24} color={colors.error} />
            <Text style={[styles.settingLabel, styles.settingLabelDanger]}>Supprimer mon compte</Text>
          </View>
          <ChevronRightIcon size={24} color={colors.error} />
        </Pressable>
      </View>

      {/* Spacer — pousse le footer vers le bas quand le contenu est plus court que l'écran */}
      <View style={{ flex: 1 }} />

      {/* ═══════════ FOOTER ═══════════ */}
      <View style={[styles.footer, { paddingBottom: tabBarInset + spacing['2xl'] }]}>
        <View style={styles.footerLinks}>
          <Pressable onPress={() => Linking.openURL('https://bbb.leasantos.me/terms')}>
            <Text style={styles.footerLink}>Conditions d'utilisations</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://bbb.leasantos.me/privacy')}>
            <Text style={styles.footerLink}>Politique de confidentialité</Text>
          </Pressable>
        </View>
        <Text style={styles.footerVersion}>bestie book battle v{APP_VERSION}</Text>
      </View>
      </ScrollView>

      {(isLoggingOut || isDeletingAccount) && (
        <View style={styles.logoutOverlay}>
          <ActivityIndicator size="large" color={colors.dark900} />
        </View>
      )}

    </View>
    </PageTransition>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOUTON "MODIFIER"
// ═══════════════════════════════════════════════════════════════════════════════

function EditButton({ onPress }: { onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.editButtonShadow}
    >
      <View style={styles.editButtonInner}>
        <LinearGradient
          colors={
            pressed
              ? [shadowAlpha(0.15), shadowAlpha(0), creamAlpha(0), creamAlpha(0.6)]
              : [creamAlpha(0.6), creamAlpha(0), shadowAlpha(0), shadowAlpha(0.15)]
          }
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.editButtonStroke} />
        <PencilIcon size={15} color={colors.textPrimary} strokeWidth={2.2} />
        <Text style={styles.editButtonText}>Modifier</Text>
      </View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES — PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  backgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ─── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },

  // ─── Section profil ──────────────────────────────────────────────────────────
  profileSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['3xl'],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  photoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: creamAlpha(0.3),
  },
  photo: { width: 90, height: 90 },
  profileInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  profileName: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  profileEmail: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },

  // ─── Bouton Modifier ─────────────────────────────────────────────────────────
  editButtonShadow: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.bgLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editButtonStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  editButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },

  // ─── Liste paramètres ────────────────────────────────────────────────────────
  settingsList: {
    paddingHorizontal: spacing.lg,
  },
  dangerZone: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing['3xl'],
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  settingRowFirst: { paddingTop: spacing['3xl'] },
  settingRowPressed: { opacity: 0.6 },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  settingLabelDanger: { color: colors.error },

  // ─── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing['2xl'],
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 30,
  },
  footerLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPlaceholder,
    textDecorationLine: 'underline',
  },
  footerVersion: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPlaceholder,
  },

  // ─── Overlay déconnexion ─────────────────────────────────────────────────────
  logoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: creamAlpha(0.75),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
