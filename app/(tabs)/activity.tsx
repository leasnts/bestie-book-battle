/**
 * Page Notifications / Activité
 *
 * Affiche les alertes importantes du challenge actif :
 * milestones, dépassements, écarts, livre terminé, streak en danger, etc.
 *
 * Ce feed NE contient PAS "l'ami a lu 3 pages" car c'est du spam.
 * Les données viennent du notificationStore (persisté en local via AsyncStorage).
 *
 * Logique de l'image affichée :
 * - avatarSource === 'self'        → ma photo de profil
 * - avatarSource starts with http  → photo d'un autre utilisateur
 * - avatarSource === null          → image BBB par défaut (notif générale)
 * - aucune photo disponible        → image BBB par défaut (fallback)
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useProjectStore } from '../../stores/projectStore';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../../utils/constants';

// ─── Assets ──────────────────────────────────────────────────────────────────

const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

/**
 * Image BBB par défaut.
 * Affichée pour :
 * 1. Les notifications générales (streak, deadline, inactivité)
 * 2. Tout utilisateur sans photo de profil uploadée
 */
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/profile_picture_default.png');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formate une date ISO en texte relatif (ex: "Il y a 3 min", "Hier") */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Résout la source image à afficher pour une notification.
 *
 * - 'self' + photo dispo         → { uri: maPhoto }
 * - URL http(s)                  → { uri: url }
 * - null ou aucune photo dispo   → DEFAULT_PROFILE_IMAGE
 */
function resolveAvatarSource(
  avatarSource: 'self' | string | null,
  currentUserPhotoUrl: string | null | undefined
) {
  if (avatarSource === null) return DEFAULT_PROFILE_IMAGE;

  if (avatarSource === 'self') {
    if (
      currentUserPhotoUrl &&
      (currentUserPhotoUrl.startsWith('http://') ||
        currentUserPhotoUrl.startsWith('https://'))
    ) {
      return { uri: currentUserPhotoUrl };
    }
    return DEFAULT_PROFILE_IMAGE;
  }

  // URL directe d'un autre utilisateur
  if (avatarSource.startsWith('http://') || avatarSource.startsWith('https://')) {
    return { uri: avatarSource };
  }

  return DEFAULT_PROFILE_IMAGE;
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeChallenge } = useProjectStore();
  const { notifications } = useNotificationStore();

  // Filtrer uniquement les notifs du challenge actif (s'il y en a un)
  const filtered = activeChallenge
    ? notifications.filter((n) => n.challengeId === activeChallenge.id)
    : notifications;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Texture de fond noise à 5% d'opacité */}
      <Image
        source={TEXTURE_IMAGE}
        style={styles.backgroundTexture}
        contentFit="cover"
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Button3D
          variant="secondary"
          icon="chevron-back"
          iconOnly
          size="compact"
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Contenu ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((item) => {
            const avatarSrc = resolveAvatarSource(
              item.avatarSource,
              user?.profile_photo_url
            );

            return (
              <View key={item.id} style={styles.row}>
                {/* Thumbnail carré 35×35 (radius 8px = borderRadius.sm) */}
                <View style={styles.avatarWrapper}>
                  <Image
                    source={avatarSrc}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                </View>

                {/* Texte */}
                <View style={styles.rowContent}>
                  <View style={styles.rowTopLine}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowTime}>
                      {formatRelativeTime(item.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.rowDescription} numberOfLines={1}>
                    {item.body}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── État vide ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.centerContainer}>
      <PopEyes variant="together" size="large" style={styles.emptyEyes} />
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptySubtitle}>
        Les alertes importantes (milestones, dépassements, streaks…) apparaîtront ici
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  backgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontFamily: 'Rokkitt',
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.regular as any,
    color: colors.textPrimary,
    lineHeight: 32,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },

  // Liste
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.lg,
  },

  // Ligne notification (style Figma : séparateur bas, pas de cards)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.alphaWhite30,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },

  // Texte
  rowContent: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    fontFamily: 'Inter',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold as any,
    color: colors.textPrimary,
    lineHeight: 20,
    flexShrink: 1,
  },
  rowTime: {
    fontFamily: 'Inter',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular as any,
    color: colors.textPlaceholder,
    lineHeight: 18,
    flexShrink: 0,
  },
  rowDescription: {
    fontFamily: 'Inter',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular as any,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // État vide
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing['2xl'],
    gap: spacing.md,
  },
  emptyEyes: {
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'Rokkitt',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold as any,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular as any,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
});
