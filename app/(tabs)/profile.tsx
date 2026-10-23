/**
 * 👤 Page Profil — v4 : ma vie de lectrice
 *
 *    ┌──────────────────────────────────┐
 *    │ ░░ fond papier vivant ░░    (⚙)  │  ← la roue dentée ouvre les Réglages
 *    │            [ photo ]             │
 *    │              Lea                 │
 *    │          [ Modifier ]            │
 *    │  ┌────────────────────────────┐  │
 *    │  │ livres finis │ pages │ série│  │  ← cadre papier à cheval sur le fond
 *    │  └────────────────────────────┘  │
 *    │  Mes livres lus                  │
 *    │  [▮] [▮] [▮] [▮] →               │  ← couvertures seules, défilent
 *    └──────────────────────────────────┘
 *
 * Tous les réglages (rappel, sons, déconnexion, suppression…) vivent dans le
 * sheet /settings. Ici, rien que moi et mes lectures.
 *
 * Les chiffres viennent du cache (projectStore.myProgress, rafraîchi à chaque
 * visite) : livres finis et pages lues tout de suite ; la meilleure série
 * arrive dès que l'historique est lu, sans loader (un tiret en attendant).
 */

import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpenIcon, PencilIcon, SettingsIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PageTransition from '../../components/PageTransition';
import BookCover, { COVER_RATIO } from '../../components/ui/BookCover';
import DriftingBackdrop from '../../components/ui/DriftingBackdrop';
import GlassButton from '../../components/ui/GlassButton';
import GlassSection from '../../components/ui/GlassSection';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import { StitchLine } from '../../components/ui/Stitch';
import { STREAK_FLAME } from '../../components/ui/StreakPill';
import { myCoverUrl } from '../../services/myEdition';
import { getMyReadingDays } from '../../services/supabase/database';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { borderRadius, colors, creamAlpha, fonts, fontSize, spacing } from '../../utils/constants';
import { readingOf } from '../../utils/library';
import { resolvePhotoSource } from '../../utils/profilePhoto';
import { longestStreak } from '../../utils/streak';

/** Le ruban brodé des livres terminés (bibliothèque) */
const RIBBON_DONE = require('../../assets/images/ribbons/ribbon-done.png');

