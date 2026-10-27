/**
 * Composant ExploreAuthors
 *
 * Les auteur·ices les plus lu·es, en rangée qui défile de côté : un rond qui
 * montre la couverture de leur livre phare (pas de photo : on n'en a pas), et
 * le nom dessous.
 *
 *    Auteur·ices
 *    (▐█▌) (▐█▌) (▐█▌) (▐█▌) →
 *    Colleen  Freida  Rebecca
 *
 * Toucher un nom lance la recherche sur cet auteur ou cette autrice.
 */

import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, creamAlpha, fonts, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

const SIDE = spacing.lg;
const AVATAR = 72;
const ITEM_W = 84;

export interface ExploreAuthor {
  name: string;
  coverUrl: string | null;
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
              {author.coverUrl && (
                <Image source={{ uri: author.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
              )}
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
    fontSize: 19,
    lineHeight: 24,
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
    borderWidth: 2,
    borderColor: creamAlpha(0.9),
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
