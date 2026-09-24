/**
 * Composant BookLibrary
 *
 * La bibliothèque : tous mes livres, rangés sur des étagères empilées,
 * trois couvertures par étagère, sous des filtres Tout / En cours / Non lus / Lus.
 *
 *    ▐██▌    ┏━━┓    ▛▀▀▜
 *   ░░░░░░░░░░░░░░░░░░░░░░   ← barre en verre flouté, avec ses vis
 *
 * L'étagère est celle de l'ancien accueil, à l'identique : une barre en verre
 * sombre (flou + noyer à 30 %) posée PAR-DESSUS le bas des couvertures, qui
 * passent donc derrière elle.
 *
 * Sur chaque couverture, selon MA progression, un signet brodé qui pend du haut
 * (RibbonBookmark) : rempli de lie de vin à mon % pour un livre en cours, coche
 * pour un livre terminé, étincelle pour le dernier livre ajouté pas encore
 * commencé. Un autre livre pas commencé n'a rien.
 *
 * Toucher une couverture l'affiche sur l'accueil et ferme le sheet.
 *
 * Hauteur : le sheet est en `fitToContents`, il prend la hauteur de la liste.
 * La liste se donne donc la hauteur exacte de ses étagères, plafonnée sous
 * l'en-tête de l'accueil (useFitSheet, règle commune des sheets à contenu) ;
 * au-delà, on fait défiler. Pas de blanc inutile sous la dernière étagère.
 *
 * Volontairement sans habillage de sheet : c'est la route `/library` qui le
 * présente, et c'est iOS qui dessine le sheet lui-même.
 */

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useFitSheet } from '../../hooks/useFitSheet';
import { Challenge } from '../../types/supabase';
import { colors, creamAlpha, fonts, motion, spacing } from '../../utils/constants';
import { BookReading, LIBRARY_FILTERS, LibraryFilter, readingLabel } from '../../utils/library';
import BookCover, { COVER_RATIO } from './BookCover';
import RibbonBookmark, { RIBBON_ABOVE_COVER } from './RibbonBookmark';
import PressableScale from './PressableScale';
import FilterChips, { FILTER_CHIPS_H } from './FilterChips';

// ─── Props ─────────────────────────────────────────────────────────

interface BookLibraryProps {
  /** Mes livres, déjà triés et filtrés */
  challenges: Challenge[];
  /** Où j'en suis de chaque livre, par id */
  readings: Record<string, BookReading>;
  /** La couverture de chaque livre, par id : celle de mon édition, sinon celle du bbb */
  covers: Record<string, string | null>;
  /** Le livre qui porte « Nouveau » (cf. `newBookId` dans utils/library.ts) */
  newBookId: string | null;
  /** ID du livre affiché sur l'accueil */
  activeChallengeId: string | null;
  /** Toucher une couverture */
  onSelect: (challenge: Challenge) => void;
  filter: LibraryFilter;
  onFilterChange: (filter: LibraryFilter) => void;
  /** Décor posé SOUS les filtres, dans l'en-tête de la liste (l'aquarelle du coin) */
  headerBackground?: React.ReactNode;
}

// ─── Constantes (reprises de l'ancienne étagère de l'accueil) ──────

const BOOKS_PER_SHELF = 3;
const COVER_H = 110;
const COVER_W = Math.round(COVER_H * COVER_RATIO); // 79
const SHELF_BAR_H = 24;        // hauteur de la barre d'étagère
const SHELF_OVERLAP = 14;      // de combien la barre chevauche le bas des couvertures
/**
 * Teinte de la barre d'étagère : noyer grisé clair en haut → plus foncé en bas,
 * translucide. Saturation réduite de moitié : à pleine teinte, trop beige/marron.
 */
const SHELF_TINT = ['rgba(162,147,134,0.45)', 'rgba(124,108,96,0.55)'] as const;
/** Espace entre deux étagères, et entre les filtres et la première */
const SHELF_GAP = spacing['3xl'];
/** Hauteur d'une étagère : couverture + partie de la barre qui dépasse dessous */
const SHELF_H = COVER_H + SHELF_BAR_H - SHELF_OVERLAP;
/** Hauteur du message quand aucun livre ne correspond au filtre */
const EMPTY_H = 60;
/** Marges gauche et droite de la liste, alignées sur le titre du sheet */
export const LIST_SIDE = spacing.xl;
/** Marge sous la dernière étagère */
const LIST_BOTTOM = spacing['2xl'];

/** Hauteur du contenu pour `shelfCount` étagères, avant toute mesure */
function estimateContentHeight(shelfCount: number): number {
  if (shelfCount === 0) return FILTER_CHIPS_H + SHELF_GAP + EMPTY_H + LIST_BOTTOM;
  return FILTER_CHIPS_H + shelfCount * (SHELF_GAP + SHELF_H) + LIST_BOTTOM;
}

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

/**
 * La barre d'étagère en verre flouté, avec ses vis. Posée en absolute au bas de
 * son parent, PAR-DESSUS le bas des couvertures. Partagée avec les étagères
 * de l'onglet Explorer (ExploreShelf).
 */
