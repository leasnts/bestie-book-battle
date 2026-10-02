/**
 * Sheets natifs : les options de route, et l'en-tête collant.
 *
 * Tous les sheets de l'app sont des routes `formSheet` sans barre native :
 * leur en-tête (retour, titre ferré à gauche, actions) vit dans leur contenu,
 * via `SheetPage` / `SheetPageHeader` (components/ui/SheetPage.tsx). Un seul
 * type de sheet dans l'app, règle dans DESIGN.md.
 *
 * Règle non négociable : **le titre d'un sheet n'est jamais centré.**
 */

import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { colors, creamAlpha, spacing } from '../../utils/constants';

// ─── Options d'écran ───────────────────────────────────────────────

/**
 * Options d'une route présentée en sheet natif.
 * `detents` : les hauteurs d'arrêt, en fraction de l'écran, ou `'fitToContents'`
 * pour un sheet exactement à la hauteur de son contenu. C'est la règle des
 * sheets à contenu (livre, formulaires, classement, journal, bibliothèque) :
 * `SheetPage` fixe sa propre hauteur avec `useFitSheet`, plafonnée sous
 * l'en-tête de l'accueil.
 */
export function sheetScreenOptions(
  detents: number[] | 'fitToContents' = 'fitToContents',
): NativeStackNavigationOptions {
  return {
    presentation: 'formSheet',
    sheetAllowedDetents: detents,
    sheetGrabberVisible: true,
    sheetExpandsWhenScrolledToEdge: true,
    // Pas de barre native : l'en-tête vit dans le contenu (SheetPage), qui
    // commence sous la poignée (SHEET_TOP_INSET).
    headerShown: false,
    // Rayon des coins volontairement non spécifié : iOS 26 applique le sien,
    // concentrique avec la courbure de l'écran.
  };
}

/** Sheet sans barre : marge du haut du contenu, pour passer sous la poignée */
export const SHEET_TOP_INSET = 28;

/** Le flou des bords collants : assez pour ne plus rien lire, et un voile blanc */
const BLUR = 40;
const VEIL = 0.6;
/** Ce que le flou déborde côté contenu, le temps de s'effacer */
const BLUR_FADE = 28;

// ─── En-tête collant d'un sheet sans barre ─────────────────────────

/**
 * L'en-tête d'un sheet dont le titre vit dans le contenu (fiche du livre,
 * journal) : il reste collé en haut quand on fait défiler. Le contenu qui passe
 * derrière est flouté (un flou dépoli voilé de blanc, Lea, 2026-10-02), comme
 * sous une barre d'iOS : on devine qu'il y a de la suite sans pouvoir le lire.
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
      {/* Au repos, le fond blanc du sheet ; dès que ça défile, le flou */}
      {scrolled && <SheetBlur />}
      {children}
    </View>
  );
}

/**
 * Le flou des bords collants d'un sheet (en-tête, pied) : un flou PROGRESSIF
 * (Lea, 2026-10-02), plein contre le bord et qui s'efface vers le contenu,
 * voilé de blanc de la même façon pour que le texte posé dessus reste lisible.
 * Il déborde de son parent de `BLUR_FADE` côté contenu : le contenu ne passe
 * pas sous une ligne nette, il se brouille peu à peu.
 *
 * `edge` : le bord du sheet contre lequel il est posé (en haut pour l'en-tête,
 * en bas pour le pied).
 */
export function SheetBlur({ edge = 'top' }: { edge?: 'top' | 'bottom' }) {
  const top = edge === 'top';
  // Plein sur les deux tiers côté bord, puis il s'efface
  const ramp = { start: { x: 0, y: top ? 0 : 1 }, end: { x: 0, y: top ? 1 : 0 }, locations: [0, 0.55, 1] as const };
  return (
    <View
      pointerEvents="none"
      style={[styles.blur, top ? { top: 0, bottom: -BLUR_FADE } : { bottom: 0, top: -BLUR_FADE }]}
    >
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient colors={['black', 'black', 'transparent']} {...ramp} style={StyleSheet.absoluteFill} />
        }
      >
        <BlurView intensity={BLUR} tint="light" style={StyleSheet.absoluteFill} />
      </MaskedView>
      <LinearGradient
        colors={[creamAlpha(VEIL), creamAlpha(VEIL), creamAlpha(0)]}
        {...ramp}
        style={StyleSheet.absoluteFill}
      />
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
  },
  blur: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
