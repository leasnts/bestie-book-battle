/**
 * Composant GlassButton
 *
 * LE bouton rond en verre d'iOS 26 de l'app : une icône Lucide sur du verre,
 * avec son liseré et une ombre douce. Un seul composant pour tous les usages :
 * le « + » de la barre d'onglets, la bibliothèque de l'accueil, le retour et
 * les actions des en-têtes… et, étiré en gélule (`stretch`), les façons
 * d'annoter de « Ma page ».
 *
 * Une seule taille, `ROUND_BUTTON_SIZE`, la même que `RoundButton` : un bouton
 * rond à icône fait la même taille partout dans l'app (règle de Lea).
 *
 * Tout nouveau bouton rond en verre passe par ici : ne pas redessiner le verre,
 * le liseré ou l'ombre ailleurs.
 *
 * Le matériau vient de `GlassMaterial` (vrai UIGlassEffect sur iOS 26, flou
 * avant), posé en fond ; l'icône est PAR-DESSUS, jamais dans le verre.
 */

import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, glassControlVeil, ROUND_BUTTON_ICON, ROUND_BUTTON_SIZE } from '../../utils/constants';
import GlassMaterial from './GlassMaterial';
import PressableScale from './PressableScale';

interface GlassButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  /** Nom lu par VoiceOver : une icône seule n'a pas de nom sinon */
  accessibilityLabel: string;
  /** Prend toute la largeur libre : une gélule, à parts égales avec ses voisins */
  stretch?: boolean;
  /** Un point rouge dans le coin : quelque chose attend (un brouillon) */
  badge?: boolean;
  /** Marges et placement dans le parent */
  style?: StyleProp<ViewStyle>;
}

export default function GlassButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  stretch = false,
  badge = false,
  style,
}: GlassButtonProps) {
  const size = ROUND_BUTTON_SIZE;
  const iconSize = ROUND_BUTTON_ICON;
  return (
    <PressableScale
      style={[styles.button, { width: stretch ? undefined : size, height: size, borderRadius: size / 2 }, stretch && styles.stretch, style]}
      pressedScale={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <GlassMaterial radius={size / 2} veil={glassControlVeil} rim />
      <Icon size={iconSize} color={colors.dark900} strokeWidth={2.25} />
      {/* Le point se pose sur le coin haut droit de l'icône, rond ou gélule */}
      {badge && <View style={[styles.badge, { top: (size - iconSize) / 2 - 3, marginLeft: iconSize / 2 - 2 }]} />}
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
  stretch: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
