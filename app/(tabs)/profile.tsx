/**
 * 👤 Page Profil — v4 : ma vie de lectrice
 *
 *    ┌──────────────────────────────────┐
 *    │ ░░ papier aquarelle ░░░░░░ (⚙) │  ← la roue dentée ouvre les Réglages
 *    │            [ photo ]             │
 *    │              Lea ✎               │  ← prénom centré, le crayon à sa droite
 *    │  ┌────────────────────────────┐  │
 *    ╰◡◡│ livres finis │ pages │ série│◡◡╯  ← bas coupé en festons
 *    │  └────────────────────────────┘  │  ← verre dépoli, moitié sur l’aquarelle, moitié dehors
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
import { ChevronRightIcon, PencilIcon, SettingsIcon } from 'lucide-react-native';
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
import PaperWashBackdrop from '../../components/ui/PaperWashBackdrop';
import PressableScale from '../../components/ui/PressableScale';
import GlassButton from '../../components/ui/GlassButton';
import GlassMaterial from '../../components/ui/GlassMaterial';
import GlassSection from '../../components/ui/GlassSection';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import { StitchBorder, StitchLine } from '../../components/ui/Stitch';
import { myCoverUrl } from '../../services/myEdition';
import { getMyReadingDays } from '../../services/supabase/database';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { accentGradient, borderRadius, colors, creamAlpha, fonts, fontSize, glassVeil, lowki, spacing } from '../../utils/constants';
import { readingOf } from '../../utils/library';
import { resolvePhotoSource } from '../../utils/profilePhoto';
import { longestStreak } from '../../utils/streak';


const PHOTO = 112;
/** L'anneau de verre autour de la photo */
const PHOTO_RING = 5;
/** Sous l'en-tête : la place des festons, pour qu'ils se voient sur toute la largeur */
const HERO_BOTTOM = spacing['3xl'] + 14;
/** Le crayon à droite du prénom (et sa place vide à gauche, pour garder le prénom centré) */
const EDIT_ICON = 18;
/** Le cadre des chiffres remonte de la moitié de sa hauteur sur l'aquarelle */
const STATS_OVERLAP = 44;
/** Étagère : 4 places tiennent pile sur la barre, sans défiler */
const SHELF_SLOTS = 4;
const SHELF_GAP = spacing.xl;
const SHELF_PAD = spacing.md;
/** Au-delà de 4, l'étagère défile sur mes 10 derniers ; au-delà de 10, « Tout voir » */
const SHELF_MAX = 10;
const SIDE = spacing.lg;
/** Une place vide : le verre des cadres de l'accueil, aux coins d'une couverture */
const EMPTY_RADIUS = 4;
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
        {/* ═══════════ EN-TÊTE : moi, sur le papier aquarelle ═══════════ */}
        <View style={[styles.hero, { paddingTop: insets.top + spacing['3xl'] }]}>
          <PaperWashBackdrop />
          <GlassButton
            icon={SettingsIcon}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Réglages"
            style={[styles.settingsButton, { top: insets.top + spacing.sm }]}
          />
          {/* La photo ronde, dans un anneau de verre clair au liseré des boutons en verre */}
          <View style={styles.photoRing}>
            <GlassMaterial radius={PHOTO / 2 + PHOTO_RING} veil={0.3} rim />
            <View style={styles.photo}>
              <Image source={photoSource} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
          </View>
          {/* Le prénom reste centré : une place vide à gauche équilibre le crayon */}
          <View style={styles.nameRow}>
            <View style={styles.editSlot} />
            <Text style={styles.name} numberOfLines={1}>
              {user?.first_name || 'Lecteur'}
            </Text>
            <PressableScale
              onPress={() => router.push('/edit-profile')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Modifier mon profil"
              style={styles.editSlot}
            >
              <PencilIcon size={EDIT_ICON} color={colors.white} strokeWidth={2.2} />
            </PressableScale>
          </View>
        </View>

        {/* ═══════════ MES CHIFFRES, à cheval sur l'aquarelle ═══════════ */}
        <GlassSection frosted style={styles.stats}>
          <View style={styles.statsRow}>
            <Stat value={finished.length} label="livres finis" />
            <StitchLine vertical />
            <Stat value={pagesRead} label="pages lues" />
            <StitchLine vertical />
            <Stat value={bestStreak} unit=" j" label="meilleure série" />
          </View>
        </GlassSection>

        {/* ═══════════ INVITER ═══════════ */}
        <InviteBanner onPress={() => router.push('/invite')} />

        {/* ═══════════ MES LIVRES LUS : les couvertures seules, sur l'étagère ═══════════ */}
        <View style={styles.shelfSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Mes livres lus
            </Text>
            {finished.length > SHELF_MAX && (
              <PressableScale
                onPress={() => router.push({ pathname: '/library', params: { filter: 'done' } })}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Voir tous mes livres lus"
                style={styles.seeAll}
              >
                <Text style={styles.seeAllText}>Tout voir</Text>
                <ChevronRightIcon size={16} color={colors.textSecondary} />
              </PressableScale>
            )}
          </View>
          <ReadShelf
            covers={finished.slice(0, SHELF_MAX).map((book) => ({
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
 * Les couvertures sur la barre en verre de la bibliothèque, à une taille qui
 * fait tenir 4 places pile sur la barre :
 * - 4 livres ou moins : les livres, puis des places vides cousues, sans défiler ;
 * - plus : mes 10 derniers défilent d'un bord de l'écran à l'autre.
 */
function ReadShelf({ covers }: { covers: { id: string; title: string; uri: string | null }[] }) {
  const { width } = useWindowDimensions();
  const coverW = (width - 2 * SIDE - 2 * SHELF_PAD - (SHELF_SLOTS - 1) * SHELF_GAP) / SHELF_SLOTS;
  const size = { width: coverW, height: coverW / COVER_RATIO };
  const scrolls = covers.length > SHELF_SLOTS;
  const empty = Math.max(SHELF_SLOTS - covers.length, 0);

  return (
    <View style={styles.shelf}>
      <ScrollView
        horizontal
        scrollEnabled={scrolls}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelfRow}
      >
        {covers.map((cover) => (
          <View key={cover.id} style={size} accessible accessibilityLabel={cover.title}>
            <BookCover coverUrl={cover.uri} outlined />
          </View>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <View key={`empty-${i}`} style={size} accessible={false}>
            <GlassMaterial radius={EMPTY_RADIUS} veil={glassVeil} edgeColor={creamAlpha(0.9)} />
            <StitchBorder radius={EMPTY_RADIUS} inset={5} />
          </View>
        ))}
      </ScrollView>
      <ShelfBar style={styles.shelfBar} />
    </View>
  );
}

// ─── Un chiffre ──────────────────────────────────────────────────────────────

function Stat({
  value,
  unit = '',
  label,
}: {
  value: number | null;
  unit?: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
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
    paddingBottom: HERO_BOTTOM + STATS_OVERLAP,
    overflow: 'hidden',
  },
  settingsButton: {
    position: 'absolute',
    right: spacing.lg,
  },
  photoRing: {
    width: PHOTO + 2 * PHOTO_RING,
    height: PHOTO + 2 * PHOTO_RING,
    borderRadius: PHOTO / 2 + PHOTO_RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: PHOTO / 2,
    overflow: 'hidden',
    backgroundColor: colors.bgLight,
  },
  nameRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: '80%',
  },
  editSlot: {
    width: EDIT_ICON,
    alignItems: 'center',
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    // Blanc sur l'aquarelle colorée (Lea, 2026-10-23)
    color: colors.white,
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
    paddingVertical: spacing.xs,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.lg,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  // Les couvertures défilent d'un bord de l'écran à l'autre, jamais coupées par
  // la marge ; seule la barre garde la marge de la page.
  // paddingBottom : la partie de la barre qui dépasse sous les couvertures
  shelf: {
    paddingBottom: SHELF_BAR_H - SHELF_OVERLAP,
  },
  shelfBar: {
    left: SIDE,
    right: SIDE,
  },
  shelfRow: {
    paddingHorizontal: SIDE + SHELF_PAD,
    paddingTop: spacing.xs,
    gap: SHELF_GAP,
  },
});
