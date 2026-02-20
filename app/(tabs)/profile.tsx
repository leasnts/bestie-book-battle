/**
 * 👤 Page Profil — v2
 *
 * Structure :
 * 1. HEADER   : bouton retour (Button3D) | titre "Profil"
 * 2. PROFIL   : photo rectangulaire + prénom (Rokkitt Bold) + bouton "Modifier"
 * 3. SETTINGS : liste claire (notifications, inviter, signaler, déconnexion)
 * 4. FOOTER   : liens légaux cliquables + version dynamique depuis expo-constants
 *
 * Modals bottom sheet intégrés :
 * - EditProfileSheet : changer photo, prénom, voir email
 * - InviteSheet : choisir le livre, afficher le code, partage natif iOS
 */

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
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

// Version lue depuis le manifeste Expo — évite de la mettre en dur
const APP_VERSION = Constants.expoConfig?.version ?? '1.0';

// InputAccessoryView ID pour masquer la barre "Done" iOS sur le clavier texte
const ACCESSORY_ID_PROFILE = 'edit-profile-no-done';

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { challenges } = useProjectStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────────

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

  /**
   * Ouvre l'app Mail native iOS avec sujet + corps pré-remplis.
   * L'utilisateur n'a qu'à appuyer Envoyer.
   * Remplace le lien App Store pour un feedback plus direct.
   */
  const handleReportIssue = async () => {
    const subject = encodeURIComponent('[BBB] Signalement d\'un problème');
    const body = encodeURIComponent(
      `Décris ton problème ici :\n\n\n---\nApp version : ${APP_VERSION}\niOS : ${Platform.OS === 'ios' ? 'oui' : 'non'}`
    );
    const mailUrl = `mailto:support@bestiebookbattle.com?subject=${subject}&body=${body}`;

    const canOpen = await Linking.canOpenURL(mailUrl);
    if (canOpen) {
      Linking.openURL(mailUrl);
    } else {
      Alert.alert(
        'Aucune app Mail',
        'Configure une app Mail sur ton iPhone pour envoyer un signalement.'
      );
    }
  };

  const photoSource =
    typeof user?.profile_photo_url === 'string'
      ? { uri: user.profile_photo_url }
      : require('../../assets/images/lea.png');

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Texture de fond noise (même que la home) */}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ═══════════ SECTION PROFIL ═══════════ */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            {/* Photo rectangulaire */}
            <View style={styles.photoWrapper}>
              <Image source={photoSource} style={styles.photo} contentFit="cover" />
            </View>

            {/* Prénom + bouton Modifier */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.first_name || 'Lecteur'}</Text>
              <EditButton onPress={() => setEditProfileVisible(true)} />
            </View>
          </View>
        </View>

        {/* ═══════════ LISTE PARAMÈTRES ═══════════ */}
        <View style={styles.settingsList}>

          {/* Notifications push */}
          <View style={[styles.settingRow, styles.settingRowFirst]}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Notifications push</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              // Noir primary au lieu du vert iOS — cohérent avec la charte BBB
              trackColor={{ false: colors.border, true: colors.dark900 }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Inviter un ami */}
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

          {/* Signaler un problème — ouvre Mail natif avec sujet pré-rempli */}
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

          {/* Se déconnecter */}
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
      </ScrollView>

      {/* ═══════════ FOOTER ═══════════ */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing['2xl'] }]}>
        <View style={styles.footerLinks}>
          {/* Liens légaux → ouvrent Safari en externe */}
          <Pressable onPress={() => Linking.openURL('https://bestiebookbattle.com/terms')}>
            <Text style={styles.footerLink}>Conditions d'utilisations</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://bestiebookbattle.com/privacy')}>
            <Text style={styles.footerLink}>Politique de confidentialité</Text>
          </Pressable>
        </View>
        <Text style={styles.footerVersion}>bestie book battle v{APP_VERSION}</Text>
      </View>

      {/* Overlay pendant la déconnexion */}
      {isLoggingOut && (
        <View style={styles.logoutOverlay}>
          <ActivityIndicator size="large" color={colors.dark900} />
        </View>
      )}

      {/* ═══════════ MODALS ═══════════ */}
      <EditProfileSheet
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
      />
      <InviteSheet
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
        challenges={challenges}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOUTON "MODIFIER" — réplique Button3D secondary en pill compact
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
        <Ionicons name="create-outline" size={16} color={colors.textPrimary} />
        <Text style={styles.editButtonText}>Modifier</Text>
      </View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT PROFILE SHEET — photo (avec bouton refresh à côté) + prénom
