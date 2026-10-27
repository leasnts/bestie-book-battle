/**
 * Composant ExploreGenres
 *
 * Les genres de l'onglet Explorer, en grille de deux colonnes : un cadre en
 * verre par genre (`GlassSection`), son nom en haut à gauche et deux
 * couvertures du genre posées en éventail en bas à droite.
 *
 *    Genres
 *    ┌────────────┐ ┌────────────┐
 *    │ Romantasy  │ │ Thriller   │
 *    │      ▞▚▐█▌ │ │      ▞▚▐█▌ │
 *    └────────────┘ └────────────┘
 *
 * Toucher un genre ouvre tous ses livres (l'écran Explorer passe en liste).
 */

import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { BookSearchResult } from '../../types/bookSearch';
import { colors, fonts, spacing } from '../../utils/constants';
import BookCover, { COVER_RATIO } from './BookCover';
import GlassSection from './GlassSection';

const SIDE = spacing.lg;
const GAP = spacing.md;
const TILE_H = 128;
const COVER_H = 70;
const COVER_W = Math.round(COVER_H * COVER_RATIO);

export interface ExploreGenre {
  key: string;
  label: string;
  books: BookSearchResult[];
}

interface ExploreGenresProps {
  genres: ExploreGenre[];
  onSelect: (genre: ExploreGenre) => void;
}

export default function ExploreGenres({ genres, onSelect }: ExploreGenresProps) {
  const { width } = useWindowDimensions();
  const tileW = (width - 2 * SIDE - GAP) / 2;

  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        Genres
      </Text>

      <View style={styles.grid}>
        {genres.map((genre) => {
          const [front, back] = genre.books;
          return (
            <GlassSection
              key={genre.key}
              style={{ width: tileW, height: TILE_H }}
              onPress={() => onSelect(genre)}
              accessibilityLabel={genre.label}
              accessibilityHint="Voir les livres de ce genre"
            >
              <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {genre.label}
              </Text>
              {/* En éventail : celle de derrière penche à gauche, celle de devant à droite */}
              {back && (
                <View style={[styles.cover, styles.coverBack]} pointerEvents="none">
                  <BookCover coverUrl={back.coverUrl} outlined />
                </View>
              )}
              {front && (
                <View style={[styles.cover, styles.coverFront]} pointerEvents="none">
                  <BookCover coverUrl={front.coverUrl} outlined />
                </View>
              )}
            </GlassSection>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
    paddingHorizontal: SIDE,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  cover: {
    position: 'absolute',
    width: COVER_W,
    height: COVER_H,
  },
  coverBack: {
    right: spacing.lg + COVER_W * 0.55,
    bottom: spacing.md,
    transform: [{ rotate: '-8deg' }],
  },
  coverFront: {
    right: spacing.lg,
    bottom: spacing.md - 2,
    transform: [{ rotate: '6deg' }],
  },
});
