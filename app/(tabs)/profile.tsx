/**
 * 👤 Page Profil — v4 : ma vie de lectrice
 *
 *    ┌──────────────────────────────────┐
 *    │ ▦▦ patchwork de la charte ▦▦ (⚙) │  ← la roue dentée ouvre les Réglages
 *    │            [ photo ]             │
 *    │              Lea                 │
 *    │          [ Modifier ]            │
 *    │  ┌────────────────────────────┐  │
 *    │  │ livres finis │ pages │ série│  │  ← cadre papier à cheval sur le fond
 *    │  └────────────────────────────┘  │
 *    │  ┌ Lire à plusieurs ──── (◉◉) ┐  │  ← la bannière pour inviter
 *    │  Mes livres lus                  │
 *    │  [▮] [▮] [┄] [┄] →               │  ← couvertures seules, places vides cousues
 *    │  ═════════════════════           │     sur l'étagère de la bibliothèque
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
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PageTransition from '../../components/PageTransition';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { POP_EYES_HEIGHT, POP_EYES_PATH, POP_EYES_WIDTH } from '../../components/brand/popEyesPath';
import AccentWord from '../../components/ui/AccentWord';
import BookCover, { COVER_RATIO } from '../../components/ui/BookCover';
import { SHELF_BAR_H, SHELF_OVERLAP, ShelfBar } from '../../components/ui/BookLibrary';
import PatchworkBackdrop from '../../components/ui/PatchworkBackdrop';
import PressableScale from '../../components/ui/PressableScale';
import GlassButton from '../../components/ui/GlassButton';
import GlassSection from '../../components/ui/GlassSection';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import { StitchBorder, StitchLine } from '../../components/ui/Stitch';
import { STREAK_FLAME } from '../../components/ui/StreakPill';
import { myCoverUrl } from '../../services/myEdition';
import { getMyReadingDays } from '../../services/supabase/database';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { accentGradient, borderRadius, colors, creamAlpha, fonts, fontSize, lowki, paperFrameGradient, spacing } from '../../utils/constants';
import { readingOf } from '../../utils/library';
import { resolvePhotoSource } from '../../utils/profilePhoto';
import { longestStreak } from '../../utils/streak';

/** Le ruban brodé des livres terminés (bibliothèque) */
const RIBBON_DONE = require('../../assets/images/ribbons/ribbon-done.png');

const PHOTO = 112;
/** Le cadre des chiffres remonte sur le fond de cette hauteur */
const STATS_OVERLAP = 44;
/** Couvertures de l'étagère : la taille de la bibliothèque */
const COVER_H = 110;
const COVER_W = Math.round(COVER_H * COVER_RATIO);
const SHELF_GAP = spacing.xl;
const SIDE = spacing.lg;
/** La bannière : taille du titre, et les yeux qui débordent à droite */
const BANNER_TITLE = 22;
const BANNER_EYES_W = 150;

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
        {/* ═══════════ EN-TÊTE : moi, sur le patchwork de la charte ═══════════ */}
        <View style={[styles.hero, { paddingTop: insets.top + spacing['3xl'] }]}>
          <PatchworkBackdrop />
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

        {/* ═══════════ INVITER ═══════════ */}
        <InviteBanner onPress={() => router.push('/invite')} />

        {/* ═══════════ MES LIVRES LUS : les couvertures seules, sur l'étagère ═══════════ */}
        <View style={styles.shelfSection}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Mes livres lus
          </Text>
          <ReadShelf
            covers={finished.map((book) => ({
              id: book.id,
              title: book.book_title,
              uri: myCoverUrl(book, myProgress[book.id]),
            }))}
          />
        </View>
      </ScrollView>
    </PageTransition>
  );
}

/** 2140 → « 2 140 » (espace insécable ; Hermes ignore toLocaleString) */
function formatNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

// ─── La bannière pour inviter ────────────────────────────────────────────────

