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
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { AnnotationCategory } from '../../types/supabase';
import { ANNOTATION_CATEGORIES, CATEGORY_ICONS, CATEGORY_ORDER } from '../../utils/annotations';
import { borderRadius, colors, fonts, inkAlpha, motion, shadowAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

/** La part de l'intercalaire cachée sous la note */
const TAB_TUCK = 10;
/** L'illustration d'un intercalaire, à peine coupée par le bas : on la reconnaît */
const TAB_ICON = 30;
/** Un peu de travers, un coup dans un sens, un coup dans l'autre : posées à la main */
const TAB_TILT = [-8, 7, -6, 8, -7, 6];
/** La part visible d'un intercalaire, et ce que la choisie dépasse en plus */
const TAB_HEIGHT = 30;
const TAB_PULL = 10;

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
      {CATEGORY_ORDER.map((key, index) => (
        <CategoryTab
          key={key}
          category={key}
          tilt={TAB_TILT[index]}
          selected={key === value}
          onPress={() => {
            if (key === value) return;
            Haptics.selectionAsync().catch(() => {});
            onChange(key);
          }}
        />
      ))}
    </View>
  );
}

/**
 * Un intercalaire. Tiré, il glisse vers le bas avec un léger rebond ; son
 * illustration saute, tourne dans l'autre sens et se repose. Rendu, il remonte
 * sans rebond. Sans animation si « Réduire les animations » est activé.
 */
function CategoryTab({
  category,
  tilt,
  selected,
  onPress,
}: {
  category: AnnotationCategory;
  tilt: number;
  selected: boolean;
  onPress: () => void;
}) {
  const option = ANNOTATION_CATEGORIES[category];
  const reducedMotion = useReducedMotion();
  const out = useSharedValue(selected ? 1 : 0);
  const hop = useSharedValue(0);
  const first = useRef(true);

  useEffect(() => {
    // À l'ouverture, les intercalaires sont déjà en place
    if (first.current) {
      first.current = false;
      return;
    }
    if (reducedMotion) {
      out.value = selected ? 1 : 0;
      return;
    }
    if (selected) {
      out.value = withSpring(1, { damping: 11, stiffness: 260, mass: 0.7 });
      hop.value = 0;
      hop.value = withSequence(
        withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 7, stiffness: 180 }),
      );
    } else {
      out.value = withTiming(0, {
        duration: motion.duration.standard,
        easing: Easing.bezier(...motion.easing.easeOutQuart),
      });
    }
  }, [selected, reducedMotion, out, hop]);

  const tabStyle = useAnimatedStyle(() => ({
    height: TAB_TUCK + TAB_HEIGHT + out.value * TAB_PULL,
  }));
  // Le saut : un peu plus haut, un peu plus grand, penché dans l'autre sens
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -hop.value * 7 },
      { scale: 1 + hop.value * 0.18 },
      { rotate: `${tilt - hop.value * tilt * 2.2}deg` },
    ],
  }));

  return (
    <PressableScale
      style={styles.tabPress}
      pressedScale={0.94}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityState={{ selected }}
    >
      <Animated.View style={[styles.tab, tabStyle]}>
        {/* Aucune ombre sous la note : le haut reprend le ton du bas de la note
            (le voile de `NoteSticker` l’y assombrit d’environ 6 %), l'intercalaire
            en est le prolongement */}
        <LinearGradient
          colors={[shade(option.color, 0.94), shade(option.color, 0.86)]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.tabIcon, iconStyle]}>
          <Image
            source={CATEGORY_ICONS[category]}
            style={StyleSheet.absoluteFill}
            tintColor={shade(option.color, selected ? 0.6 : 0.72)}
            contentFit="contain"
          />
        </Animated.View>
      </Animated.View>
    </PressableScale>
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
  tabPress: {
    flex: 1,
  },
  tab: {
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  // L'illustration sort par le bas, coupée : un masque, teinté d'un ton plus
  // sombre que l'intercalaire (le grain de l'aquarelle est dans la transparence)
  tabIcon: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: -TAB_ICON * 0.15,
    width: TAB_ICON,
    height: TAB_ICON,
  },
});
