/**
 * GlassTabBar — barre d'onglets flottante en verre, dessinée sur mesure.
 *
 * Pourquoi pas la barre native (NativeTabs) :
 * sur iOS 26, la largeur de la barre en verre est fixée par le système. Ni
 * expo-router ni react-native-screens ne l'exposent, et UIKit ignore
 * `itemPositioning` / `itemWidth` (vérifié le 2026-09-14 : valeurs bien appliquées
 * sur l'UITabBar, largeur inchangée). Avec 3 icônes sans texte, elle laissait
 * trop de vide. Ici, chaque onglet fait ITEM_WIDTH et la barre se resserre autour.
 *
 * Ce qui reste natif : le matériau. `GlassView` (expo-glass-effect) pose un vrai
 * UIGlassEffect d'iOS 26, le même verre que les barres système. Avant iOS 26,
 * repli sur un flou expo-blur.
 *
 * Ce qu'on recrée : la pastille de l'onglet actif, qui glisse d'un onglet à
 * l'autre (ease-out-quart, 300 ms, jamais de rebond — cf. DESIGN.md), avec la
 * même teinte que la barre native (mesurée : ~7 % d'encre sur le verre), et le
 * fondu de l'icône entre contour noyer effacé et plein noyer.
 *
 * Pastille et icônes sont posées PAR-DESSUS le verre, pas dedans. Placées comme
 * enfants de GlassView, iOS 26 les réadapte à ce qui passe derrière la barre :
 * leur couleur changeait quelques secondes après la sélection. Même raison pour
 * l'absence d'`isInteractive`, qui éclaire et reteinte le verre au toucher.
 *
 * La barre flotte AU-DESSUS des écrans (position absolue) : le contenu passe
 * dessous et se voit à travers le verre. Chaque écran d'onglet doit donc
 * réserver sa place en bas avec `useTabBarInset()`.
 */

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React, { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, creamAlpha, inkAlpha, motion } from '../../utils/constants';
import PressableScale from './PressableScale';

// ─── Dimensions ────────────────────────────────────────────────────────────────
// Onglet de 60 × 48 : au-dessus des 44 pt tactiles minimum, sans vide autour de
// l'icône de ICON_SIZE pt. La barre mesure 3 × 60 + 2 × 5 = 190 pt (la native : ~274).
const ITEM_WIDTH = 60;
const ITEM_HEIGHT = 48;
const BAR_PADDING = 5;
const BAR_HEIGHT = ITEM_HEIGHT + BAR_PADDING * 2;

/**
 * Opacité d'une icône non sélectionnée. Même encre noyer que l'icône active,
 * juste plus effacée : 50 % donne 3,05:1 sur le verre crème, au-dessus du
 * minimum de 3:1 pour une icône porteuse de sens. Ne pas descendre en dessous.
 */
const IDLE_ICON_OPACITY = 0.5;

/** Icônes Lucide de la barre : taille et épaisseur du trait au repos / actif. */
const ICON_SIZE = 22;
const IDLE_STROKE = 1.75;
const ACTIVE_STROKE = 2.25;

/**
 * Distance entre le bas de l'écran et le bas de la barre. Comme la barre native,
 * elle mord un peu sur la zone du « home indicator » plutôt que de flotter
 * au-dessus de toute la marge de sécurité.
 */
function barBottom(safeBottom: number) {
  return Math.max(safeBottom - 12, 16);
}

/** Hauteur à réserver en bas d'un écran d'onglet pour que rien ne passe sous la barre. */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return barBottom(insets.bottom) + BAR_HEIGHT;
}

// ─── Icône ─────────────────────────────────────────────────────────────────────

/**
 * Icône Lucide à deux états, empilés et fondus l'un dans l'autre, en encre noyer :
 * trait fin à IDLE_ICON_OPACITY au repos, trait plus épais et pleine opacité une
 * fois actif. Pas de version « remplie » : Lucide n'en a pas, et remplir ses tracés
 * (loupe, silhouette) boucherait le dessin. On anime seulement l'opacité.
 */
export function TabIcon({ icon: Icon, focused }: { icon: LucideIcon; focused: boolean }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = reducedMotion
      ? (focused ? 1 : 0)
      : withTiming(focused ? 1 : 0, {
          duration: motion.duration.standard,
          easing: Easing.bezier(...motion.easing.easeOutQuart),
        });
  }, [focused, reducedMotion, progress]);

  const activeStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const idleStyle = useAnimatedStyle(() => ({ opacity: (1 - progress.value) * IDLE_ICON_OPACITY }));

  return (
    <View style={styles.icon}>
      <Animated.View style={[styles.iconLayer, idleStyle]}>
        <Icon size={ICON_SIZE} color={colors.dark900} strokeWidth={IDLE_STROKE} />
      </Animated.View>
      <Animated.View style={[styles.iconLayer, activeStyle]}>
        <Icon size={ICON_SIZE} color={colors.dark900} strokeWidth={ACTIVE_STROKE} />
      </Animated.View>
    </View>
  );
}

// ─── Barre ─────────────────────────────────────────────────────────────────────

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const pillX = useSharedValue(state.index * ITEM_WIDTH);

  useEffect(() => {
    const target = state.index * ITEM_WIDTH;
    pillX.value = reducedMotion
      ? target
      : withTiming(target, {
          duration: motion.duration.slow,
          easing: Easing.bezier(...motion.easing.easeOutQuart),
        });
  }, [state.index, reducedMotion, pillX]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pillX.value }] }));

  const items = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    return (
      <PressableScale
        key={route.key}
        style={styles.item}
        pressedScale={0.9}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={options.tabBarAccessibilityLabel}
      >
        {options.tabBarIcon?.({ focused, color: colors.dark900, size: ICON_SIZE })}
      </PressableScale>
    );
  });

  return (
    <View style={[styles.anchor, { bottom: barBottom(insets.bottom) }]} pointerEvents="box-none">
      <View style={styles.shadow} accessibilityRole="tablist">
        {/* Fond seul : le verre ne contient rien */}
        {isLiquidGlassAvailable() ? (
          <GlassView style={styles.material} glassEffectStyle="regular" />
        ) : (
          <BlurView style={[styles.material, styles.materialFallback]} intensity={40} tint="light" />
        )}
        {/* Pastille et icônes au-dessus du verre, hors de son adaptation de couleur */}
        <View style={styles.bar}>
          <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />
          {items}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // L'ombre vit sur un parent sans overflow : sur la vue qui arrondit le verre,
  // `overflow: hidden` la couperait.
  shadow: {
    borderRadius: BAR_HEIGHT / 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  material: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    padding: BAR_PADDING,
  },
  materialFallback: {
    backgroundColor: creamAlpha(0.8),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: inkAlpha(0.08),
  },
  pill: {
    position: 'absolute',
    top: BAR_PADDING,
    left: BAR_PADDING,
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: ITEM_HEIGHT / 2,
    backgroundColor: inkAlpha(0.07),
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Les deux états se superposent exactement dans cette boîte
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

