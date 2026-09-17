/**
 * Composant GlassButton
 *
 * LE bouton rond en verre d'iOS 26 de l'app : une icône Lucide sur du verre,
 * avec son liseré et une ombre douce. Un seul composant pour tous les usages :
 * - le « + » à droite de la barre d'onglets (58 pt) ;
 * - les actions à droite du titre d'un sheet (44 pt, via `sheetIconItem`).
 *
 * Tout nouveau bouton rond en verre passe par ici : ne pas redessiner le verre,
 * le liseré ou l'ombre ailleurs.
 *
 * Le matériau vient de `GlassMaterial` (vrai UIGlassEffect sur iOS 26, flou
 * avant), posé en fond ; l'icône est PAR-DESSUS, jamais dans le verre.
 */

import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, glassControlVeil } from '../../utils/constants';
import GlassMaterial from './GlassMaterial';
import PressableScale from './PressableScale';

interface GlassButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  /** Nom lu par VoiceOver : une icône seule n'a pas de nom sinon */
  accessibilityLabel: string;
  /** Diamètre en pt (44 minimum, la taille tactile de la HIG) */
  size?: number;
  /** Marges et placement dans le parent */
  style?: StyleProp<ViewStyle>;
}

export default function GlassButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  size = 44,
  style,
}: GlassButtonProps) {
  return (
    <PressableScale
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }, style]}
      pressedScale={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <GlassMaterial radius={size / 2} veil={glassControlVeil} rim />
      <Icon size={Math.round(size * 0.42)} color={colors.dark900} strokeWidth={2.25} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  // L'ombre vit sur le bouton, sans overflow : sur la vue qui arrondit le verre,
  // `overflow: hidden` la couperait.
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
});
