/**
 * CategoryPicker — choisir la couleur (la catégorie) d'une note.
 *
 * Chaque pastille a la couleur de sa catégorie et **son nom écrit** : la couleur
 * seule exclurait les personnes daltoniennes. La choisie est entourée de lie de vin.
 *
 * Un seul sélecteur : l'éditeur de note (en grille) et la feuille rapide de
 * « Ma page » (en intercalaires, `tabs`). Les intercalaires n'ont pas de mot :
 * l'illustration de la catégorie, et son nom pour VoiceOver.
 *
 *   ┆ Une pensée, un avis…            ┆
 *   ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯
 *      ╰ ♥ ╯╰ 🔥 ╯╰ ☁ ╯╰ 🎭 ╯╰ 💡 ╯╰ 📌 ╯   les intercalaires sortent du bas de
 *                                ╰────╯   la note ; la choisie dépasse plus
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AnnotationCategory } from '../../types/supabase';
import { ANNOTATION_CATEGORIES, CATEGORY_ICONS, CATEGORY_ORDER } from '../../utils/annotations';
import { borderRadius, colors, fonts, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

/** La part de l'intercalaire cachée sous la note */
const TAB_TUCK = 10;
/** L'illustration d'un intercalaire, plus large que lui : elle est coupée */
const TAB_ICON = 40;

interface CategoryPickerProps {
  value: AnnotationCategory;
  onChange: (category: AnnotationCategory) => void;
  /**
   * `grid` : trois par ligne ; `tabs` : des intercalaires collés sous la note
   * (à poser juste après elle, sans écart)
   */
  layout?: 'grid' | 'tabs';
}

export default function CategoryPicker({ value, onChange, layout = 'grid' }: CategoryPickerProps) {
  if (layout === 'tabs') return <CategoryTabs value={value} onChange={onChange} />;

  const chips = CATEGORY_ORDER.map((key) => {
    const option = ANNOTATION_CATEGORIES[key];
    const selected = key === value;
    return (
      <PressableScale
        key={key}
        style={[styles.chip, styles.chipGrid, selected && styles.chipOn]}
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

  return <View style={styles.grid}>{chips}</View>;
}

/**
 * Les intercalaires : on tire celui de la couleur voulue, il dépasse plus que les
 * autres. Pas de mot : l'illustration de la catégorie, en bas, coupée par le bord,
 * dans un ton plus sombre de la couleur (VoiceOver lit le nom).
 */
function CategoryTabs({ value, onChange }: Pick<CategoryPickerProps, 'value' | 'onChange'>) {
  return (
    <View style={styles.tabs}>
      {CATEGORY_ORDER.map((key) => {
        const option = ANNOTATION_CATEGORIES[key];
        const selected = key === value;
        return (
          <PressableScale
            key={key}
            style={[styles.tab, selected && styles.tabOn]}
            pressedScale={0.94}
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
            <Image
              source={CATEGORY_ICONS[key]}
              style={styles.tabIcon}
              tintColor={shade(option.color, selected ? 0.62 : 0.78)}
              contentFit="contain"
            />
          </PressableScale>
        );
      })}
    </View>
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
  chipOn: {
    borderColor: colors.accent,
    shadowColor: shadowAlpha(0.2),
  },
  text: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
  },

  // Les intercalaires glissent sous le bord de la note (le haut est caché),
  // entre les deux arrondis du bas, à parts égales
  tabs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
    marginTop: -TAB_TUCK,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flex: 1,
    height: TAB_TUCK + 30,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  tabOn: {
    height: TAB_TUCK + 40,
  },
  // L'illustration sort par le bas, coupée : un masque, teinté d'un ton plus
  // sombre que l'intercalaire (le grain de l'aquarelle est dans la transparence)
  tabIcon: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: -TAB_ICON * 0.3,
    width: TAB_ICON,
    height: TAB_ICON,
  },
});
