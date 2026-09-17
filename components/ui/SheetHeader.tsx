/**
 * Norme des bottom sheets natifs : l'en-tête
 *
 *    ┌────────────────────────────────┐
 *    │ Mes lectures               (+) │  ← titre ferré à gauche, actions à droite
 *    │                                │
 *
 * Règle non négociable : **le titre d'un sheet n'est jamais centré.** Il est
 * ferré à gauche, en Fraunces 22, comme les sheets dessinés à la main
 * (DeadlineEditSheet, GoalFormSheet).
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
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../utils/constants';
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

interface SheetOptions {
  /**
   * Hauteurs d'arrêt, en fraction de l'écran, ou `'fitToContents'` pour un sheet
   * exactement à la hauteur de son contenu (le contenu fixe alors sa propre
   * hauteur, cf. BookLibrary).
   */
  detents?: number[] | 'fitToContents';
  /**
   * Fond en verre flouté d'iOS 26 au lieu du blanc : on laisse le fond de l'écran
   * transparent et c'est le sheet natif qui floute ce qui passe derrière. Le
   * contenu ne doit alors poser AUCUN fond plein.
   */
  glass?: boolean;
}

/** Options d'une route présentée en sheet natif, titre ferré à gauche compris */
export function sheetScreenOptions(
  title: string,
  { detents = [0.65, 0.95], glass = false }: SheetOptions = {},
): NativeStackNavigationOptions {
  return {
    presentation: 'formSheet',
    sheetAllowedDetents: detents,
    ...(glass && { contentStyle: { backgroundColor: 'transparent' } }),
    sheetGrabberVisible: true,
    sheetExpandsWhenScrolledToEdge: true,
    // Rayon des coins volontairement non spécifié : iOS 26 applique le sien,
    // concentrique avec la courbure de l'écran.
    headerShown: true,
    headerTitle: '',
    headerLargeTitle: false,
    unstable_headerLeftItems: () => [sheetTitleItem(title)],
  };
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
});
