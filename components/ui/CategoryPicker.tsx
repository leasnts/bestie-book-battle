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
 *      ╭────╮
 *      ╭ 📌 ╮╭ ♥ ╮╭ 🔥 ╮╭ ☁ ╮╭ 🎭 ╮╭ 💡 ╮   les intercalaires sortent du haut de
 *   ╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮   la note ; la choisie dépasse plus
 *   ┆ Une pensée, un avis…            ┆
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
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
/** Tirer un intercalaire : lent à la fin, comme un onglet de papier qui glisse */
const TAB_IN_MS = 420;

interface CategoryPickerProps {
  value: AnnotationCategory;
  onChange: (category: AnnotationCategory) => void;
  /**
   * `grid` : trois par ligne ; `tabs` : des intercalaires collés au-dessus de
   * la note (à poser juste avant elle, sans écart, la note par-dessus)
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
 * Les intercalaires, au-dessus de la note : on tire celui de la couleur voulue,
 * il dépasse plus que les autres. Pas de mot : l'illustration de la catégorie,
 * en haut, coupée par le bord, dans un ton plus sombre de la couleur (VoiceOver
 * lit le nom).
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
 * Un intercalaire. Tiré, il monte sans rebond, et son illustration
 * se redresse en fonçant, comme l'encre qui infuse : la choisie est la seule
 * droite. Rendu, il redescend, pâlit et se penche à nouveau. Sans animation si
 * « Réduire les animations » est activé.
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

  useEffect(() => {
    const to = selected ? 1 : 0;
    if (reducedMotion) {
      out.value = to;
      return;
    }
    out.value = withTiming(to, {
      duration: selected ? TAB_IN_MS : motion.duration.slow,
      easing: selected ? Easing.bezier(...motion.easing.easeOutExpo) : Easing.bezier(...motion.easing.easeOutQuart),
    });
  }, [selected, reducedMotion, out]);

  const tabStyle = useAnimatedStyle(() => ({
    height: TAB_TUCK + TAB_HEIGHT + out.value * TAB_PULL,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tilt * (1 - out.value)}deg` }, { scale: 1 + out.value * 0.06 }],
  }));
  // L'encre foncée, par-dessus l'encre pâle, apparaît avec la sélection
  const inkStyle = useAnimatedStyle(() => ({ opacity: out.value }));

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
        {/* Aucune ombre sur la note : le bas reprend le ton du haut de la note
            (le voile de `NoteSticker` l’y éclaircit), l'intercalaire en est le
            prolongement */}
        <LinearGradient
          colors={[shade(option.color, 0.94), lighten(option.color, 0.2)]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.tabIcon, iconStyle]}>
          <Image
            source={CATEGORY_ICONS[category]}
            style={StyleSheet.absoluteFill}
            tintColor={shade(option.color, 0.72)}
            contentFit="contain"
          />
          <Animated.View style={[StyleSheet.absoluteFill, inkStyle]}>
            <Image
              source={CATEGORY_ICONS[category]}
              style={StyleSheet.absoluteFill}
              tintColor={shade(option.color, 0.6)}
              contentFit="contain"
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}

/** La même couleur, un peu plus claire (vers le blanc) */
function lighten(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * k);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
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

  // Les intercalaires glissent sous le bord de la note (le bas est caché),
  // entre les deux arrondis du haut, à parts égales
  tabs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: -TAB_TUCK,
    paddingHorizontal: spacing.lg,
  },
  tabPress: {
    flex: 1,
  },
  tab: {
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    overflow: 'hidden',
  },
  // L'illustration sort par le haut, coupée : un masque, teinté d'un ton plus
  // sombre que l'intercalaire (le grain de l'aquarelle est dans la transparence)
  tabIcon: {
    position: 'absolute',
    alignSelf: 'center',
    top: -TAB_ICON * 0.15,
    width: TAB_ICON,
    height: TAB_ICON,
  },
});
