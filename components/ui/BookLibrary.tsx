/**
 * Composant BookLibrary
 *
 * La bibliothèque : tous tes challenges, rangés sur des étagères empilées,
 * trois couvertures par étagère.
 *
 *    ▐██▌    ┏━━┓    ▛▀▀▜
 *   ░░░░░░░░░░░░░░░░░░░░░░   ← barre en verre flouté, avec ses vis
 *
 * L'étagère est celle de l'ancien accueil, à l'identique : une barre en verre
 * sombre (flou + noyer à 30 %) posée PAR-DESSUS le bas des couvertures, qui
 * passent donc derrière elle.
 *
 * Trois états de couverture :
 * - en cours      → le livre affiché sur l'accueil : bordure encre épaisse
 * - pas commencé  → tous les autres : filet fin
 * - terminé       → cadre sombre + marque-page ✓ (cf. BookCover)
 *
 * Toucher une couverture la passe « en cours » et ferme le sheet.
 *
 * Volontairement sans habillage de sheet : c'est la route `/library` qui le
 * présente, et c'est iOS qui dessine le sheet lui-même.
 */

import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Challenge } from '../../types/supabase';
import { colors, creamAlpha, fonts, motion, shadowAlpha, spacing } from '../../utils/constants';
import BookCover, { COVER_RATIO, isChallengeDone } from './BookCover';
import PressableScale from './PressableScale';

// ─── Props ─────────────────────────────────────────────────────────

interface BookLibraryProps {
  /** Tous les challenges de l'utilisateur */
  challenges: Challenge[];
  /** ID du livre affiché sur l'accueil */
  activeChallengeId: string | null;
  /** Toucher une couverture */
  onSelect: (challenge: Challenge) => void;
}

// ─── Constantes (reprises de l'ancienne étagère de l'accueil) ──────

const BOOKS_PER_SHELF = 3;
const COVER_H = 110;
const COVER_W = Math.round(COVER_H * COVER_RATIO); // 79
const SHELF_BAR_H = 24;        // hauteur de la barre d'étagère
const SHELF_OVERLAP = 14;      // de combien la barre chevauche le bas des couvertures
/** Écart entre la couverture en cours et sa bordure épaisse */
const ACTIVE_RING_GAP = 3;
const ACTIVE_RING_W = 2;

/** « 1 livre », « 4 livres » */
function formatBookCount(count: number): string {
  return `${count} livre${count > 1 ? 's' : ''}`;
}

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
  activeChallengeId,
  onSelect,
  animate,
}: {
  books: Challenge[];
  index: number;
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
          const isDone = isChallengeDone(challenge);

          return (
            <View key={i} style={styles.column}>
              <PressableScale
                style={styles.coverSlot}
                onPress={() => onSelect(challenge)}
                accessibilityRole="button"
                accessibilityLabel={`${challenge.book_title}${challenge.book_author ? `, ${challenge.book_author}` : ''}${isDone ? ', terminé' : isActive ? ', en cours' : ''}`}
                accessibilityHint={isActive ? undefined : 'Devient ton livre en cours'}
                accessibilityState={{ selected: isActive }}
              >
                <BookCover coverUrl={challenge.cover_url} done={isDone} outlined={!isActive} />
                {isActive && <View style={styles.activeRing} pointerEvents="none" />}
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
  activeChallengeId,
  onSelect,
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
          activeChallengeId={activeChallengeId}
          onSelect={onSelect}
          animate={!reducedMotion}
        />
      )}
      ListHeaderComponent={
        <Text style={styles.headerSubtitle}>{formatBookCount(challenges.length)}</Text>
      }
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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['4xl'],
    gap: spacing['3xl'],
  },
  headerSubtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textTertiary,
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
  /** Bordure épaisse du livre en cours, détachée de la couverture par un fin écart */
  activeRing: {
    position: 'absolute',
    top: -(ACTIVE_RING_GAP + ACTIVE_RING_W),
    left: -(ACTIVE_RING_GAP + ACTIVE_RING_W),
    right: -(ACTIVE_RING_GAP + ACTIVE_RING_W),
    bottom: -(ACTIVE_RING_GAP + ACTIVE_RING_W),
    borderRadius: 5,
    borderWidth: ACTIVE_RING_W,
    borderColor: colors.dark900,
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
