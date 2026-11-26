/**
 * Composant BookLibrary
 *
 * La bibliothèque : une étagère par état, chacune défile de côté (#242).
 *
 *    Lus 21                     ›   ← dès 8 livres, toucher le titre : tous ses livres
 *    ▐██▌  ┏━━┓  ▛▀▀▜  ▐██▌ →
 *   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ← barre en verre flouté, avec ses vis
 *    Pas commencés · Envies · Lus   ← même chose ; une étagère vide n'apparaît pas
 *
 * Toucher le titre d'une étagère montre tous ses livres dans le même sheet, en
 * rangées de trois sous la même barre, avec un retour vers les étagères.
 *
 * L'étagère est celle de l'ancien accueil, à l'identique : une barre en verre
 * sombre (flou + noyer à 30 %) posée PAR-DESSUS le bas des couvertures, qui
 * passent donc derrière elle.
 *
 * Sur chaque couverture, selon MA progression, un signet brodé qui pend du haut
 * (RibbonBookmark) : rempli de rouge à mon % pour un livre en cours, coche
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
import { ChevronRightIcon } from 'lucide-react-native';
import { FlatList, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useFitSheet } from '../../hooks/useFitSheet';
import type { BookSearchResult } from '../../types/bookSearch';
import { Challenge, Club } from '../../types/supabase';
import ClubAvatar from './ClubAvatar';
import { colors, creamAlpha, dropShadow, fontSize, fonts, motion, spacing } from '../../utils/constants';
import { BookReading, LIBRARY_SHELVES, LibraryFilter, readingLabel } from '../../utils/library';
import BookCover, { COVER_RATIO } from './BookCover';
import RibbonBookmark, { RIBBON_ABOVE_COVER } from './RibbonBookmark';
import PressableScale from './PressableScale';
import { SHEET_TOP_INSET, useSheetScrolled } from './SheetHeader';
import { SHEET_GUTTER, SheetPageHeader } from './SheetPage';

// ─── Props ─────────────────────────────────────────────────────────

/** Une place d'étagère : un de mes livres, ou une envie d'Explorer */
type ShelfItem = { kind: 'book'; challenge: Challenge } | { kind: 'wish'; book: BookSearchResult };

const itemId = (item: ShelfItem) => (item.kind === 'book' ? item.challenge.id : `wish:${item.book.id}`);

interface BookLibraryProps {
  /** Mes livres, déjà triés (les étagères les répartissent selon `readings`) */
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
  /** Mes envies (étagère « Envies ») : leur fiche s'ouvre au toucher */
  wishes: BookSearchResult[];
  onSelectWish: (book: BookSearchResult) => void;
  /** `all` : toutes les étagères ; sinon tous les livres d'une seule */
  filter: LibraryFilter;
  /** Toucher le titre d'une étagère */
  onFilterChange: (filter: LibraryFilter) => void;
  /** Le retour vers les étagères, quand on regarde une seule étagère */
  onBack?: () => void;
  /** Mes clubs (#238) : leur rond sur les couvertures */
  clubs?: Record<string, Club>;
  /** Décor derrière l'en-tête du sheet (l'aquarelle du coin) */
  headerBackground?: React.ReactNode;
  /** À droite du titre : le « + » */
  actions?: React.ReactNode;
}

// ─── Clubs (#238) ──────────────────────────────────────────────────

/** Le rond du club sur une couverture */
const CLUB_BADGE = 24;

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
export const LIST_SIDE = SHEET_GUTTER;
/** Marge sous la dernière étagère */
const LIST_BOTTOM = spacing['2xl'];

/** L'en-tête du sheet (le titre), avant toute mesure */
const HEADER_H = SHEET_TOP_INSET + 36 + spacing.md;
/** Le titre d'une étagère qui défile, au-dessus de ses couvertures */
const RAIL_TITLE_H = 44;
/** Une étagère qui défile ne montre que ses premiers livres : le titre ouvre le reste */
const RAIL_MAX = 20;
/** En dessous, tous les livres tiennent sur l'étagère : pas de page à ouvrir */
const RAIL_OPEN_MIN = 8;
/** Le fond de la liste (colors.white) à une opacité donnée : un fondu vers `transparent` grise */
const listPaper = (alpha: number) => `rgba(253,252,250,${alpha})`;
const FADE_COLORS = [listPaper(0.9), listPaper(0.55), listPaper(0.2), listPaper(0)] as const;
const FADE_STOPS = [0, 0.35, 0.7, 1] as const;