function InviteBanner({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale
      style={styles.banner}
      pressedScale={0.97}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Inviter quelqu'un à lire avec toi"
    >
      <LinearGradient colors={accentGradient} style={[StyleSheet.absoluteFill, styles.bannerFill]} />
      {/* Les yeux de bbb en ton sur ton (rouge foncé → profond), gravés d'un liseré clair, qui débordent à droite */}
      <View style={styles.bannerEyes} pointerEvents="none">
        <Svg width={BANNER_EYES_W} height={(BANNER_EYES_W * POP_EYES_HEIGHT) / POP_EYES_WIDTH} viewBox={`0 0 ${POP_EYES_WIDTH} ${POP_EYES_HEIGHT}`}>
          <Defs>
            <SvgGradient id="banner-eyes" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lowki.red.dark} />
              <Stop offset="1" stopColor={lowki.red.deep} />
            </SvgGradient>
          </Defs>
          <Path d={POP_EYES_PATH} fill={creamAlpha(0.16)} translateY={16} />
          <Path d={POP_EYES_PATH} fill="url(#banner-eyes)" />
        </Svg>
      </View>
      <StitchBorder radius={borderRadius.xl} color={creamAlpha(0.35)} />
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>
          <AccentWord text="Lire à plusieurs" accent="plusieurs" size={BANNER_TITLE} />
        </Text>
        <Button3D variant="secondary" size="small" onPress={onPress} style={styles.bannerButton}>
          Inviter
        </Button3D>
      </View>
    </PressableScale>
  );
}

// ─── L'étagère des livres lus ────────────────────────────────────────────────

/**
 * Les couvertures sur la barre en verre de la bibliothèque. La rangée est
 * toujours pleine jusqu'au bord de l'écran : après les livres (ou à leur place,
 * s'il n'y en a aucun), des places vides cousues attendent les prochains.
 */
function ReadShelf({ covers }: { covers: { id: string; title: string; uri: string | null }[] }) {
  const { width } = useWindowDimensions();
  // Assez de places pour remplir l'écran, la dernière coupée par le bord
  const slots = Math.ceil((width - SIDE) / (COVER_W + SHELF_GAP));
  const empty = Math.max(slots - covers.length, 0);

  return (
    <View style={styles.shelf}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfRow}>
        {covers.map((cover) => (
          <View key={cover.id} style={styles.shelfCover} accessible accessibilityLabel={cover.title}>
            <BookCover coverUrl={cover.uri} outlined />
          </View>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <View key={`empty-${i}`} style={styles.shelfCover} accessible={false}>
            <LinearGradient colors={paperFrameGradient} style={[StyleSheet.absoluteFill, styles.emptyCover]} />
            <StitchBorder radius={4} inset={5} />
          </View>
        ))}
      </ScrollView>
      <ShelfBar />
    </View>
  );
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
      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>
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
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
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
  },

  // ─── Bannière ───────────────────────────────────────────────────────────────
  banner: {
    marginTop: spacing['2xl'],
    marginHorizontal: SIDE,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    minHeight: 112,
    justifyContent: 'center',
  },
  bannerFill: {
    borderRadius: borderRadius.xl,
  },
  bannerEyes: {
    position: 'absolute',
    right: -28,
    bottom: -18,
    transform: [{ rotate: '-8deg' }],
  },
  bannerContent: {
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontFamily: fonts.display,
    fontSize: BANNER_TITLE,
    lineHeight: 28,
    // Sur le rouge, le texte passe en beurre clair (charte : ≥ 5,3:1)
    color: lowki.butter.light,
    maxWidth: '62%',
  },
  bannerButton: {
    alignSelf: 'flex-start',
  },

  // ─── Mes livres lus ──────────────────────────────────────────────────────────
  shelfSection: {
    marginTop: spacing['3xl'],
    gap: spacing.md,
  },
  sectionTitle: {
    paddingHorizontal: SIDE,
    fontFamily: fonts.display,
    fontSize: fontSize.lg,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  // paddingBottom : la partie de la barre qui dépasse sous les couvertures
  shelf: {
    marginHorizontal: SIDE,
    paddingBottom: SHELF_BAR_H - SHELF_OVERLAP,
  },
  shelfRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: SHELF_GAP,
  },
  shelfCover: {
    width: COVER_W,
    height: COVER_H,
  },
  emptyCover: {
    borderRadius: 4,
    opacity: 0.8,
  },
});
