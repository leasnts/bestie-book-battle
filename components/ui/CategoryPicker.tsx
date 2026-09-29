/**
 * CategoryPicker — choisir la couleur (la catégorie) d'une note.
 *
 * Chaque pastille a la couleur de sa catégorie et **son nom écrit** : la couleur
 * seule exclurait les personnes daltoniennes. La choisie est entourée de lie de vin.
 *
 * Un seul sélecteur : l'éditeur de note (en grille) et la feuille rapide de
 * « Ma page » (en rangée qui défile, au-dessus du clavier).
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AnnotationCategory } from '../../types/supabase';
import { ANNOTATION_CATEGORIES, CATEGORY_ORDER } from '../../utils/annotations';
import { borderRadius, colors, fonts, shadowAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

interface CategoryPickerProps {
  value: AnnotationCategory;
  onChange: (category: AnnotationCategory) => void;
  /** `grid` : trois par ligne ; `row` : une rangée qui défile */
  layout?: 'grid' | 'row';
}

export default function CategoryPicker({ value, onChange, layout = 'grid' }: CategoryPickerProps) {
  const chips = CATEGORY_ORDER.map((key) => {
    const option = ANNOTATION_CATEGORIES[key];
    const selected = key === value;
    return (
      <PressableScale
        key={key}
        style={[styles.chip, layout === 'grid' ? styles.chipGrid : styles.chipRow, selected && styles.chipOn]}
        pressedScale={0.96}
        onPress={() => onChange(key)}
        accessibilityRole="button"
        accessibilityLabel={option.label}
        accessibilityState={{ selected }}
      >
        {/* Jamais d'aplat : la couleur de la catégorie, un voile clair en haut */}
        <LinearGradient colors={[option.color, shade(option.color)]} style={StyleSheet.absoluteFill} />
        <Text style={styles.text} numberOfLines={1}>
          {option.label}
        </Text>
      </PressableScale>
    );
  });

  if (layout === 'row') {
    return (
      <ScrollView
        horizontal
        style={styles.rowScroll}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.row}
      >
        {chips}
      </ScrollView>
    );
  }
  return <View style={styles.grid}>{chips}</View>;
}

/** La même couleur, un peu plus sombre en bas */
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const k = 0.92;
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // La rangée garde la hauteur de ses pastilles, même dans un parent qui s'étire
  rowScroll: {
    flexGrow: 0,
  },
  row: {
    gap: spacing.sm,
    paddingVertical: 3,
    alignItems: 'center',
  },
  chip: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  chipGrid: {
    flexGrow: 1,
    flexBasis: '30%',
  },
  chipRow: {
    minHeight: 36,
  },
  chipOn: {
    borderColor: colors.accent,
    shadowColor: shadowAlpha(0.2),
  },
  text: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
});
