/**
 * Composant ExploreGenres
 *
 * Les genres de l'onglet Explorer, en grille de deux colonnes : une section
 * colorée par genre, dans une paire de la charte Lowki (dégradé clair → foncé,
 * jamais d'aplat), cousue comme la bannière Inviter du profil.
 *
 *    Genres
 *    ┌────────────┐ ┌────────────┐
 *    │Contemporain│ │ Thriller   │
 *    │         ☕ │ │         ◎  │   ← grande icône en ton sur ton qui déborde
 *    └────────────┘ └────────────┘
 *
 * Ton sur ton, le nom compris (Lea, 2026-10-27) : le nom prend la teinte
 * foncée de la paire, l'icône Lucide la couleur du fond assombrie (encre
 * transparente), tous deux gravés d'un liseré clair dessous.
 *
 * Toucher un genre ouvre tous ses livres (l'écran Explorer passe en liste).
 */

import { LinearGradient } from 'expo-linear-gradient';
import {
  BackpackIcon,
  CastleIcon,
  CoffeeIcon,
  CrownIcon,
  FingerprintIcon,
  HeartIcon,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, creamAlpha, fonts, inkAlpha, lowki, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';
import { StitchBorder } from './Stitch';

const SIDE = spacing.lg;
const GAP = spacing.md;
const TILE_H = 112;
const RADIUS = borderRadius.xl;
const ICON = 88;

export interface ExploreGenre {
  key: string;
  label: string;
  books: BookSearchResult[];
}

type Pair = keyof typeof lowki;

/**
 * Couleur et icône de chaque genre. Les couleurs alternent pour que deux
 * voisins (côte à côte ou l'un sous l'autre) ne se ressemblent jamais.
 */
const STYLE: Record<string, { pair: Pair; icon: LucideIcon }> = {
  contemporary: { pair: 'butter', icon: CoffeeIcon },
  thriller: { pair: 'chocolate', icon: FingerprintIcon },
  romance: { pair: 'red', icon: HeartIcon },
  'young-adult': { pair: 'beige', icon: BackpackIcon },
  fantasy: { pair: 'chocolate', icon: CastleIcon },
  romantasy: { pair: 'red', icon: CrownIcon },
};
const FALLBACK = { pair: 'beige' as Pair, icon: HeartIcon };

/** Fonds clairs : liseré et encre plus marqués pour que le ton sur ton se lise */
const LIGHT_PAIRS: Pair[] = ['butter', 'beige'];

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
          const { pair, icon: Icon } = STYLE[genre.key] ?? FALLBACK;
          const onLight = LIGHT_PAIRS.includes(pair);
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
              <LinearGradient colors={[lowki[pair].light, lowki[pair].dark]} style={StyleSheet.absoluteFill} />
              {/* L'icône gravée : liseré clair décalé dessous, puis la couleur du fond assombrie */}
              <View style={styles.icon} pointerEvents="none">
                <Icon
                  size={ICON}
                  strokeWidth={1.6}
                  color={creamAlpha(onLight ? 0.45 : 0.16)}
                  style={styles.iconEdge}
                />
                <Icon size={ICON} strokeWidth={1.6} color={inkAlpha(onLight ? 0.16 : 0.32)} style={styles.iconInk} />
              </View>
              <StitchBorder radius={RADIUS} color={creamAlpha(onLight ? 0.55 : 0.35)} />
              <Text
                style={[
                  styles.label,
                  { color: lowki[pair].dark, textShadowColor: creamAlpha(onLight ? 0.6 : 0.22) },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {genre.label}
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
  tile: {
    height: TILE_H,
    borderRadius: RADIUS,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  // Déborde en bas à droite, penchée : la section la coupe
  icon: {
    position: 'absolute',
    right: -18,
    bottom: -20,
    width: ICON,
    height: ICON + 1.5,
    transform: [{ rotate: '-12deg' }],
  },
  iconEdge: {
    position: 'absolute',
    top: 1.5,
  },
  iconInk: {
    position: 'absolute',
    top: 0,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 20,
    // Gravé : un liseré clair juste dessous
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
});
