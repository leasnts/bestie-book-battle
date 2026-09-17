/**
 * Norme des bottom sheets natifs : l'en-tête
 *
 *    ┌────────────────────────────────┐
 *    │ Mes livres                 (+) │  ← titre ferré à gauche, actions à droite
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
 * - dans app/_layout.tsx, `sheetScreenOptions('Mes livres')` pour chaque route
 *   `formSheet` ;
 * - un écran qui ajoute un bouton À GAUCHE redonne le titre en tête de liste :
 *   `unstable_headerLeftItems: () => [fermer, sheetTitleItem('Ma note')]`.
 * - à droite, `sheetIconItem(...)` : un rond en verre iOS 26 avec une icône Lucide.
 */

import type {
  NativeStackHeaderItemCustom,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../utils/constants';
import PressableScale from './PressableScale';

/** Taille d'un bouton de la barre : le rond en verre d'iOS 26 fait 44 pt */
const ICON_BUTTON_SIZE = 44;

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
 * Bouton rond de la barre. Le verre vient d'iOS 26 (fond partagé des boutons de
 * barre), pas de notre code : on ne dessine que l'icône.
 */
export function sheetIconItem({
  icon: Icon,
  onPress,
  accessibilityLabel,
}: SheetIconItemProps): NativeStackHeaderItemCustom {
  return {
    type: 'custom',
    element: (
      <PressableScale
        style={styles.iconButton}
        pressedScale={0.88}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Icon size={22} color={colors.dark900} strokeWidth={2.2} />
      </PressableScale>
    ),
  };
}

// ─── Options d'écran ───────────────────────────────────────────────

/**
 * Options d'une route présentée en sheet natif, titre ferré à gauche compris.
 * `detents` : les hauteurs d'arrêt, en fraction de l'écran.
 */
export function sheetScreenOptions(
  title: string,
  detents: number[] = [0.65, 0.95],
): NativeStackNavigationOptions {
  return {
    presentation: 'formSheet',
    sheetAllowedDetents: detents,
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
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