export function ShelfBar({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.shelfBarOuter, style]} pointerEvents="none">
      <BlurView intensity={20} tint="light" style={styles.shelfBar}>
        {/* Verre teinté noyer, en dégradé (jamais d'aplat) : brun, pas noir */}
        <LinearGradient colors={SHELF_TINT} style={StyleSheet.absoluteFill} />
        <ShelfScrew />
        <ShelfScrew />
      </BlurView>
    </View>
  );
}

/** Hauteur de la barre, et de combien elle chevauche le bas des couvertures */
export { SHELF_BAR_H, SHELF_OVERLAP };

// ─── Une étagère ───────────────────────────────────────────────────

function Shelf({
  books,
  index,
  readings,
  covers,
  newBookId,
  activeChallengeId,
  onSelect,
  animate,
}: {
  books: Challenge[];
  index: number;
  readings: Record<string, BookReading>;
  covers: Record<string, string | null>;
  newBookId: string | null;
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
          const isNew = challenge.id === newBookId;

          return (
            <View key={i} style={styles.column}>
              <PressableScale
                style={styles.coverSlot}
                onPress={() => onSelect(challenge)}
                accessibilityRole="button"
                accessibilityLabel={`${challenge.book_title}${challenge.book_author ? `, ${challenge.book_author}` : ''}, ${isNew ? 'nouveau, ' : ''}${readingLabel(reading)}`}
                accessibilityHint={isActive ? undefined : 'L’affiche sur l’accueil'}
                accessibilityState={{ selected: isActive }}
              >
                <BookCover coverUrl={covers[challenge.id] ?? challenge.cover_url} outlined />
                {(isNew || reading.state !== 'unread') && (
                  <View style={styles.ribbon} pointerEvents="none">
                    {reading.state === 'reading' ? (
                      <RibbonBookmark kind="reading" percent={reading.percent} />
                    ) : (
                      <RibbonBookmark kind={isNew ? 'new' : 'done'} />
                    )}
                  </View>
                )}
              </PressableScale>
            </View>
          );
        })}
      </View>

      {/* ── Barre d'étagère en verre, AU-DESSUS du bas des couvertures ── */}
      <ShelfBar />
    </Animated.View>
  );
}

// ─── Composant principal ───────────────────────────────────────────

export default function BookLibrary({
  challenges,
  readings,
  covers,
  newBookId,
  activeChallengeId,
  onSelect,
  filter,
  onFilterChange,
  headerBackground,
}: BookLibraryProps) {
  const reducedMotion = useReducedMotion();
  // Plafond commun des sheets à contenu : sous l'en-tête de l'accueil
  const { maxHeight } = useFitSheet();
  // Hauteur réelle du contenu, mesurée après le premier rendu (texte agrandi, etc.)
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  // Livres découpés par étagères de 3
  const shelves = useMemo(() => {
    const rows: Challenge[][] = [];
    for (let i = 0; i < challenges.length; i += BOOKS_PER_SHELF) {
      rows.push(challenges.slice(i, i + BOOKS_PER_SHELF));
    }
    return rows;
  }, [challenges]);

  const listHeight = Math.min(
    measuredHeight ?? estimateContentHeight(shelves.length),
    maxHeight,
  );

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
          covers={covers}
          newBookId={newBookId}
          activeChallengeId={activeChallengeId}
          onSelect={onSelect}
          animate={!reducedMotion}
        />
      )}
      ListHeaderComponent={
        <>
          {/* Le décor d'abord : les filtres passent par-dessus */}
          {headerBackground}
          <FilterChips options={LIBRARY_FILTERS} value={filter} onChange={onFilterChange} />
        </>
      }
      ListEmptyComponent={<Text style={styles.empty}>Aucun livre</Text>}
      style={[styles.list, { height: listHeight }]}
      contentContainerStyle={styles.listContent}
      // On ne rétrécit jamais : filtrer ne doit pas faire sauter le sheet
      onContentSizeChange={(_width, height) =>
        setMeasuredHeight((previous) => Math.max(previous ?? 0, height))
      }
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      bounces
    />
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.white,
  },
  // Marges alignées sur le titre de la barre du sheet (20 pt)
  listContent: {
    paddingHorizontal: LIST_SIDE,
    paddingTop: 0,
    paddingBottom: LIST_BOTTOM,
    gap: SHELF_GAP,
  },

  // Aucun livre pour ce filtre : un repère court, à la place des étagères
  empty: {
    height: EMPTY_H,
    textAlignVertical: 'center',
    paddingTop: spacing.xl,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
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
  /** Pastille d'état, à cheval sur le coin haut droit de la couverture */
  /** Signet : son pli dépasse au-dessus du bord, il pend près du bord droit */
  ribbon: {
    position: 'absolute',
    top: -RIBBON_ABOVE_COVER,
    right: 2,
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
    borderWidth: 1,
    borderColor: creamAlpha(0.35),
    overflow: 'hidden',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
});
