/**
 * Page Notifications / Activité
 *
 * L'historique des notifs du groupe du livre actif (#178) : une pote passe
 * devant, le carnet. La source est le serveur ; le notificationStore le garde
 * sur le téléphone pour s'ouvrir plein. Toucher une ligne ouvre l'écran dont
 * elle parle.
 */

import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect } from 'react';
import {
  FlatList,
  Pressable,
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
import { useNotificationStore } from '../stores/notificationStore';
import { useProjectStore } from '../stores/projectStore';
import { borderRadius, colors, fonts, fontSize, spacing } from '../utils/constants';
import { ChevronLeftIcon } from 'lucide-react-native';

// ─── Assets ──────────────────────────────────────────────────────────────────


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

// ─── Composant principal ─────────────────────────────────────────────────────

export default function ActivityScreen() {
  const router = useRouter();
  const { activeChallenge } = useProjectStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const load = useNotificationStore((s) => s.load);

  // Ce qu'on avait s'affiche tout de suite ; le serveur complète
  useEffect(() => {
    load().catch((error) => console.warn('[activité]', error));
  }, [load]);

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
        renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(item.url as Href)}
              accessibilityRole="button"
            >
                <View style={styles.avatarWrapper}>
                  <Image source={DEFAULT_PROFILE_IMAGE} style={styles.avatarImage} contentFit="contain" />
                </View>

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
            </Pressable>
        )}
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
      <Text style={styles.emptyTitle}>Rien pour l’instant</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
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
