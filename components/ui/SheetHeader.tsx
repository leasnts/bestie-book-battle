/**
 * Norme des bottom sheets natifs : l'en-tête
 *
 *    ┌────────────────────────────────┐
 *    │ Mes lectures               (+) │  ← titre ferré à gauche, actions à droite
 *    │                                │
 *
 * Règle non négociable : **le titre d'un sheet n'est jamais centré.** Il est
 * ferré à gauche, en Fraunces 22, comme les sheets dessinés à la main
 * (SheetPage).
 *
 * La barre de navigation d'iOS centre toujours son titre et n'offre aucun
 * réglage pour l'aligner. On laisse donc son titre vide, et on pose le nôtre
 * comme premier élément de gauche, sans le fond en verre qu'iOS 26 donne aux
 * boutons de la barre (`hidesSharedBackground`). La barre reste native : c'est
 * elle qui porte le verre et qui décale le contenu sous elle.
 *
 * Utilisation :
 * - dans app/_layout.tsx, `sheetScreenOptions('Mes lectures')` pour chaque route
 *   `formSheet` ;
 * - un écran qui ajoute un bouton À GAUCHE redonne le titre en tête de liste :
 *   `unstable_headerLeftItems: () => [fermer, sheetTitleItem('Ma note')]`.
 * - à droite, `sheetIconItem(...)` : un `GlassButton`, le rond en verre de l'app.
 */

import type {
  NativeStackHeaderItemCustom,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import type { LucideIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { colors, creamAlpha, fonts, spacing } from '../../utils/constants';
import GlassButton from './GlassButton';

// ─── Titre ─────────────────────────────────────────────────────────

function SheetTitle({ title }: { title: string }) {
  return (
    <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
      {title}
    </Text>
  );
}

/** Le titre du sheet, en élément de gauche de la barre, sans verre */
export function sheetTitleItem(title: string): NativeStackHeaderItemCustom {
  return {
    type: 'custom',
    element: <SheetTitle title={title} />,
    hidesSharedBackground: true,
  };
}

// ─── Bouton-icône ──────────────────────────────────────────────────

interface SheetIconItemProps {
  icon: LucideIcon;
  onPress: () => void;
  /** Nom lu par VoiceOver : une icône seule n'a pas de nom sinon */
  accessibilityLabel: string;
}

/**
 * Bouton rond de la barre : notre `GlassButton`, avec son liseré. Le fond gris
 * qu'iOS 26 met d'office derrière les boutons de barre est retiré
 * (`hidesSharedBackground`) : il était plat et sans relief.
 */
export function sheetIconItem({
  icon,
  onPress,
  accessibilityLabel,
}: SheetIconItemProps): NativeStackHeaderItemCustom {
  return {
    type: 'custom',
    element: <GlassButton icon={icon} onPress={onPress} accessibilityLabel={accessibilityLabel} />,
    hidesSharedBackground: true,
  };
}

// ─── Options d'écran ───────────────────────────────────────────────

/**
 * Options d'une route présentée en sheet natif, titre ferré à gauche compris.
 * `detents` : les hauteurs d'arrêt, en fraction de l'écran, ou `'fitToContents'`
 * pour un sheet exactement à la hauteur de son contenu. C'est la règle des
 * sheets à contenu (livre, classement, journal, bibliothèque) : la liste fixe sa
 * propre hauteur avec `useFitSheet`, plafonnée sous l'en-tête de l'accueil.
 */
export function sheetScreenOptions(
  title: string | null,
  detents: number[] | 'fitToContents' = [0.65, 0.95],
): NativeStackNavigationOptions {
  const base: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    sheetAllowedDetents: detents,
    sheetGrabberVisible: true,
    sheetExpandsWhenScrolledToEdge: true,
    // Rayon des coins volontairement non spécifié : iOS 26 applique le sien,
    // concentrique avec la courbure de l'écran.
  };
  // Pas de titre quand le contenu dit déjà ce que c'est (« Le livre » au-dessus
  // de la couverture et du titre du livre…) : pas de barre du tout, le contenu
  // commence sous la poignée (SHEET_TOP_INSET).
  if (title === null) return { ...base, headerShown: false };
  return {
    ...base,
    headerShown: true,
    headerTitle: '',
    headerLargeTitle: false,
    unstable_headerLeftItems: () => [sheetTitleItem(title)],
  };
}

/** Sheet sans barre : marge du haut du contenu, pour passer sous la poignée */
export const SHEET_TOP_INSET = 28;

// ─── En-tête collant d'un sheet sans barre ─────────────────────────

/**
 * L'en-tête d'un sheet dont le titre vit dans le contenu (fiche du livre,
 * journal) : il reste collé en haut quand on fait défiler, sur le fond du
 * sheet, avec un fondu dessous pour que le contenu qui passe derrière ne se
 * lise pas à travers.
 *
 * À poser en PREMIER enfant de la ScrollView, avec `stickyHeaderIndices={[0]}`
 * (la ScrollView reste l'enfant direct de l'écran, condition des formSheet).
 * Il déborde de la marge latérale du contenu (`gutter`) pour couvrir toute la
 * largeur, et porte lui-même la marge du haut sous la poignée.
 */
export function SheetStickyHeader({
  children,
  gutter = spacing.lg,
  scrolled,
}: {
  children: React.ReactNode;
  /** La marge latérale de la ScrollView, que l'en-tête recouvre */
  gutter?: number;
  /**
   * Le contenu a défilé (`useSheetScrolled`) : le fondu n'apparaît qu'alors.
   * Au repos, il pâlirait le haut du contenu juste sous l'en-tête.
   */
  scrolled: boolean;
}) {
  return (
    <View style={[styles.sticky, { marginHorizontal: -gutter, paddingHorizontal: gutter }]}>
      {children}
      {scrolled && (
        <LinearGradient
          colors={[colors.white, creamAlpha(0)]}
          style={styles.stickyFade}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

/** Le contenu du sheet a-t-il défilé ? Pour `SheetStickyHeader` */
export function useSheetScrolled() {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y > 1;
    setScrolled((prev) => (prev === next ? prev : next));
  }, []);
  return { scrolled, onScroll, scrollEventThrottle: 16 };
}

const styles = StyleSheet.create({
  sticky: {
    paddingTop: SHEET_TOP_INSET,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  /** Le fondu sous l'en-tête : le contenu s'y efface en passant dessous */
  stickyFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -spacing.xl,
    height: spacing.xl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
});