// ═══════════════════════════════════════════════════════════════════════════════

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
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

  if (!visible) return null;

  const photoSource =
    typeof user?.profile_photo_url === 'string'
      ? { uri: user.profile_photo_url }
      : require('../../assets/images/lea.png');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Overlay sombre — tap = fermer */}
      <Animated.View style={sheetStyles.overlay} entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID_PROFILE}>
          <View />
        </InputAccessoryView>
      )}

      {/* flex: 1 + justifyContent: flex-end = sheet ancré en bas */}
      <KeyboardAvoidingView
        style={sheetStyles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            sheetStyles.sheet,
            { paddingBottom: isKeyboardVisible ? 12 : Math.max(32, insets.bottom + 16) },
          ]}
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
        >
          <View style={sheetStyles.handleRow}>
            <View style={sheetStyles.handle} />
          </View>

          <Text style={sheetStyles.title}>Modifier le profil</Text>

          {/* ── Photo + bouton refresh à côté ── */}
          <View style={sheetStyles.photoSection}>
            <View style={sheetStyles.photoThumb}>
              <Image source={photoSource} style={sheetStyles.photoThumbImg} contentFit="cover" />
              {isUploadingPhoto && (
                <View style={sheetStyles.photoThumbOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              )}
            </View>
            {/* Bouton refresh circulaire à côté de la photo */}
            <Pressable
              style={({ pressed }) => [sheetStyles.refreshBtn, pressed && { opacity: 0.6 }]}
              onPress={handleChangePhoto}
              disabled={isUploadingPhoto}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

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
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVITE SHEET — choisir le livre, afficher le code, partage natif iOS
// ═══════════════════════════════════════════════════════════════════════════════

interface InviteSheetProps {
  visible: boolean;
  onClose: () => void;
  challenges: Challenge[];
}

function InviteSheet({ visible, onClose, challenges }: InviteSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Pré-sélectionne le premier challenge à l'ouverture
  useEffect(() => {
    if (visible && challenges.length > 0) {
      setSelectedChallenge(challenges[0]);
    }
  }, [visible, challenges]);

  const handleCopy = async () => {
    if (!selectedChallenge?.invite_code) return;
    await Clipboard.setStringAsync(selectedChallenge.invite_code);
    Alert.alert('Copié !', 'Le code d\'invitation a été copié.');
  };

  /**
   * Partage natif iOS (share sheet) avec message + deep link.
   * Sur iOS, Share.share affiche la vraie share sheet native.
   */
  const handleShare = async () => {
    if (!selectedChallenge) return;
    const code = selectedChallenge.invite_code;
    const deepLink = selectedChallenge.invite_url || `bestiebookbattle://join/${code}`;
    const message = `Rejoins-moi pour lire "${selectedChallenge.book_title}" sur Bestie Book Battle ! 📚\n\nCode : ${code}\n${deepLink}`;
    try {
      await Share.share({ message, url: deepLink });
    } catch {
      // L'utilisateur a annulé le share
    }
  };

  if (!visible) return null;

  const hasMultipleChallenges = challenges.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Overlay sombre — tap = fermer */}
      <Animated.View style={sheetStyles.overlay} entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Même structure que GoalFormSheet : flex:1 + justifyContent:flex-end */}
      <View style={sheetStyles.keyboardAvoid}>
        <Animated.View
          style={[sheetStyles.sheet, { paddingBottom: Math.max(32, insets.bottom + 16) }]}
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
        >
        <View style={sheetStyles.handleRow}>
          <View style={sheetStyles.handle} />
        </View>

        <Text style={sheetStyles.title}>Inviter un ami</Text>

        {challenges.length === 0 ? (
          <Text style={sheetStyles.emptyText}>
            Tu n'as aucun projet de lecture actif pour le moment.
          </Text>
        ) : (
          <>
            {/* ── Sélecteur de livre (si plusieurs challenges) ── */}
            {hasMultipleChallenges && (
              <>
                <ScrollView
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
                          <Image
                            source={{ uri: c.cover_url }}
                            style={inviteStyles.bookCardCover}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={inviteStyles.bookCardNoCover}>
                            <Ionicons name="book-outline" size={24} color={colors.textTertiary} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* ── Affichage livre sélectionné (si un seul) ── */}
            {!hasMultipleChallenges && selectedChallenge && (
              <View style={inviteStyles.singleBook}>
                {selectedChallenge.cover_url ? (
                  <Image
                    source={{ uri: selectedChallenge.cover_url }}
                    style={inviteStyles.singleBookCover}
                    contentFit="cover"
                  />
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

            {/* ── Code d'invitation ── */}
            {selectedChallenge && (
              <>
                <Text style={sheetStyles.label}>Code d'invitation</Text>
                <Pressable style={inviteStyles.codeBox} onPress={handleCopy}>
                  <Text style={inviteStyles.codeText}>{selectedChallenge.invite_code}</Text>
                  <Ionicons name="copy-outline" size={20} color={colors.textTertiary} />
                </Pressable>

                <View style={{ marginTop: spacing.lg }}>
                  <Button3D variant="primary" onPress={handleShare} icon="share-outline" iconPosition="left">
                    Inviter à participer
                  </Button3D>
                </View>
              </>
            )}
          </>
        )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES PAGE PRINCIPALE
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
  headerSpacer: {
    width: 40,
  },

  // ─── Scroll ──────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: spacing['4xl'],
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
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  photo: {
    width: 90,
    height: 90,
  },
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
    borderRadius: 20,
    shadowColor: '#000000',
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  editButtonStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
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
  settingRowFirst: {
    paddingTop: spacing['3xl'],
  },
  settingRowPressed: {
    opacity: 0.6,
  },
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
  settingLabelDanger: {
    color: colors.error,
  },

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
// STYLES PARTAGÉS — bottom sheets (même pattern que GoalFormSheet)
// ═══════════════════════════════════════════════════════════════════════════════

const sheetStyles = StyleSheet.create({
  // Overlay plein écran — même pattern que GoalFormSheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  // flex:1 + justifyContent:flex-end = sheet ancré en bas (GoalFormSheet pattern)
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 9999,
    backgroundColor: colors.textSubtle,
  },
  title: {
    fontFamily: 'Rokkitt_Medium',
    fontSize: fontSize['3xl'],
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

  // ─── Section photo (EditProfileSheet) ───────────────────────────────────────
  // Photo carrée + bouton refresh à côté, ligne horizontale
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbImg: {
    width: 72,
    height: 72,
  },
  photoThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Bouton circulaire refresh — Button3D secondary compact lookalike
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // ─── Texte vide (InviteSheet) ─────────────────────────────────────────────────
  emptyText: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: spacing['3xl'],
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES SPÉCIFIQUES — InviteSheet
// ═══════════════════════════════════════════════════════════════════════════════

const inviteStyles = StyleSheet.create({
  // ─── Sélecteur de livres (scroll horizontal) ─────────────────────────────────
  bookPickerContent: {
    gap: spacing.md,
    paddingHorizontal: 2,
  },
  bookCard: {
    width: 100,
    alignItems: 'center',
    gap: spacing.sm,
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
    width: 72,
    height: 100,
    borderRadius: 4,
  },
  bookCardNoCover: {
    width: 72,
    height: 100,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Livre unique ─────────────────────────────────────────────────────────────
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

  // ─── Code d'invitation ────────────────────────────────────────────────────────
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
});
