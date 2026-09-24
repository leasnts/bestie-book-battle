/**
 * Composant ExploreShelf
 *
 * Une étagère de l'onglet Explorer : un titre, puis une rangée de couvertures
 * qui défile de côté, posée sur la même barre en verre que la bibliothèque.
 *
 *    Romantasy
 *    ▐██▌  ┏━━┓  ▛▀▀▜  ▐██▌  ┏━━┓ →
 *   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ← barre fixe, les livres glissent derrière
 *
 * La barre ne défile pas : elle reste posée sous la rangée, et les couvertures
 * passent derrière elle comme sur une vraie étagère. Aux deux bords de
 * l'écran, les couvertures s'effacent en fondu dans le papier au lieu d'être
 * coupées net.
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BookSearchResult } from '../../types/bookSearch';
import { colors, fonts, spacing } from '../../utils/constants';
import BookCover, { COVER_RATIO } from './BookCover';
import { SHELF_BAR_H, SHELF_OVERLAP, ShelfBar } from './BookLibrary';
import PressableScale from './PressableScale';

/** Même taille de couverture que les étagères de la bibliothèque */
const COVER_H = 110;
const COVER_W = Math.round(COVER_H * COVER_RATIO);
const SIDE = spacing.lg;
/** Largeur du fondu aux bords de l'écran */
const FADE_W = spacing['4xl'];
/** Le papier (bgLight #f5f3ef) à une opacité donnée : un fondu vers `transparent` grise */
const paper = (alpha: number) => `rgba(245,243,239,${alpha})`;
/** Fondu doux, en courbe : le bord garde un peu du livre, jamais un voile blanc net */
const FADE_COLORS = [paper(0.85), paper(0.55), paper(0.25), paper(0.08), paper(0)] as const;
const FADE_STOPS = [0, 0.25, 0.5, 0.75, 1] as const;

interface ExploreShelfProps {
  label: string;
  /** Petite icône Lucide devant le titre (mes envies) */
  icon?: LucideIcon;
  books: BookSearchResult[];
  onSelect: (book: BookSearchResult) => void;
}

export default function ExploreShelf({ label, icon: Icon, books, onSelect }: ExploreShelfProps) {
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        {Icon && <Icon size={17} color={colors.accent} fill={colors.accent} strokeWidth={2} />}
        <Text style={styles.title} accessibilityRole="header">
          {label}
        </Text>
      </View>

      <View style={styles.shelf}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          decelerationRate="fast"
        >
          {books.map((book) => (
            <PressableScale
              key={book.id}
              style={styles.cover}
              onPress={() => onSelect(book)}
              accessibilityRole="button"
              accessibilityLabel={`${book.title}${book.author ? `, ${book.author}` : ''}`}
            >
              <BookCover coverUrl={book.coverUrl} outlined />
            </PressableScale>
          ))}
        </ScrollView>

        {/* Fondus des bords, sous la barre : le papier reprend le dessus */}
        <LinearGradient
          colors={FADE_COLORS}
          locations={FADE_STOPS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fade, styles.fadeLeft]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={FADE_COLORS}
          locations={FADE_STOPS}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={[styles.fade, styles.fadeRight]}
          pointerEvents="none"
        />

        <ShelfBar style={styles.bar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: SIDE,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  // paddingBottom : la partie de la barre qui dépasse sous les couvertures
  shelf: {
    paddingBottom: SHELF_BAR_H - SHELF_OVERLAP,
  },
  row: {
    paddingHorizontal: SIDE + spacing.md,
    gap: spacing.xl,
    // Place pour l'ombre latérale des couvertures
    paddingTop: spacing.xs,
  },
  cover: {
    width: COVER_W,
    height: COVER_H,
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: FADE_W,
  },
  fadeLeft: {
    left: 0,
  },
  fadeRight: {
    right: 0,
  },
  bar: {
    left: SIDE,
    right: SIDE,
  },
});
