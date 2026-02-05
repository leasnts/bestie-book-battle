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
import { useDemoStore, DemoMode } from '../../stores/demoStore';

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
  const { user, logout } = useAuthStore();
  const { participants } = useProgressStore();
  const { mode, setMode } = useDemoStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Stats (simplifiées)
  const totalPagesRead = 145;
  const currentStreak = 5;

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Tu veux te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            // On attend que logout() se termine
            await logout();
            router.replace('/auth/login');
          }
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
            <Image
              source={
                typeof user?.profilePhotoUrl === 'string'
                  ? { uri: user.profilePhotoUrl }
                  : user?.profilePhotoUrl || require('../../assets/images/lea.png')
              }
              style={styles.avatar}
            />
            <Text style={styles.name}>{user?.name || 'Lecteur'}</Text>
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

        {/* Mode Démo */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>🧪 Mode Démo</Text>
          <Text style={styles.demoSubtitle}>Teste différents états de l'app</Text>

          <Pressable 
            style={[styles.demoOption, mode === 'with_friend' && styles.demoOptionActive]}
            onPress={() => setMode('with_friend')}
          >
            <View style={styles.demoRadio}>
              {mode === 'with_friend' && <View style={styles.demoRadioInner} />}
            </View>
            <View style={styles.demoOptionText}>
              <Text style={styles.demoOptionLabel}>Avec données</Text>
              <Text style={styles.demoOptionDesc}>Toi + Zoé lisez ensemble</Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.demoOption, mode === 'solo' && styles.demoOptionActive]}
            onPress={() => setMode('solo')}
          >
            <View style={styles.demoRadio}>
              {mode === 'solo' && <View style={styles.demoRadioInner} />}
            </View>
            <View style={styles.demoOptionText}>
              <Text style={styles.demoOptionLabel}>Solo</Text>
              <Text style={styles.demoOptionDesc}>Projet créé, personne n'a rejoint</Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.demoOption, mode === 'empty' && styles.demoOptionActive]}
            onPress={() => setMode('empty')}
          >
            <View style={styles.demoRadio}>
              {mode === 'empty' && <View style={styles.demoRadioInner} />}
            </View>
            <View style={styles.demoOptionText}>
              <Text style={styles.demoOptionLabel}>Vide</Text>
              <Text style={styles.demoOptionDesc}>Aucun projet créé ou rejoint</Text>
            </View>
          </Pressable>
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

          <Pressable style={[styles.actionRow, styles.actionRowLast]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            <Text style={[styles.actionLabel, { color: COLORS.danger }]}>Se déconnecter</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </Pressable>
        </View>

        {/* Version */}
        <Text style={styles.version}>Bestie Book Battle v1.0</Text>
      </ScrollView>
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
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: COLORS.primary,
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

  // Demo Mode
  demoCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  demoSubtitle: {
    fontSize: 13,
    color: COLORS.textDim,
    marginBottom: 16,
  },
  demoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  demoOptionActive: {
    backgroundColor: COLORS.primary + '08',
    borderColor: COLORS.primary,
  },
  demoRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  demoOptionText: {
    flex: 1,
  },
  demoOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  demoOptionDesc: {
    fontSize: 12,
    color: COLORS.textDim,
  },
});
