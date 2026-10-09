/**
 * CategoryPicker — choisir la couleur (la catégorie) d'une note.
 *
 * Chaque pastille a la couleur de sa catégorie et **son nom écrit** : la couleur
 * seule exclurait les personnes daltoniennes. La choisie est entourée de rouge.
 *
 * Un seul sélecteur : l'éditeur de note (en grille) et la feuille rapide de
 * « Ma page » (en intercalaires, `tabs`). Les intercalaires n'ont pas de mot :
 * l'illustration de la catégorie, et son nom pour VoiceOver.
 *
 *   ┆ Une pensée, un avis…            ┆
 *   ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯
 *      ╰ ♥ ╯╰ 🔥 ╯╰ ☁ ╯╰ 🎭 ╯╰ 💡 ╯╰ 📌 ╯   les intercalaires sortent du bas de
 *                                ╰────╯   la note ; la choisie dépasse plus
 *
 * La choisie prolonge la note : la couture y descend et en fait le tour
 * (`tabStitchNotch` ouvre celle de la note au bon endroit).
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
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
import { STITCH, noteStitchColor } from './NoteSticker';
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
const TAB_GAP = 3;
const TAB_RADIUS = borderRadius.md;
/** La couture dans l'intercalaire : aussi près du bord que celle de la note */
const TAB_STITCH_INSET = 7;
/** Le plus haut qu'un intercalaire puisse être : la couture y est dessinée d'un bloc */
const TAB_MAX = TAB_TUCK + TAB_HEIGHT + TAB_PULL;

/**
 * Où la couture de la note s'ouvre pour descendre dans l'intercalaire choisi :
 * les intercalaires ont tous la même largeur, on n'a rien à mesurer.
 */
export function tabStitchNotch(width: number, category: AnnotationCategory) {
  const index = CATEGORY_ORDER.indexOf(category);
  const count = CATEGORY_ORDER.length;
  const tab = (width - spacing.lg * 2 - TAB_GAP * (count - 1)) / count;
  const x = spacing.lg + index * (tab + TAB_GAP);
  return { left: x + TAB_STITCH_INSET, right: x + tab - TAB_STITCH_INSET };
}

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
 * Un intercalaire. Tiré, il glisse vers le bas sans rebond, et son illustration
 * se redresse en fonçant, comme l'encre qui infuse : la choisie est la seule
 * droite. Rendu, il remonte, pâlit et se penche à nouveau. Sans animation si
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
  const [width, setWidth] = useState(0);
  // La couture, calée en bas : elle descend avec l'intercalaire qu'on tire
  const i = TAB_STITCH_INSET;
  const rr = TAB_RADIUS - i * 0.6;
  const b = TAB_MAX - i;
  const stitch = `M ${i} 0 V ${b - rr} Q ${i} ${b} ${i + rr} ${b} H ${width - i - rr} Q ${width - i} ${b} ${width - i} ${b - rr} V 0`;

  return (
    <PressableScale
      style={styles.tabPress}
      pressedScale={0.94}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityState={{ selected }}
    >
      <Animated.View style={[styles.tab, tabStyle]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
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
        {width > 0 && (
          <Animated.View style={[styles.tabStitch, inkStyle]} pointerEvents="none">
            <Svg width={width} height={TAB_MAX}>
              <Path
                d={stitch}
                fill="none"
                stroke={noteStitchColor(option.color)}
                strokeWidth={STITCH.width}
                strokeDasharray={STITCH.dash}
                strokeLinecap={STITCH.cap}
              />
            </Svg>
          </Animated.View>
        )}
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
    gap: TAB_GAP,
    marginTop: -TAB_TUCK,
    paddingHorizontal: spacing.lg,
  },
  tabPress: {
    flex: 1,
  },
  tab: {
    borderBottomLeftRadius: TAB_RADIUS,
    borderBottomRightRadius: TAB_RADIUS,
    overflow: 'hidden',
  },
  tabStitch: {
    position: 'absolute',
    left: 0,
    bottom: 0,
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
