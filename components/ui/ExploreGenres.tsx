/**
 * Composant ExploreGenres
 *
 * Les genres de l'onglet Explorer, en une rangée qui défile de côté, sur le
 * même papier aquarelle que l'en-tête du profil (rouge, chocolat, un peu de
 * beurre) et avec le nom en blanc, comme le prénom : le maximum de cohérence
 * (Lea, 2026-10-27). L'aquarelle est UNE bande aussi longue que la rangée
 * (scripts/generate-genre-wash.py) : chaque carte en montre sa tranche, la
 * rangée se lit comme une seule peinture découpée.
 *
 *    Genres
 *    ┌──────────┐ ┌──────────┐ ┌────
 *    │Contempor.│ │Thriller  │ │Rom… →
 *    │       ☕ │ │       ◎  │ │      ← illustration blanche, légère, qui déborde
 *    └──────────┘ └──────────┘ └────
 *
 * L'illustration (aquarelle de Lea, assets/images/genres, masques préparés par
 * scripts/build-genre-illustrations.py) est teintée en blanc, très légère,
 * grande et coupée par le bord, comme le mot en filigrane des notes.
 *
 * Essayés et rejetés : cadres en verre, une paire Lowki par carte (texte
 * dépareillé ou illisible en ton sur ton), couture en pointillés.
 *
 * Toucher un genre ouvre tous ses livres (l'écran Explorer passe en liste).
 */

import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, creamAlpha, fontSize, fonts, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

const SIDE = spacing.lg;
const GAP = spacing.md;
/** Tous les genres ont la même taille ; « Développement » tient juste sur une ligne */
const TILE_W = 156;
const TILE_H = 88;
const RADIUS = borderRadius.lg;
const ILLUSTRATION = 96;

const WASH = require('../../assets/images/watercolor/genres-wash.jpg');
/** La bande d'aquarelle couvre 14 cartes ; au-delà, on repart du début */
const WASH_CARDS = 14;
const WASH_W = WASH_CARDS * TILE_W + (WASH_CARDS - 1) * GAP;

export interface ExploreGenre {
  key: string;
  label: string;
  books: BookSearchResult[];
}

/** L'illustration de chaque genre */
const ILLUSTRATIONS: Record<string, number> = {
  contemporary: require('../../assets/images/genres/contemporary.png'),
  thriller: require('../../assets/images/genres/thriller.png'),
  fantasy: require('../../assets/images/genres/fantasy.png'),
  'feel-good': require('../../assets/images/genres/feel-good.png'),
  'science-fiction': require('../../assets/images/genres/science-fiction.png'),
  romance: require('../../assets/images/genres/romance.png'),
  historical: require('../../assets/images/genres/historical.png'),
  classics: require('../../assets/images/genres/classics.png'),
  horror: require('../../assets/images/genres/horror.png'),
  'young-adult': require('../../assets/images/genres/young-adult.png'),
  comics: require('../../assets/images/genres/comics.png'),
  romantasy: require('../../assets/images/genres/romantasy.png'),
  'self-help': require('../../assets/images/genres/self-help.png'),
  nonfiction: require('../../assets/images/genres/nonfiction.png'),
};

interface ExploreGenresProps {
  genres: ExploreGenre[];
  onSelect: (genre: ExploreGenre) => void;
}

export default function ExploreGenres({ genres, onSelect }: ExploreGenresProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        Genres
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {genres.map((genre, index) => {
          const illustration = ILLUSTRATIONS[genre.key];
          return (
            <PressableScale
              key={genre.key}
              style={styles.tile}
              pressedScale={0.97}
              onPress={() => onSelect(genre)}
              accessibilityRole="button"
              accessibilityLabel={genre.label}
              accessibilityHint="Voir les livres de ce genre"
            >
              {/* Sa tranche de la bande : décalée d'autant de cartes qu'il y en a avant elle */}
              <Image
                source={WASH}
                style={[styles.wash, { left: -(index % WASH_CARDS) * (TILE_W + GAP) }]}
                contentFit="fill"
              />
              {illustration && (
                <Image
                  source={illustration}
                  style={styles.illustration}
                  contentFit="contain"
                  tintColor={creamAlpha(1)}
                  pointerEvents="none"
                />
              )}
              <Text style={styles.label} numberOfLines={2}>
                {genre.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  title: {
    paddingHorizontal: SIDE,
    fontFamily: fonts.display,
    fontSize: fontSize.md,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  row: {
    paddingHorizontal: SIDE,
    gap: GAP,
  },
  // Même taille pour tous : un nom trop long passe sur deux lignes, jamais en plus petit
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: RADIUS,
    overflow: 'hidden',
    padding: spacing.md,
  },
  wash: {
    position: 'absolute',
    top: 0,
    width: WASH_W,
    height: TILE_H,
  },
  // Déborde en bas à droite, penchée : la section la coupe
  illustration: {
    position: 'absolute',
    right: -14,
    bottom: -22,
    width: ILLUSTRATION,
    height: ILLUSTRATION,
    transform: [{ rotate: '-10deg' }],
    opacity: 0.22,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: colors.white,
  },
});
