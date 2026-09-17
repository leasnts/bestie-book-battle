/**
 * Composant BookLibrary
 *
 * La bibliothèque : tous mes livres, rangés sur des étagères empilées,
 * trois couvertures par étagère, sous un bouton « Trier par ».
 *
 *    ▐██▌    ┏━━┓    ▛▀▀▜
 *   ░░░░░░░░░░░░░░░░░░░░░░   ← barre en verre flouté, avec ses vis
 *
 * L'étagère est celle de l'ancien accueil, à l'identique : une barre en verre
 * sombre (flou + noyer à 30 %) posée PAR-DESSUS le bas des couvertures, qui
 * passent donc derrière elle.
 *
 * Chaque couverture porte une pastille d'état dans son coin haut droit (pas
 * commencé, en cours, terminé : cf. ReadingStateBadge), calculée à partir de
 * MA progression.
 *
 * Toucher une couverture l'affiche sur l'accueil et ferme le sheet.
 *
 * Volontairement sans habillage de sheet : c'est la route `/library` qui le
 * présente, et c'est iOS qui dessine le sheet lui-même.
 */

import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Challenge } from '../../types/supabase';
import { colors, creamAlpha, motion, shadowAlpha, spacing } from '../../utils/constants';
import { BookReading, LibrarySort, LIBRARY_SORTS, readingLabel } from '../../utils/library';
import BookCover, { COVER_RATIO } from './BookCover';
import PressableScale from './PressableScale';
import ReadingStateBadge from './ReadingStateBadge';
import SortMenu from './SortMenu';

// ─── Props ─────────────────────────────────────────────────────────

interface BookLibraryProps {
  /** Tous mes livres, déjà triés */
  challenges: Challenge[];
  /** Où j'en suis de chaque livre, par id */
  readings: Record<string, BookReading>;
  /** ID du livre affiché sur l'accueil */
  activeChallengeId: string | null;
  /** Toucher une couverture */
  onSelect: (challenge: Challenge) => void;
  sort: LibrarySort;
  onSortChange: (sort: LibrarySort) => void;
}

// ─── Constantes (reprises de l'ancienne étagère de l'accueil) ──────

const BOOKS_PER_SHELF = 3;
const COVER_H = 110;
const COVER_W = Math.round(COVER_H * COVER_RATIO); // 79
const SHELF_BAR_H = 24;        // hauteur de la barre d'étagère
const SHELF_OVERLAP = 14;      // de combien la barre chevauche le bas des couvertures
/** De combien la pastille d'état déborde du coin de la couverture */
const BADGE_OVERHANG = 9;
/** Pastille si le livre n'est pas encore dans `readings` (premier chargement) */
const UNREAD: BookReading = { state: 'unread', percent: 0 };

// ─── Vis métallique de l'étagère ──────────────────────────────────
// Le design Figma utilise un conic-gradient pour un effet de vis chromée.
// React Native SVG ne sait pas faire de gradient conique : on découpe le
// disque en 24 tranches de 15°, chacune avec la luminosité du gradient à son angle.

const SCREW_SIZE = 10;
const SCREW_SEGMENTS = 24;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Luminosité (0-255) du reflet métallique à un angle donné */
function screwGray(deg: number): number {
  deg = ((deg % 360) + 360) % 360;
  if (deg >= 90 && deg < 270) return Math.round(lerp(217, 128, (deg - 90) / 180));
  if (deg >= 270) return Math.round(lerp(128, 255, (deg - 270) / 90));
  if (deg < 45) return Math.round(lerp(255, 127, deg / 45));
  return Math.round(lerp(127, 115, (deg - 45) / 45));
}

