/**
 * 👤 Page Profil - Light Mode
 * 
 * - Photo de profil
 * - Stats de lecture
 * - Paramètres de notifications
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useProgressStore } from '../../stores/progressStore';
import { pickImage, uploadProfilePhoto } from '../../services/supabase/storage';

// 🎨 Noir & Blanc + Bleu Klein + Orange flamme
const COLORS = {
  bg: '#FAFAF8',
  bgLines: '#E8E8E4',
  card: '#FFFFFF',
  cardBorder: '#E0E0E0',
  primary: '#002FA7',
  text: '#1A1A1A',
  textDim: '#6B7280',
  textMuted: '#9CA3AF',
  flame: '#F59E0B',
  danger: '#DC2626',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const { participants } = useProgressStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Stats (simplifiées)
  const totalPagesRead = 145;
  const currentStreak = 5;

  /**
   * Changer la photo de profil
   * 
   * Process :
   * 1. Ouvre la galerie photo de l'iPhone via expo-image-picker
   * 2. Upload l'image sélectionnée vers Supabase Storage (bucket profile-photos)
   * 3. Sauvegarde l'URL publique dans la table users (colonne profile_photo_url)
   * 4. Met à jour le store Zustand pour que l'UI se rafraîchisse immédiatement
   */
  const handleChangeProfilePhoto = async () => {
    if (!user) return;

    try {
      // Étape 1 : Ouvrir la galerie et laisser l'utilisateur choisir une photo
      // pickImage() gère automatiquement la demande de permission
      const imageUri = await pickImage(true, [1, 1], 0.8);

      // L'utilisateur a annulé la sélection
      if (!imageUri) return;

      setIsUploadingPhoto(true);

      // Étape 2 : Upload vers Supabase Storage
      const { url } = await uploadProfilePhoto(user.id, imageUri);

      // Étape 3 : Sauvegarder l'URL dans la base de données et mettre à jour le store
      await updateProfile({ profile_photo_url: url });

    } catch (error: any) {
      console.error('Erreur changement photo de profil:', error);
      Alert.alert(
        'Erreur',
        'Impossible de changer ta photo de profil. Vérifie ta connexion et réessaie.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  /**
   * Modal native iOS : demande confirmation puis déconnecte
   *
   * Alert.alert utilise UIAlertController sur iOS = look et comportement natifs.
   * style: 'destructive' = bouton rouge pour les actions destructives.
   */
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

  return (
    <View style={styles.container}>
      {/* Lignes de cahier en fond */}
      <View style={styles.linesBackground}>
        {[...Array(30)].map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header avec photo */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Profil</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.headerContent}>
            {/* Avatar cliquable pour changer la photo de profil */}
            <Pressable onPress={handleChangeProfilePhoto} disabled={isUploadingPhoto}>
              <View style={styles.avatarContainer}>
                <Image
                  source={
                    typeof user?.profile_photo_url === 'string'
                      ? { uri: user.profile_photo_url }
                      : require('../../assets/images/lea.png')
                  }
                  style={styles.avatar}
                />
                {/* Overlay de chargement pendant l'upload */}
                {isUploadingPhoto && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
                {/* Petit bouton camera en bas à droite de l'avatar */}
                <View style={styles.cameraButton}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>
            <Text style={styles.name}>{user?.first_name || 'Lecteur'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Tes stats</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalPagesRead}</Text>
              <Text style={styles.statLabel}>Pages lues</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={24} color={COLORS.flame} />
                <Text style={[styles.statValue, { color: COLORS.flame }]}>{currentStreak}</Text>
              </View>
              <Text style={styles.statLabel}>Streak actuel</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.textDim} />
              <View>
                <Text style={styles.settingLabel}>Rappel quotidien</Text>
                <Text style={styles.settingHintInline}>À 20h si tu n'as pas lu</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.bgLines, true: COLORS.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <Pressable style={styles.actionRow} onPress={() => router.push('/onboarding/invite')}>
            <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Inviter un ami</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={handleLogoutPress}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            <Text style={[styles.actionLabel, { color: COLORS.danger }]}>Se déconnecter</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </Pressable>
        </View>

        {/* Version */}
        <Text style={styles.version}>Bestie Book Battle v1.0</Text>
      </ScrollView>

      {/* Indicateur de chargement pendant la déconnexion */}
      {isLoggingOut && (
        <View style={styles.logoutOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Lignes de cahier
  linesBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgLines,
  },

  content: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  email: {
    fontSize: 14,
    color: COLORS.textDim,
    marginTop: 4,
  },

  // Stats
  statsCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDim,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 4,
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgLines,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  settingHintInline: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Actions
  actionsCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgLines,
    gap: 12,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },

  // Version
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 24,
  },

  // Overlay pendant la déconnexion
  logoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

});
