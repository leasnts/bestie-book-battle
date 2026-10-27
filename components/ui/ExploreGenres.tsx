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
 *    │       ☕ │ │       ◎  │ │      ← icône en ton sur ton qui déborde
 *    └──────────┘ └──────────┘ └────
 *
 * Ton sur ton, le nom compris (Lea, 2026-10-27) : le nom prend la nuance la
 * plus foncée de la paire (`deep`), sans ombre ni liseré ; l'icône Lucide est
 * la couleur du fond assombrie (encre transparente), gravée d'un liseré clair.
 *
 * Toucher un genre ouvre tous ses livres (l'écran Explorer passe en liste).
 */

import { LinearGradient } from 'expo-linear-gradient';
import {
  BackpackIcon,
  CastleIcon,
  CoffeeIcon,
  CrownIcon,
  FeatherIcon,
  FingerprintIcon,
  GhostIcon,
  HeartIcon,
  HourglassIcon,
  LightbulbIcon,
  type LucideIcon,
  MessageCircleIcon,
  RocketIcon,
  SproutIcon,
  SunIcon,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, creamAlpha, fontSize, fonts, inkAlpha, lowki, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';
import { StitchBorder } from './Stitch';

const SIDE = spacing.lg;
const GAP = spacing.md;
const TILE_MIN_W = 120;
const TILE_H = 84;
const RADIUS = borderRadius.lg;
const ICON = 64;

export interface ExploreGenre {
  key: string;
  label: string;
  books: BookSearchResult[];
}

type Pair = keyof typeof lowki;

/** Les couleurs tournent dans cet ordre : deux voisins ne se ressemblent jamais */
const PAIRS: Pair[] = ['butter', 'chocolate', 'red', 'beige'];

/** L'icône de chaque genre */
const ICONS: Record<string, LucideIcon> = {
  contemporary: CoffeeIcon,
  thriller: FingerprintIcon,
  fantasy: CastleIcon,
  'feel-good': SunIcon,
  'science-fiction': RocketIcon,
  romance: HeartIcon,
  historical: HourglassIcon,
  classics: FeatherIcon,
  horror: GhostIcon,
  'young-adult': BackpackIcon,
  comics: MessageCircleIcon,
  romantasy: CrownIcon,
  'self-help': SproutIcon,
  nonfiction: LightbulbIcon,
};

/** Fonds clairs : liseré et encre plus marqués pour que le ton sur ton se lise */
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
          const Icon = ICONS[genre.key] ?? HeartIcon;
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
                style={[styles.label, { color: lowki[pair].deep }]}
                numberOfLines={1}
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
    fontSize: 19,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  row: {
    paddingHorizontal: SIDE,
    gap: GAP,
  },
  // Largeur au nom : la taille du texte ne change jamais d'un genre à l'autre
  tile: {
    minWidth: TILE_MIN_W,
    height: TILE_H,
    borderRadius: RADIUS,
    overflow: 'hidden',
    padding: spacing.md,
    // Place pour l'icône qui déborde à droite du nom
    paddingRight: spacing['2xl'],
  },
  // Déborde en bas à droite, penchée : la section la coupe
  icon: {
    position: 'absolute',
    right: -12,
    bottom: -16,
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
    fontSize: fontSize.md,
    lineHeight: 20,
  },
});
