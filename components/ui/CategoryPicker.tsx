/**
 * CategoryPicker — choisir la couleur (la catégorie) d'une note.
 *
 * Chaque pastille a la couleur de sa catégorie et **son nom écrit** : la couleur
 * seule exclurait les personnes daltoniennes. La choisie est entourée de lie de vin.
 *
 * Un seul sélecteur : l'éditeur de note (en grille) et la feuille rapide de
 * « Ma page » (en intercalaires, `tabs`).
 *
 *   ┆ Une pensée, un avis…            ┆
 *   ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯
 *      ╰Cœur╯╰Spicy╯╰Larmes╯ ╰À RETENIR╯   les intercalaires sortent du bas de
 *                              ╰───────╯   la note ; la choisie dépasse plus
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { AnnotationCategory } from '../../types/supabase';
import { ANNOTATION_CATEGORIES, CATEGORY_ORDER } from '../../utils/annotations';
import { borderRadius, colors, fonts, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

/** La part de l'intercalaire cachée sous la note */
const TAB_TUCK = 10;

interface CategoryPickerProps {
  value: AnnotationCategory;
  onChange: (category: AnnotationCategory) => void;
  /**
   * `grid` : trois par ligne ; `row` : une rangée qui défile ; `tabs` : des
   * intercalaires collés sous la note (à poser juste après elle, sans écart)
   */
  layout?: 'grid' | 'row' | 'tabs';
}

export default function CategoryPicker({ value, onChange, layout = 'grid' }: CategoryPickerProps) {
  if (layout === 'tabs') return <CategoryTabs value={value} onChange={onChange} />;

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

/** Les intercalaires : on tire celui de la couleur voulue, il dépasse plus que les autres */
function CategoryTabs({ value, onChange }: Pick<CategoryPickerProps, 'value' | 'onChange'>) {
  const scroll = useRef<ScrollView>(null);
  const shown = useRef(false);
  // À l'ouverture, la choisie est en vue, même si elle est au bout de la rangée
  const reveal = (key: AnnotationCategory) => (e: LayoutChangeEvent) => {
    if (key !== value || shown.current) return;
    shown.current = true;
    scroll.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - spacing.lg), animated: false });
  };

  return (
    <ScrollView
      ref={scroll}
      horizontal
      style={styles.tabsScroll}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      contentContainerStyle={styles.tabs}
    >
      {CATEGORY_ORDER.map((key) => {
        const option = ANNOTATION_CATEGORIES[key];
        const selected = key === value;
        return (
          <PressableScale
            key={key}
            style={[styles.tab, selected && styles.tabOn]}
            onLayout={reveal(key)}
            pressedScale={0.96}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
          >
            {/* Du haut (sous la note) vers le bas : l'ombre de la note, puis la couleur */}
            <LinearGradient
              colors={[shade(option.color, 0.8), option.color, shade(option.color)]}
              locations={[0, 0.35, 1]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.tabText, selected && styles.tabTextOn]} numberOfLines={1}>
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

/** La même couleur, un peu plus sombre en bas */
function shade(hex: string, k = 0.92) {
  const n = parseInt(hex.slice(1), 16);
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

  // Les intercalaires glissent sous le bord de la note : le haut est caché
  tabsScroll: {
    flexGrow: 0,
    marginTop: -TAB_TUCK,
  },
  // Entre les deux arrondis du bas de la note
  tabs: {
    paddingHorizontal: spacing.lg,
    gap: 3,
    alignItems: 'flex-start',
  },
  tab: {
    height: TAB_TUCK + 30,
    paddingTop: TAB_TUCK,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  tabOn: {
    height: TAB_TUCK + 40,
  },
  tabText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: inkAlpha(0.6),
  },
  tabTextOn: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.textPrimary,
  },
});
