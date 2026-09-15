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
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button3D from '../components/Button3D';
import PageTransition from '../components/PageTransition';
import { useSwipeBack } from '../hooks/useSwipeBack';
import PopEyes from '../components/PopEyes';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useProjectStore } from '../stores/projectStore';
import { borderRadius, colors, fonts, fontSize, spacing } from '../utils/constants';
import { ChevronLeftIcon } from 'lucide-react-native';

// ─── Assets ──────────────────────────────────────────────────────────────────

const TEXTURE_IMAGE = require('../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

/**
 * Image BBB par défaut.
 * Affichée pour :
 * 1. Les notifications générales (streak, deadline, inactivité)
 * 2. Tout utilisateur sans photo de profil uploadée
 */
const DEFAULT_PROFILE_IMAGE = require('../assets/images/pop-eyes.png');

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
 * - 'self' + photo dispo         → { source: { uri }, fit: 'cover' }
 * - URL http(s)                  → { source: { uri }, fit: 'cover' }
 * - null ou aucune photo dispo   → { source: DEFAULT_PROFILE_IMAGE, fit: 'contain' }
 *
 * On retourne aussi le `fit` pour que les PopEyes ne soient jamais coupés.
 */
function resolveAvatarSource(
  avatarSource: 'self' | string | null,
  currentUserPhotoUrl: string | null | undefined
): { source: any; fit: 'cover' | 'contain' } {
  if (avatarSource === null) return { source: DEFAULT_PROFILE_IMAGE, fit: 'contain' };

  if (avatarSource === 'self') {
    if (
      currentUserPhotoUrl &&
      (currentUserPhotoUrl.startsWith('http://') ||
        currentUserPhotoUrl.startsWith('https://'))
    ) {
      return { source: { uri: currentUserPhotoUrl }, fit: 'cover' };
    }
    return { source: DEFAULT_PROFILE_IMAGE, fit: 'contain' };
  }

  // URL directe d'un autre utilisateur
  if (avatarSource.startsWith('http://') || avatarSource.startsWith('https://')) {
    return { source: { uri: avatarSource }, fit: 'cover' };
  }

  return { source: DEFAULT_PROFILE_IMAGE, fit: 'contain' };
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeChallenge } = useProjectStore();
  const { notifications } = useNotificationStore();

  // Swipe vers la droite pour fermer l'activité (symétrique à l'ouverture)
  const swipeGesture = useSwipeBack('right');

  // Filtrer uniquement les notifs du challenge actif (s'il y en a un)
  const filtered = activeChallenge
    ? notifications.filter((n) => n.challengeId === activeChallenge.id)
    : notifications;

  return (
    <PageTransition>
    <GestureDetector gesture={swipeGesture}>
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
          icon={ChevronLeftIcon}
          iconOnly
          size="compact"
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/*
        Liste virtualisée : le fil d'activité grandit avec chaque enregistrement
        de chaque participante. Dans un book club de 200 personnes il atteint
        vite plusieurs milliers d'entrées.

        `ListEmptyComponent` remplace le ternaire : FlatList sait déjà gérer le
        cas vide, sans dupliquer la structure.
      */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item }) => {
          const { source: avatarSrc, fit: avatarFit } = resolveAvatarSource(
            item.avatarSource,
            user?.profile_photo_url
          );

          return (
            <View style={styles.row}>
                {/* Thumbnail carré 48×48 */}
                <View style={styles.avatarWrapper}>
                  <Image
                    source={avatarSrc}
                    style={styles.avatarImage}
                    contentFit={avatarFit}
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
        }}
      />
    </SafeAreaView>
    </GestureDetector>
    </PageTransition>
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
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
    lineHeight: 28,
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
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    flexShrink: 1,
  },
  rowTime: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textPlaceholder,
    lineHeight: 18,
    flexShrink: 0,
  },
  rowDescription: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
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
    fontFamily: fonts.display,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
});
