/**
 * GlassSection — un cadre en verre de l'accueil (Le livre, Ma page, Classement).
 *
 * Une question = un cadre. Le verre (`GlassMaterial`) est posé en fond absolu et
 * le contenu PAR-DESSUS, jamais dedans : iOS 26 reteinte le contenu d'un verre
 * avec plusieurs secondes de retard (même leçon que `GlassTabBar`).
 *
 * Lisibilité : un voile crème à 56 % recouvre le verre. Avec lui, `text-tertiary`
 * garde au moins 4,9:1 sur le fond ambré de la maquette. Le fond de l'accueil doit
 * donc rester une couverture diluée dans le papier : sur une couverture sombre
 * pleine, le contraste tombe à 2,5:1.
 *
 * Deux usages :
 * - sans `onPress` : simple cadre (Ma page, qui a ses propres zones tactiles) ;
 * - avec `onPress` : tout le cadre se touche et se rentre à 0,97 (Le livre,
 *   Classement). `PressableScale` coupe l'animation si « Réduire les animations »
 *   est activé ; le cadre n'en ajoute aucune autre.
 *
 * Pas de carte dans une carte : le contenu se structure avec des filets et des
 * espacements, pas avec un fond ou un cadre de plus.
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { borderRadius, creamAlpha, spacing } from '../../utils/constants';
import GlassMaterial from './GlassMaterial';
import PressableScale from './PressableScale';

const RADIUS = borderRadius.xl;
/** Voile crème sur le verre : la valeur de la maquette, calculée pour le contraste */
const VEIL = 0.56;
/** Bord clair qui détache le cadre du fond coloré */
const EDGE = creamAlpha(0.9);

interface GlassSectionProps {
  children: React.ReactNode;
  /** Rend tout le cadre touchable */
  onPress?: () => void;
  /** Cadre touchable : ce que VoiceOver annonce (ex. « Fiche du livre ») */
  accessibilityLabel?: string;
  /** Cadre touchable : ce qui se passe au toucher */
  accessibilityHint?: string;
  /** Mise en page du cadre dans l'écran (hauteur, flex, marges) */
  style?: StyleProp<ViewStyle>;
}

export default function GlassSection({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}: GlassSectionProps) {
  const layers = (
    <>
      <GlassMaterial radius={RADIUS} veil={VEIL} edgeColor={EDGE} />
      <View style={styles.content}>{children}</View>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.frame, style]}>{layers}</View>
    );
  }

  return (
    <PressableScale
      style={[styles.frame, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {layers}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: RADIUS,
  },
  // flexGrow et pas flex: 1 : sans hauteur imposée, le cadre prend celle de son contenu
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
});
