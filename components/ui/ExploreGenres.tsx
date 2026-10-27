/**
 * Composant ExploreGenres
 *
 * Les genres de l'onglet Explorer, en une rangée qui défile de côté : une petite section
 * colorée par genre, dans une paire de la charte Lowki (dégradé clair → foncé,
 * jamais d'aplat), cousue comme la bannière Inviter du profil.
 *
 *    Genres
 *    ┌──────────┐ ┌──────────┐ ┌────
 *    │Contempor.│ │Thriller  │ │Rom… →
 *    │       ☕ │ │       ◎  │ │      ← illustration en ton sur ton qui déborde
 *    └──────────┘ └──────────┘ └────
 *
 * Ton sur ton pour l'illustration seulement, comme le mot en filigrane des
 * notes : l'aquarelle de Lea (assets/images/genres, masques préparés par
 * scripts/build-genre-illustrations.py) teintée d'encre transparente, donc la
 * couleur du cadre en plus foncé (plus clair sur le chocolat), grande et coupée par le bord. Le nom suit la charte : chocolat
 * foncé sur beurre et beige, beurre clair sur rouge et chocolat (le nom en ton
 * sur ton a été essayé et ne se lisait pas, Lea 2026-10-27).
 *
 * Toucher un genre ouvre tous ses livres (l'écran Explorer passe en liste).
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, creamAlpha, fontSize, fonts, inkAlpha, lowki, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';
import { StitchBorder } from './Stitch';

const SIDE = spacing.lg;
const GAP = spacing.md;
/** Tous les genres ont la même taille ; « Développement » tient juste sur une ligne */
const TILE_W = 156;
const TILE_H = 88;
const RADIUS = borderRadius.lg;
const ILLUSTRATION = 96;

export interface ExploreGenre {
  key: string;
  label: string;
  books: BookSearchResult[];
}

type Pair = keyof typeof lowki;

/** Les couleurs tournent dans cet ordre : deux voisins ne se ressemblent jamais */
const PAIRS: Pair[] = ['butter', 'chocolate', 'red', 'beige'];

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

/**
 * La teinte de l'illustration, par fond. Le chocolat est trop sombre pour
 * qu'une encre plus foncée s'y voie : là, le ton sur ton passe en plus clair
 * (un voile crème), comme la charte le permet.
 */
const INK: Record<Pair, { tint: string; opacity: number }> = {
  butter: { tint: inkAlpha(1), opacity: 0.2 },
  beige: { tint: inkAlpha(1), opacity: 0.2 },
  red: { tint: inkAlpha(1), opacity: 0.4 },
  chocolate: { tint: creamAlpha(1), opacity: 0.14 },
};

/** Fonds clairs : nom en chocolat */
const LIGHT_PAIRS: Pair[] = ['butter', 'beige'];

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
          const pair = PAIRS[index % PAIRS.length];
          const illustration = ILLUSTRATIONS[genre.key];
          const onLight = LIGHT_PAIRS.includes(pair);
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
              <LinearGradient colors={[lowki[pair].light, lowki[pair].dark]} style={StyleSheet.absoluteFill} />
              {illustration && (
                <Image
                  source={illustration}
                  style={[styles.illustration, { opacity: INK[pair].opacity }]}
                  contentFit="contain"
                  tintColor={INK[pair].tint}
                  pointerEvents="none"
                />
              )}
              <StitchBorder radius={RADIUS} color={creamAlpha(onLight ? 0.55 : 0.35)} />
              <Text
                style={[styles.label, { color: onLight ? lowki.chocolate.dark : lowki.butter.light }]}
                numberOfLines={2}
              >
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
  // Déborde en bas à droite, penchée : la section la coupe
  illustration: {
    position: 'absolute',
    right: -14,
    bottom: -22,
    width: ILLUSTRATION,
    height: ILLUSTRATION,
    transform: [{ rotate: '-10deg' }],
  },
  label: {
    fontFamily: fonts.display,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
});