/** Hauteur du contenu pour `rowCount` étagères, avant toute mesure */
function estimateContentHeight(rowCount: number, rails: boolean): number {
  if (rowCount === 0) return HEADER_H + SHELF_GAP + EMPTY_H + LIST_BOTTOM;
  const row = rails ? RAIL_TITLE_H + spacing.xs + SHELF_H : SHELF_H;
  return HEADER_H + rowCount * (SHELF_GAP + row) + LIST_BOTTOM;
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

// ─── Une couverture d'étagère ──────────────────────────────────────

interface ShelfCoverProps {
  item: ShelfItem;
  readings: Record<string, BookReading>;
  covers: Record<string, string | null>;
  newBookId: string | null;
  activeChallengeId: string | null;
  onSelect: (challenge: Challenge) => void;
  onSelectWish: (book: BookSearchResult) => void;
  clubs?: Record<string, Club>;
}

/** Une couverture et ce qui s'y pose (signet, rond du club) ; la même dans les deux vues */
function ShelfCover({ item, readings, covers, newBookId, activeChallengeId, onSelect, onSelectWish, clubs }: ShelfCoverProps) {
  // Une envie : sa couverture seule, sans signet (pas encore commencée)
  if (item.kind === 'wish') {
    const { book } = item;
    return (
      <PressableScale
        style={styles.coverSlot}
        onPress={() => onSelectWish(book)}
        accessibilityRole="button"
        accessibilityLabel={`${book.title}${book.author ? `, ${book.author}` : ''}`}
        accessibilityHint="Ouvre sa fiche"
      >
        <BookCover coverUrl={book.coverUrl} outlined />
      </PressableScale>
    );
  }

  const { challenge } = item;
  const isActive = challenge.id === activeChallengeId;
  const reading = readings[challenge.id] ?? UNREAD;
  const isNew = challenge.id === newBookId;

  return (
    <PressableScale
      style={styles.coverSlot}
      onPress={() => onSelect(challenge)}
      accessibilityRole="button"
      accessibilityLabel={`${challenge.book_title}${challenge.book_author ? `, ${challenge.book_author}` : ''}, ${isNew ? 'nouveau, ' : ''}${readingLabel(reading)}`}
      accessibilityHint={isActive ? undefined : 'L’affiche sur l’accueil'}
      accessibilityState={{ selected: isActive }}
    >
      <BookCover coverUrl={covers[challenge.id] ?? challenge.cover_url} outlined />
      {/* Lu en club (#238) : le rond du club, à cheval sur le coin haut gauche
          (le signet pend à droite) */}
      {challenge.club_id && clubs?.[challenge.club_id] && (
        <View style={styles.clubBadge} pointerEvents="none">
          <ClubAvatar club={clubs[challenge.club_id]} size={CLUB_BADGE} />
        </View>
      )}
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
  );
}

// ─── Une étagère qui défile (la vue d'ouverture) ───────────────────

/**
 * Un titre touchable (le nombre de livres, puis ›), puis une rangée qui défile
 * de côté sous la barre en verre fixe, comme les étagères d'Explorer. Aux deux
 * bords, les couvertures s'effacent en fondu dans le papier.
 */
function Rail({
  label,
  items,
  onOpen,
  index,
  animate,
  ...coverProps
}: Omit<ShelfCoverProps, 'item'> & {
  label: string;
  items: ShelfItem[];
  onOpen: () => void;
  index: number;
  animate: boolean;
}) {
  const delay = Math.min(index * motion.stagger, 240);
  const openable = items.length >= RAIL_OPEN_MIN;
  return (
    <Animated.View
      style={styles.rail}
      entering={
        animate
          ? FadeInDown.duration(motion.duration.entrance)
              .delay(delay)
              .easing(Easing.bezier(...motion.easing.easeOutQuart).factory())
          : undefined
      }
    >
      {/* Moins de 8 livres : tout est déjà sur l'étagère, le titre n'ouvre rien */}
      {openable ? (
        <PressableScale
          style={styles.railTitle}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${items.length}`}
          accessibilityHint="Montre tous ses livres"
        >
          <Text style={styles.railLabel} accessibilityRole="header">
            {label}
          </Text>
          <Text style={styles.railCount}>{items.length}</Text>
          <ChevronRightIcon size={18} color={colors.textTertiary} strokeWidth={2} style={styles.railChevron} />
        </PressableScale>
      ) : (
        <View style={styles.railTitle}>
          <Text style={styles.railLabel} accessibilityRole="header">
            {label}
          </Text>
          <Text style={styles.railCount}>{items.length}</Text>
        </View>
      )}

      <View style={styles.shelf}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railRow}
          decelerationRate="fast"
        >
          {items.slice(0, RAIL_MAX).map((item) => (
            <ShelfCover key={itemId(item)} item={item} {...coverProps} />
          ))}
        </ScrollView>
        <LinearGradient
          colors={FADE_COLORS}
          locations={FADE_STOPS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.railFade, styles.railFadeLeft]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={FADE_COLORS}
          locations={FADE_STOPS}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={[styles.railFade, styles.railFadeRight]}
          pointerEvents="none"
        />
        <ShelfBar style={styles.railBar} />
      </View>
    </Animated.View>
  );
}

// ─── Une étagère ───────────────────────────────────────────────────

function Shelf({
  books,
  index,
  readings,
  covers,
  newBookId,
  activeChallengeId,
  onSelect,
  onSelectWish,
  animate,
  clubs,
}: {
  clubs?: Record<string, Club>;
  books: ShelfItem[];
  index: number;
  readings: Record<string, BookReading>;
  covers: Record<string, string | null>;
  newBookId: string | null;
  activeChallengeId: string | null;
  onSelect: (challenge: Challenge) => void;
  onSelectWish: (book: BookSearchResult) => void;
  animate: boolean;
}) {
  // Les étagères apparaissent l'une après l'autre, cascade plafonnée
  const delay = Math.min(index * motion.stagger, 240);

  // On complète toujours la rangée à 3 places : une étagère à 1 livre garde
  // ses couvertures alignées sur les colonnes des étagères du dessus.
  const padded: (ShelfItem | null)[] = [...books];
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
        {padded.map((item, i) => {
          if (!item) return <View key={i} style={styles.column} />;

          return (
            <View key={i} style={styles.column}>
              <ShelfCover
                item={item}
                readings={readings}
                covers={covers}
                newBookId={newBookId}
                activeChallengeId={activeChallengeId}
                onSelect={onSelect}
                onSelectWish={onSelectWish}
                clubs={clubs}
              />
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
  wishes,
  onSelectWish,
  filter,
  onFilterChange,
  onBack,
  clubs,
  headerBackground,
  actions,
}: BookLibraryProps) {
  const reducedMotion = useReducedMotion();
  const { scrolled, onScroll } = useSheetScrolled();
  // Plafond commun des sheets à contenu : sous l'en-tête de l'accueil
  const { maxHeight } = useFitSheet();
  // Hauteur réelle du contenu, mesurée après le premier rendu (texte agrandi, etc.)
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  // Chaque livre sur l'étagère de son état ; les envies sur la leur
  const byShelf = useMemo(() => {
    const groups: Record<Exclude<LibraryFilter, 'all'>, ShelfItem[]> = { reading: [], unread: [], wish: [], done: [] };
    for (const challenge of challenges) {
      groups[(readings[challenge.id] ?? UNREAD).state].push({ kind: 'book', challenge });
    }
    groups.wish = wishes.map((book) => ({ kind: 'wish', book }));
    return groups;
  }, [challenges, readings, wishes]);

  const showRails = filter === 'all';

  // Vue d'ouverture : une étagère qui défile par état, sans les vides
  const rails = useMemo(
    () => LIBRARY_SHELVES.filter((shelf) => byShelf[shelf.key].length > 0).map((shelf) => ({ ...shelf, items: byShelf[shelf.key] })),
    [byShelf],
  );

  // Une seule étagère : tous ses livres, par rangées de 3
  const shelves = useMemo(() => {
    if (showRails) return [];
    const items = byShelf[filter];
    const rows: ShelfItem[][] = [];
    for (let i = 0; i < items.length; i += BOOKS_PER_SHELF) {
      rows.push(items.slice(i, i + BOOKS_PER_SHELF));
    }
    return rows;
  }, [byShelf, filter, showRails]);

  const title = showRails ? 'Mes lectures' : (LIBRARY_SHELVES.find((shelf) => shelf.key === filter)?.label ?? 'Mes lectures');
  const listHeight = Math.min(
    measuredHeight ?? estimateContentHeight(showRails ? rails.length : shelves.length, showRails),
    maxHeight,
  );
  const coverProps = { readings, covers, newBookId, activeChallengeId, onSelect, onSelectWish, clubs };
  const header = (
    <SheetPageHeader
      title={title}
      accent={showRails ? 'lectures' : undefined}
      onBack={showRails ? undefined : onBack}
      actions={actions}
      background={headerBackground}
      scrolled={scrolled}
    />
  );
  const common = {
    ListHeaderComponent: header,
    stickyHeaderIndices: [0],
    onScroll,
    scrollEventThrottle: 16,
    ListEmptyComponent: <Text style={styles.empty}>{filter === 'wish' ? 'Aucune envie' : 'Aucun livre'}</Text>,
    style: [styles.list, { height: listHeight }],
    contentContainerStyle: styles.listContent,
    // On ne rétrécit jamais : changer de vue ne doit pas faire sauter le sheet
    onContentSizeChange: (_width: number, height: number) =>
      setMeasuredHeight((previous) => Math.max(previous ?? 0, height)),
    showsVerticalScrollIndicator: false,
    contentInsetAdjustmentBehavior: 'automatic' as const,
    bounces: true,
  };

  if (showRails) {
    return (
      // FlatList enfant DIRECT de l'écran (condition des sheets natifs) : une étagère = une ligne
      <FlatList
        key="rails"
        data={rails}
        keyExtractor={(rail) => rail.key}
        renderItem={({ item, index }) => (
          <Rail
            label={item.label}
            items={item.items}
            onOpen={() => onFilterChange(item.key)}
            index={index}
            animate={!reducedMotion}
            {...coverProps}
          />
        )}
        {...common}
      />
    );
  }

  return (
    /*
      FlatList enfant DIRECT de l'écran, sans View intermédiaire : c'est la
      condition des sheets natifs (cf. app/leaderboard.tsx). Une étagère = une
      ligne de la liste.
    */
    <FlatList
      data={shelves}
      keyExtractor={(items) => items.map(itemId).join('-')}
      renderItem={({ item, index }) => (
        <Shelf
          books={item}
          index={index}
          readings={readings}
          covers={covers}
          newBookId={newBookId}
          activeChallengeId={activeChallengeId}
          onSelect={onSelect}
          onSelectWish={onSelectWish}
          animate={!reducedMotion}
          clubs={clubs}
        />
      )}
      key={filter}
      {...common}
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

  // Les étagères qui défilent vont de bord à bord, au-delà des marges de la liste
  rail: {
    gap: spacing.xs,
    marginHorizontal: -LIST_SIDE,
  },
  railTitle: {
    minHeight: RAIL_TITLE_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: LIST_SIDE,
  },
  railLabel: {
    fontFamily: fonts.display,
    fontSize: fontSize.md,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  railCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  railChevron: {
    marginLeft: 'auto',
  },
  railRow: {
    paddingHorizontal: LIST_SIDE + spacing.md,
    gap: spacing.xl,
    // Place pour le signet qui dépasse en haut et l'ombre des couvertures
    paddingTop: RIBBON_ABOVE_COVER,
    alignItems: 'flex-end',
  },
  railFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: spacing['3xl'],
  },
  railFadeLeft: {
    left: 0,
  },
  railFadeRight: {
    right: 0,
  },
  railBar: {
    left: LIST_SIDE,
    right: LIST_SIDE,
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
  clubBadge: {
    position: 'absolute',
    top: -CLUB_BADGE / 3,
    left: -CLUB_BADGE / 3,
    borderRadius: CLUB_BADGE / 2 + 2,
    borderWidth: 2,
    borderColor: colors.white,
    boxShadow: dropShadow(2, 4, 0.25),
  },
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