/** Chemin SVG d'une tranche de camembert */
function screwSlice(r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = r + r * Math.cos(toRad(startDeg));
  const y1 = r + r * Math.sin(toRad(startDeg));
  const x2 = r + r * Math.cos(toRad(endDeg));
  const y2 = r + r * Math.sin(toRad(endDeg));
  return `M${r},${r} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

// Pré-calculé une seule fois au chargement du module
const SCREW_DATA = Array.from({ length: SCREW_SEGMENTS }, (_, i) => {
  const start = (i * 360) / SCREW_SEGMENTS;
  const gray = screwGray(start);
  return {
    d: screwSlice(5, start, start + 360 / SCREW_SEGMENTS),
    // Métal légèrement doré plutôt qu'acier gris, pour rester dans la palette chaude
    fill: `rgb(${gray},${Math.round(gray * 0.95)},${Math.round(gray * 0.88)})`,
  };
});

function ShelfScrew() {
  return (
    <Svg width={SCREW_SIZE} height={SCREW_SIZE} viewBox="0 0 10 10">
      {SCREW_DATA.map((slice, i) => (
        <Path key={i} d={slice.d} fill={slice.fill} />
      ))}
    </Svg>
  );
}

// ─── Une étagère ───────────────────────────────────────────────────

function Shelf({
  books,
  index,
  readings,
  activeChallengeId,
  onSelect,
  animate,
}: {
  books: Challenge[];
  index: number;
  readings: Record<string, BookReading>;
  activeChallengeId: string | null;
  onSelect: (challenge: Challenge) => void;
  animate: boolean;
}) {
  // Les étagères apparaissent l'une après l'autre, cascade plafonnée
  const delay = Math.min(index * motion.stagger, 240);

  // On complète toujours la rangée à 3 places : une étagère à 1 livre garde
  // ses couvertures alignées sur les colonnes des étagères du dessus.
  const padded: (Challenge | null)[] = [...books];
  while (padded.length < BOOKS_PER_SHELF) padded.push(null);

  return (
    <Animated.View
      style={styles.shelf}
      entering={
        animate
          ? FadeInDown.duration(motion.duration.entrance)
              .delay(delay)
              .easing(Easing.bezier(...motion.easing.easeOutQuart).factory())
          : undefined
      }
    >
      {/* ── Couvertures, derrière la barre ── */}
      <View style={styles.row}>
        {padded.map((challenge, i) => {
          if (!challenge) return <View key={i} style={styles.column} />;

          const isActive = challenge.id === activeChallengeId;
          const reading = readings[challenge.id] ?? UNREAD;

          return (
            <View key={i} style={styles.column}>
              <PressableScale
                style={styles.coverSlot}
                onPress={() => onSelect(challenge)}
                accessibilityRole="button"
                accessibilityLabel={`${challenge.book_title}${challenge.book_author ? `, ${challenge.book_author}` : ''}, ${readingLabel(reading)}`}
                accessibilityHint={isActive ? undefined : 'L’affiche sur l’accueil'}
                accessibilityState={{ selected: isActive }}
              >
                <BookCover coverUrl={challenge.cover_url} outlined />
                <View style={styles.badge} pointerEvents="none">
                  <ReadingStateBadge {...reading} />
                </View>
              </PressableScale>
            </View>
          );
        })}
      </View>

      {/* ── Barre d'étagère en verre, AU-DESSUS du bas des couvertures ── */}
      <View style={styles.shelfBarOuter} pointerEvents="none">
        <BlurView intensity={20} tint="dark" style={styles.shelfBar}>
          <ShelfScrew />
          <ShelfScrew />
        </BlurView>
      </View>
    </Animated.View>
  );
}

// ─── Composant principal ───────────────────────────────────────────

export default function BookLibrary({
  challenges,
  readings,
  activeChallengeId,
  onSelect,
  sort,
  onSortChange,
}: BookLibraryProps) {
  const reducedMotion = useReducedMotion();

  // Livres découpés par étagères de 3
  const shelves = useMemo(() => {
    const rows: Challenge[][] = [];
    for (let i = 0; i < challenges.length; i += BOOKS_PER_SHELF) {
      rows.push(challenges.slice(i, i + BOOKS_PER_SHELF));
    }
    return rows;
  }, [challenges]);

  return (
    /*
      FlatList enfant DIRECT de l'écran, sans View intermédiaire : c'est la
      condition pour qu'UIKit lui applique l'encart sous la barre de navigation
      du sheet (cf. app/leaderboard.tsx). Une étagère = une ligne de la liste.
    */
    <FlatList
      data={shelves}
      keyExtractor={(books) => books.map((book) => book.id).join('-')}
      renderItem={({ item, index }) => (
        <Shelf
          books={item}
          index={index}
          readings={readings}
          activeChallengeId={activeChallengeId}
          onSelect={onSelect}
          animate={!reducedMotion}
        />
      )}
      ListHeaderComponent={
        <SortMenu options={LIBRARY_SORTS} value={sort} onChange={onSortChange} />
      }
      // Le menu de tri se déroule PAR-DESSUS les étagères
      ListHeaderComponentStyle={styles.header}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      bounces
    />
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Marges alignées sur le titre de la barre du sheet (20 pt)
  header: {
    zIndex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: spacing['4xl'],
    gap: spacing['3xl'],
  },

  // ═══ ÉTAGÈRE ═══
  // paddingBottom réserve la partie de la barre qui dépasse sous les couvertures
  shelf: {
    width: '100%',
    paddingBottom: SHELF_BAR_H - SHELF_OVERLAP,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end', // couvertures posées sur l'étagère
    zIndex: 1,              // SOUS la barre
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  coverSlot: {
    width: COVER_W,
    height: COVER_H,
  },
  /** Pastille d'état, à cheval sur le coin haut droit de la couverture */
  badge: {
    position: 'absolute',
    top: -BADGE_OVERHANG,
    right: -BADGE_OVERHANG,
  },
  // Barre d'étagère — en absolute, AU PREMIER PLAN pour passer par-dessus le
  // bas des couvertures. overflow: 'hidden' pour que le flou respecte le rayon.
  shelfBarOuter: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: SHELF_BAR_H,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 2,
  },
  // Flou + noyer sombre à 30 % : une transparence vitrée plutôt qu'un aplat
  shelfBar: {
    flex: 1,
    backgroundColor: shadowAlpha(0.3),
    borderWidth: 1,
    borderColor: creamAlpha(0.4),
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
});
