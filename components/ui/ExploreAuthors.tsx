/**
 * Composant ExploreAuthors
 *
 * Les auteur·ices les plus lu·es, en rangée qui défile de côté : leur photo
 * dans un rond, le nom dessous. Sans photo libre (constants/exploreAuthors.json,
 * généré par scripts/build-explore-authors.mjs), le rond montre leurs
 * initiales en crème, en Welcome Valentines (la police d'accent), sur l'encre brune du grand chiffre de « Ma page »
 * (`InkFigure`). Photo ou initiales, le rond porte à l'intérieur de son bord
 * le liseré de verre de l'app (`GlassRim`, celui des boutons en verre).
 *
 *    Auteur·ices
 *    (☺)  (☺)  (CH)  (☺) →
 *    Colleen  Freida  Rebecca
 *
 * Toucher un nom lance la recherche sur cet auteur ou cette autrice.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, creamAlpha, fontSize, fonts, spacing } from '../../utils/constants';
import { ACCENT_SCALE } from './AccentWord';
import { GlassRim } from './GlassMaterial';
import { INK } from './InkFigure';
import PressableScale from './PressableScale';

const SIDE = spacing.lg;
const AVATAR = 72;
const ITEM_W = 84;

export interface ExploreAuthor {
  name: string;
  photoUrl: string | null;
}

/** « Sarah J. Maas » → « SM » : première et dernière initiale */
function initials(name: string) {
  const words = name.split(' ').filter((word) => !word.endsWith('.'));
  return `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ''}`.toUpperCase();
}

interface ExploreAuthorsProps {
  authors: ExploreAuthor[];
  onSelect: (name: string) => void;
}

export default function ExploreAuthors({ authors, onSelect }: ExploreAuthorsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        Auteur·ices
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {authors.map((author) => (
          <PressableScale
            key={author.name}
            style={styles.item}
            onPress={() => onSelect(author.name)}
            accessibilityRole="button"
            accessibilityLabel={author.name}
            accessibilityHint="Chercher ses livres"
          >
            <View style={styles.avatar}>
              {author.photoUrl ? (
                <Image
                  source={{ uri: author.photoUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  contentPosition="top"
                  transition={200}
                />
              ) : (
                <LinearGradient colors={INK} style={styles.placeholder}>
                  <Text style={styles.initials}>{initials(author.name)}</Text>
                </LinearGradient>
              )}
              <GlassRim radius={AVATAR / 2} />
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {author.name}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.md,
    lineHeight: 20,
    color: colors.textPrimary,
    paddingHorizontal: SIDE,
  },
  row: {
    paddingHorizontal: SIDE,
    gap: spacing.sm,
  },
  item: {
    width: ITEM_W,
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
    backgroundColor: colors.bgLight,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Police d'accent : un œil plus petit, agrandie comme un mot d'accent
  initials: {
    fontFamily: fonts.accent,
    fontSize: 24 * ACCENT_SCALE,
    lineHeight: 38,
    color: creamAlpha(0.95),
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
