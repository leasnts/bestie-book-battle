/**
 * 👤 Page Profil — v3
 *
 * Structure (layout fixe, aucun scroll) :
 * 1. HEADER   : bouton retour (Button3D) | titre "Profil"
 * 2. PROFIL   : photo + prénom Rokkitt + bouton "Modifier"
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
import { Ionicons } from '@expo/vector-icons';
import RefreshCcw from 'lucide-react-native/dist/esm/icons/refresh-ccw';
import SquarePen from 'lucide-react-native/dist/esm/icons/square-pen';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '../../components/ui/BottomSheet';
import Button3D from '../../components/Button3D';
import PageTransition from '../../components/PageTransition';
import { pickImage, uploadProfilePhoto } from '../../services/supabase/storage';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { Challenge } from '../../types/supabase';
import {
  borderRadius,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../../utils/constants';

// ─── Constantes ────────────────────────────────────────────────────────────────

const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');
const APP_VERSION = Constants.expoConfig?.version ?? '1.0';
const ACCESSORY_ID_PROFILE = 'edit-profile-no-done';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Construit l'URI de la photo avec cache-busting (?v=timestamp).
 * Même logique que resolveAvatarSource sur la home — force expo-image
 * à recharger après un changement de photo.
 */
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/profile_picture_default.png');

function resolvePhotoSource(url?: string | null, updatedAt?: string | null) {
  if (!url) return DEFAULT_PROFILE_IMAGE;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const sep = url.includes('?') ? '&' : '?';
    const v = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return { uri: `${url}${sep}v=${v}` };
  }
  return DEFAULT_PROFILE_IMAGE;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { challenges, loadUserChallenges } = useProjectStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

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

  const photoSource = resolvePhotoSource(user?.profile_photo_url, user?.updated_at);

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <PageTransition>
    <View style={styles.container}>
      <Image source={TEXTURE_IMAGE} style={styles.backgroundTexture} contentFit="cover" />

      {/* ═══════════ HEADER ═══════════ */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Button3D
          variant="secondary"
          iconOnly
          size="compact"
          icon="chevron-back"
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ═══════════ SECTION PROFIL ═══════════ */}
      <View style={styles.profileSection}>
        <View style={styles.profileRow}>
          <View style={styles.photoWrapper}>
            <Image source={photoSource} style={styles.photo} contentFit="cover" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.first_name || 'Lecteur'}</Text>
            <EditButton onPress={() => setEditProfileVisible(true)} />
          </View>
        </View>
      </View>

      {/* ═══════════ LISTE PARAMÈTRES ═══════════ */}
      <View style={styles.settingsList}>

        <View style={[styles.settingRow, styles.settingRowFirst]}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Notifications push</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.dark900 }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
          onPress={() => setInviteVisible(true)}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Inviter un ami</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
          onPress={handleReportIssue}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="warning-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Signaler un problème</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
          onPress={handleLogoutPress}
          disabled={isLoggingOut}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Text style={[styles.settingLabel, styles.settingLabelDanger]}>Se déconnecter</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.error} />
        </Pressable>

      </View>

      {/* Spacer — pousse le footer vers le bas */}
      <View style={{ flex: 1 }} />

      {/* ═══════════ FOOTER ═══════════ */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing['2xl'] }]}>
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

      {isLoggingOut && (
        <View style={styles.logoutOverlay}>
          <ActivityIndicator size="large" color={colors.dark900} />
        </View>
      )}

      <EditProfileSheet visible={editProfileVisible} onClose={() => setEditProfileVisible(false)} />
      <InviteSheet visible={inviteVisible} onClose={() => setInviteVisible(false)} challenges={challenges} />
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
              ? ['rgba(30,30,30,0.15)', 'rgba(0,0,0,0)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.6)']
              : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0)', 'rgba(30,30,30,0.15)']
          }
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.editButtonStroke} />
        <SquarePen size={15} color={colors.textPrimary} strokeWidth={2.2} />
        <Text style={styles.editButtonText}>Modifier</Text>
      </View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT PROFILE SHEET
// ═══════════════════════════════════════════════════════════════════════════════

function EditProfileSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) setFirstName(user?.first_name || '');
  }, [visible, user?.first_name]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleChangePhoto = async () => {
    if (!user) return;
    try {
      const imageUri = await pickImage(true, [1, 1], 0.8);
      if (!imageUri) return;
      setIsUploadingPhoto(true);
      const { url } = await uploadProfilePhoto(user.id, imageUri);
      await updateProfile({ profile_photo_url: url });
    } catch {
      Alert.alert('Erreur', 'Impossible de changer ta photo. Réessaie.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const trimmed = firstName.trim();
    if (!trimmed) {
      Alert.alert('Erreur', 'Le prénom ne peut pas être vide.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ first_name: trimmed });
      onClose();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessaie.');
    } finally {
      setIsSaving(false);
    }
  };

  const photoSource = resolvePhotoSource(user?.profile_photo_url, user?.updated_at);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID_PROFILE}><View /></InputAccessoryView>
      )}

      <KeyboardAvoidingView style={sheetStyles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: isKeyboardVisible ? 12 : Math.max(32, insets.bottom + 16) }}>
          <Text style={sheetStyles.title}>Modifier le profil</Text>

          <Pressable
            style={sheetStyles.photoCentered}
            onPress={handleChangePhoto}
            disabled={isUploadingPhoto}
          >
            <View style={sheetStyles.photoCenteredThumb}>
              <Image source={photoSource} style={sheetStyles.photoCenteredImg} contentFit="cover" />
              <View style={sheetStyles.photoCenteredIconOverlay}>
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <RefreshCcw size={28} color="#FFF" strokeWidth={2.5} />
                )}
              </View>
            </View>
          </Pressable>

          <TextInput
            ref={inputRef}
            style={sheetStyles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Ton prénom"
            placeholderTextColor={colors.textPlaceholder}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            inputAccessoryViewID={ACCESSORY_ID_PROFILE}
            autoCapitalize="words"
          />

          <View style={{ marginTop: spacing.sm }}>
            <Button3D variant="primary" onPress={handleSave} loading={isSaving}>
              Enregistrer
            </Button3D>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVITE SHEET
// ═══════════════════════════════════════════════════════════════════════════════

function InviteSheet({ visible, onClose, challenges }: { visible: boolean; onClose: () => void; challenges: Challenge[] }) {
  const insets = useSafeAreaInsets();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  // Opacité du mini-toast "Copié !" inline (remplace l'Alert)
  const copyToastOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (visible && challenges.length > 0) setSelectedChallenge(challenges[0]);
  }, [visible, challenges]);

  /**
   * Copie le code et affiche un mini-toast inline qui disparaît en 1.5s.
   * Plus léger qu'une Alert pour une action aussi simple.
   */
  const handleCopy = async () => {
    if (!selectedChallenge?.invite_code) return;
    await Clipboard.setStringAsync(selectedChallenge.invite_code);
    RNAnimated.sequence([
      RNAnimated.timing(copyToastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      RNAnimated.delay(1200),
      RNAnimated.timing(copyToastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleShare = async () => {
    if (!selectedChallenge) return;
    const code = selectedChallenge.invite_code;
    const deepLink = selectedChallenge.invite_url || `bestiebookbattle://join/${code}`;
    const message = `Rejoins-moi pour lire "${selectedChallenge.book_title}" sur bestiebookbattle ! 📚\n\nCode : ${code}\n${deepLink}`;
    try {
      await Share.share({ message, url: deepLink });
    } catch {
      // Annulé par l'utilisateur
    }
  };

  const hasMultiple = challenges.length > 1;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: Math.max(32, insets.bottom + 16) }}>
        <Text style={sheetStyles.title}>Inviter un ami</Text>

        {challenges.length === 0 ? (
          <Text style={sheetStyles.emptyText}>Tu n'as aucun projet de lecture actif pour le moment.</Text>
        ) : (
          <>
            {hasMultiple && (
              <RNAnimated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: spacing.lg }}
                contentContainerStyle={inviteStyles.bookPickerContent}
              >
                {challenges.map((c) => {
                  const isSelected = c.id === selectedChallenge?.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelectedChallenge(c)}
                      style={[inviteStyles.bookCard, isSelected && inviteStyles.bookCardSelected]}
                    >
                      {c.cover_url ? (
                        <Image source={{ uri: c.cover_url }} style={inviteStyles.bookCardCover} contentFit="cover" />
                      ) : (
                        <View style={inviteStyles.bookCardNoCover}>
                          <Ionicons name="book-outline" size={24} color={colors.textTertiary} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </RNAnimated.ScrollView>
            )}

            {!hasMultiple && selectedChallenge && (
              <View style={inviteStyles.singleBook}>
                {selectedChallenge.cover_url ? (
                  <Image source={{ uri: selectedChallenge.cover_url }} style={inviteStyles.singleBookCover} contentFit="cover" />
                ) : (
                  <View style={[inviteStyles.singleBookCover, inviteStyles.singleBookNoCover]}>
                    <Ionicons name="book-outline" size={28} color={colors.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={inviteStyles.singleBookTitle}>{selectedChallenge.book_title}</Text>
                  {selectedChallenge.book_author && (
                    <Text style={inviteStyles.singleBookAuthor}>{selectedChallenge.book_author}</Text>
                  )}
                </View>
              </View>
            )}

            {selectedChallenge && (
              <>
                <Text style={sheetStyles.label}>Code d'invitation</Text>
                <View>
                  <Pressable style={inviteStyles.codeBox} onPress={handleCopy}>
                    <Text style={inviteStyles.codeText}>{selectedChallenge.invite_code}</Text>
                    <Ionicons name="copy-outline" size={20} color={colors.textTertiary} />
                  </Pressable>
                  <RNAnimated.View style={[inviteStyles.copyToast, { opacity: copyToastOpacity }]} pointerEvents="none">
                    <Text style={inviteStyles.copyToastText}>Copié !</Text>
                  </RNAnimated.View>
                </View>

                <View style={{ marginTop: spacing.lg }}>
                  <Button3D variant="primary" onPress={handleShare} icon="share-outline" iconPosition="left">
                    Inviter à participer
                  </Button3D>
                </View>
              </>
            )}
          </>
        )}
      </View>
    </BottomSheet>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES — PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },

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
    fontFamily: 'Rokkitt',
    fontSize: 24,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  headerSpacer: { width: 40 },

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
    borderColor: 'rgba(255,255,255,0.3)',
  },
  photo: { width: 90, height: 90 },
  profileInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  profileName: {
    fontFamily: 'Rokkitt_Bold',
    fontSize: 30,
    lineHeight: 38,
    color: colors.textPrimary,
  },

  // ─── Bouton Modifier ─────────────────────────────────────────────────────────
  editButtonShadow: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    shadowColor: '#000',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  editButtonStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  editButtonText: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },

  // ─── Liste paramètres ────────────────────────────────────────────────────────
  settingsList: {
    paddingHorizontal: spacing.lg,
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
    fontFamily: 'WorkSans_600SemiBold',
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
    fontFamily: 'WorkSans_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPlaceholder,
    textDecorationLine: 'underline',
  },
  footerVersion: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPlaceholder,
  },

  // ─── Overlay déconnexion ─────────────────────────────────────────────────────
  logoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES — SHEETS PARTAGÉS
// ═══════════════════════════════════════════════════════════════════════════════

const sheetStyles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontFamily: 'Rokkitt_Medium',
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: -0.72,
    lineHeight: 44,
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  input: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    letterSpacing: -0.3,
    textAlignVertical: 'center',
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  photoCentered: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoCenteredThumb: {
    width: 120,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoCenteredImg: {
    width: 120,
    height: 120,
  },
  photoCenteredIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  emptyText: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: spacing['3xl'],
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES — INVITE SHEET
// ═══════════════════════════════════════════════════════════════════════════════

const inviteStyles = StyleSheet.create({
  bookPickerContent: {
    gap: spacing.md,
    paddingHorizontal: 2,
  },
  bookCard: {
    width: 84,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.bgSecondary,
  },
  bookCardSelected: {
    borderColor: colors.dark900,
    backgroundColor: colors.white,
  },
  bookCardCover: {
    width: 68,
    height: 95,
    borderRadius: 4,
  },
  bookCardNoCover: {
    width: 68,
    height: 95,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleBook: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  singleBookCover: {
    width: 52,
    height: 72,
    borderRadius: 4,
  },
  singleBookNoCover: {
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleBookTitle: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  singleBookAuthor: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    ...shadows.xs,
  },
  codeText: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: 4,
  },
  // Mini-toast "Copié !" superposé sur le codeBox, centré
  copyToast: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    transform: [{ translateY: -14 }],
    backgroundColor: colors.dark900,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  copyToastText: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
