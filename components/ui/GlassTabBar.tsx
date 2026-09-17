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
 * Ce qui reste natif : le matériau. `GlassMaterial` pose un vrai UIGlassEffect
 * d'iOS 26, le même verre que les barres système. Avant iOS 26, repli sur un
 * flou expo-blur.
 *
 * Ce qu'on recrée : l'état actif. Pas de pastille derrière l'icône : l'onglet
 * actif se reconnaît à son icône plus foncée, au trait plus épais, en fondu
 * (200 ms, ease-out-quart — cf. DESIGN.md). Lucide n'existe qu'en contour : pas
 * de version pleine à afficher pour l'onglet actif.
 *
 * À droite de la barre, un bouton rond « + » dans le même verre ajoute un
 * challenge. La barre reste centrée à l'écran : une cale invisible de la même
 * largeur équilibre le bouton côté gauche.
 *
 * Les icônes sont posées PAR-DESSUS le verre, pas dedans. Placées comme
 * enfants de GlassView, iOS 26 les réadapte à ce qui passe derrière la barre :
 * leur couleur changeait quelques secondes après la sélection. Même raison pour
 * l'absence d'`isInteractive`, qui éclaire et reteinte le verre au toucher.
 *
 * La barre flotte AU-DESSUS des écrans (position absolue) : le contenu passe
 * dessous et se voit à travers le verre. Chaque écran d'onglet doit donc
 * réserver sa place en bas avec `useTabBarInset()`.
 */

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { PlusIcon, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, motion } from '../../utils/constants';
import GlassMaterial from './GlassMaterial';
import PressableScale from './PressableScale';

// ─── Dimensions ────────────────────────────────────────────────────────────────
// Onglet de 60 × 48 : au-dessus des 44 pt tactiles minimum, sans vide autour de
// l'icône de ICON_SIZE pt. La barre mesure 3 × 60 + 2 × 5 = 190 pt (la native : ~274).
const ITEM_WIDTH = 60;
const ITEM_HEIGHT = 48;
const BAR_PADDING = 5;
const BAR_HEIGHT = ITEM_HEIGHT + BAR_PADDING * 2;
/** Bouton « + » : un rond de la hauteur de la barre, à ADD_GAP pt de son bord droit */
const ADD_SIZE = BAR_HEIGHT;
const ADD_GAP = 12;

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
 * trait fin à IDLE_ICON_OPACITY au repos ; trait plus épais et pleine opacité
 * une fois actif. On anime seulement l'opacité.
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

interface GlassTabBarProps extends BottomTabBarProps {
  /** Toucher le bouton « + » à droite de la barre */
  onAddPress: () => void;
}

export default function GlassTabBar({ state, descriptors, navigation, onAddPress }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();

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
      {/* Cale de la largeur du bouton « + » : garde la barre au centre de l'écran */}
      <View style={styles.addSpacer} pointerEvents="none" />

      <View style={styles.shadow} accessibilityRole="tablist">
        {/* Fond seul : le verre ne contient rien */}
        <GlassMaterial radius={BAR_HEIGHT / 2} />
        {/* Icônes au-dessus du verre, hors de son adaptation de couleur */}
        <View style={styles.bar}>{items}</View>
      </View>

      <PressableScale
        style={[styles.shadow, styles.addButton]}
        pressedScale={0.9}
        onPress={onAddPress}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un livre"
      >
        <GlassMaterial radius={ADD_SIZE / 2} />
        <PlusIcon size={24} color={colors.dark900} strokeWidth={ACTIVE_STROKE} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
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
  bar: {
    flexDirection: 'row',
    padding: BAR_PADDING,
  },
  addSpacer: {
    width: ADD_SIZE + ADD_GAP,
  },
  addButton: {
    width: ADD_SIZE,
    height: ADD_SIZE,
    borderRadius: ADD_SIZE / 2,
    marginLeft: ADD_GAP,
    alignItems: 'center',
    justifyContent: 'center',
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