const PHOTO = 112;
/** Le cadre des chiffres remonte sur le fond de cette hauteur */
const STATS_OVERLAP = 44;
const SHELF_COVER = 84;
/** Le sable de l'en-tête : tons neutres, aucun livre précis ici */
const HERO_PAPER = '#e5d6c3';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const user = useAuthStore((state) => state.user);
  const challenges = useProjectStore((state) => state.challenges);
  const myProgress = useProjectStore((state) => state.myProgress);
  const loadMyProgress = useProjectStore((state) => state.loadMyProgress);
  const loadUserChallenges = useProjectStore((state) => state.loadUserChallenges);
  const [bestStreak, setBestStreak] = useState<number | null>(null);

  // Charge les livres si pas encore en mémoire (ex : arrivée directe sur le profil)
  useEffect(() => {
    if (user?.id && challenges.length === 0) loadUserChallenges(user.id);
  }, [user?.id]);

  // À chaque visite : ma progression (le cache s'affiche d'abord) et ma meilleure série
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      loadMyProgress(user.id);
      getMyReadingDays(user.id)
        .then((days) => setBestStreak(longestStreak(days)))
        .catch(() => {});
    }, [user?.id, loadMyProgress]),
  );

  // Mes livres terminés, le plus récent d'abord
  const finished = useMemo(
    () =>
      challenges
        .filter((book) => readingOf(myProgress[book.id]).state === 'done')
        .sort((a, b) =>
          (myProgress[b.id]?.last_updated_at ?? '').localeCompare(myProgress[a.id]?.last_updated_at ?? ''),
        ),
    [challenges, myProgress],
  );

  const pagesRead = useMemo(
    () => Object.values(myProgress).reduce((sum, progress) => sum + (progress.current_page || 0), 0),
    [myProgress],
  );

  const photoSource = resolvePhotoSource(user?.profile_photo_url, user?.updated_at);

  return (
    <PageTransition>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: tabBarInset + spacing['2xl'] }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════ EN-TÊTE : moi, sur un fond papier vivant ═══════════ */}
        <View style={[styles.hero, { paddingTop: insets.top + spacing['3xl'] }]}>
          <DriftingBackdrop paper={HERO_PAPER} />
          <GlassButton
            icon={SettingsIcon}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Réglages"
            style={[styles.settingsButton, { top: insets.top + spacing.sm }]}
          />
          <View style={styles.photo}>
            <Image source={photoSource} style={StyleSheet.absoluteFill} contentFit="cover" />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {user?.first_name || 'Lecteur'}
          </Text>
          <Button3D
            variant="secondary"
            icon={PencilIcon}
            onPress={() => router.push('/edit-profile')}
            style={styles.editButton}
          >
            Modifier
          </Button3D>
        </View>

        {/* ═══════════ MES CHIFFRES ═══════════ */}
        <GlassSection paper style={styles.stats}>
          <View style={styles.statsRow}>
            <Stat icon={<Image source={RIBBON_DONE} style={styles.ribbon} contentFit="contain" />} value={finished.length} label="livres finis" />
            <StitchLine vertical />
            {/* En attendant l'icône maison des pages */}
            <Stat icon={<BookOpenIcon size={22} color={colors.textSecondary} />} value={pagesRead} label="pages lues" />
            <StitchLine vertical />
            <Stat
              icon={<Image source={STREAK_FLAME} style={styles.flame} contentFit="contain" />}
              value={bestStreak}
              unit=" j"
              label="meilleure série"
            />
          </View>
        </GlassSection>

        {/* ═══════════ MES LIVRES LUS : les couvertures seules ═══════════ */}
        {finished.length > 0 && (
          <View style={styles.shelfSection}>
            <Text style={styles.sectionTitle}>Mes livres lus</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shelf}
            >
              {finished.map((book) => (
                <View
                  key={book.id}
                  style={styles.shelfCover}
                  accessible
                  accessibilityLabel={book.book_title}
                >
                  <BookCover coverUrl={myCoverUrl(book, myProgress[book.id])} outlined />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </PageTransition>
  );
}

/** 2140 → « 2 140 » (espace insécable ; Hermes ignore toLocaleString) */
function formatNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

// ─── Un chiffre ──────────────────────────────────────────────────────────────

function Stat({
  icon,
  value,
  unit = '',
  label,
}: {
  icon: React.ReactNode;
  value: number | null;
  unit?: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value === null ? '–' : `${formatNumber(value)}${unit}`}
      </Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },

  // ─── En-tête ─────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: STATS_OVERLAP + spacing['2xl'],
    overflow: 'hidden',
  },
  settingsButton: {
    position: 'absolute',
    right: spacing.lg,
  },
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: creamAlpha(0.9),
    backgroundColor: colors.bgLight,
  },
  name: {
    marginTop: spacing.lg,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  editButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },

  // ─── Chiffres ────────────────────────────────────────────────────────────────
  stats: {
    marginTop: -STATS_OVERLAP,
    marginHorizontal: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  statIcon: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ribbon: { width: 14, height: 28 },
  flame: { width: 24, height: 24 },
  statValue: {
    fontFamily: fonts.display,
    fontSize: fontSize['2xl'],
    lineHeight: 30,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
    lineHeight: 16,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // ─── Mes livres lus ──────────────────────────────────────────────────────────
  shelfSection: {
    marginTop: spacing['3xl'],
    gap: spacing.md,
  },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.display,
    fontSize: fontSize.lg,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  shelf: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  shelfCover: {
    width: SHELF_COVER,
    height: SHELF_COVER / COVER_RATIO,
  },
});
