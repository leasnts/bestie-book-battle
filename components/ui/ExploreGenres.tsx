/**
 * Composant ExploreGenres
 *
 * Les genres de l'onglet Explorer, en grille de quatre colonnes, tout à
 * l'écran sans défiler (Lea, 2026-10-27), sur le
 * même papier aquarelle que l'en-tête du profil (rouge, chocolat, un peu de
 * beurre) et avec le nom en blanc, comme le prénom : le maximum de cohérence
 * (Lea, 2026-10-27). L'aquarelle est UNE bande aussi longue que la rangée
 * (scripts/generate-genre-wash.py) : chaque carte en montre sa tranche, la
 * grille se lit comme une seule peinture découpée. Le nom est petit (11) et
 * plus étroit (Martian Grotesk, pas la version large) pour tenir dans un quart
 * de largeur ; deux noms ont une version courte (`SHORT_LABELS`).
 *
 *    Genres
 *    ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
 *    │Contempo│ │Thriller│ │Fantasy │ │Feel-  │
 *    │     ☕ │ │     ◎ │ │     ♜ │ │good ☀ │   ← illustration blanche légère
 *    └───────┘ └───────┘ └───────┘ └───────┘
 *    … 14 genres, 4 par ligne
 *
 * L'illustration (aquarelle de Lea, assets/images/genres, masques préparés par
 * scripts/build-genre-illustrations.py) est teintée en blanc, très légère,
 * grande et coupée par le bord, comme le mot en filigrane des notes.
 *
 * Essayés et rejetés : cadres en verre, une paire Lowki par carte (texte
 * dépareillé ou illisible en ton sur ton), couture en pointillés, rangée
 * qui défile.
 *
 * Toucher un genre ouvre tous ses livres (l'écran Explorer passe en liste).
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, creamAlpha, fontSize, fonts, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

const SIDE = spacing.lg;
const GAP = spacing.sm;
/** Quatre cartes par ligne, toute la grille à l'écran sans défiler */
const COLUMNS = 4;
const TILE_H = 64;
const RADIUS = borderRadius.md;
const ILLUSTRATION = 64;

const WASH = require('../../assets/images/watercolor/genres-wash.jpg');
/** La bande d'aquarelle couvre 14 cartes ; au-delà, on repart du début */
const WASH_CARDS = 14;

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

/** Les noms trop longs pour une carte en quart de largeur (le titre de la liste garde le nom entier) */
const SHORT_LABELS: Record<string, string> = {
  contemporary: 'Contempo',
  'self-help': 'Dév. perso',
};

interface ExploreGenresProps {
  genres: ExploreGenre[];
  onSelect: (genre: ExploreGenre) => void;
}

export default function ExploreGenres({ genres, onSelect }: ExploreGenresProps) {
  const { width } = useWindowDimensions();
  const tileW = (width - 2 * SIDE - (COLUMNS - 1) * GAP) / COLUMNS;
  // La bande d'aquarelle, ramenée à la largeur des cartes : chacune en montre sa tranche
  const washW = WASH_CARDS * (tileW + GAP);

  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        Genres
      </Text>

      <View style={styles.grid}>
        {genres.map((genre, index) => {
          const illustration = ILLUSTRATIONS[genre.key];
          return (
            <PressableScale
              key={genre.key}
              style={[styles.tile, { width: tileW }]}
              pressedScale={0.97}
              onPress={() => onSelect(genre)}
              accessibilityRole="button"
              accessibilityLabel={genre.label}
              accessibilityHint="Voir les livres de ce genre"
            >
              {/* Sa tranche de la bande : décalée d'autant de cartes qu'il y en a avant elle */}
              <Image
                source={WASH}
                style={[styles.wash, { width: washW, left: -(index % WASH_CARDS) * (tileW + GAP) }]}
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
              <Text style={styles.label} numberOfLines={3}>
                {SHORT_LABELS[genre.key] ?? genre.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIDE,
    gap: GAP,
  },
  // Même taille pour tous : un nom trop long passe à la ligne, jamais en plus petit
  tile: {
    height: TILE_H,
    borderRadius: RADIUS,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
    paddingHorizontal: 6,
  },
  wash: {
    position: 'absolute',
    top: 0,
    height: TILE_H,
  },
  // Déborde en bas à droite, penchée : la section la coupe
  illustration: {
    position: 'absolute',
    right: -12,
    bottom: -18,
    width: ILLUSTRATION,
    height: ILLUSTRATION,
    transform: [{ rotate: '-10deg' }],
    opacity: 0.22,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.white,
  },
});
