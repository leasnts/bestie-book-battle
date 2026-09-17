/**
 * Composant ReadingNumbers
 *
 * Trois chiffres en haut de la bibliothèque, posés sur une tache d'aquarelle
 * aux couleurs de mes lectures :
 *
 *     2          1           1 204
 *     terminées  en cours    pages lues
 *
 * Des chiffres, pas des statistiques : pas de graphique, pas de moyenne, pas de
 * comparaison. Juste ce que ma bibliothèque contient, en gros, en Fraunces.
 *
 * La tache déborde un peu du bloc (elle ne dessine pas un cadre) et prend les
 * couleurs des couvertures (`libraryPalette`).
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../../utils/constants';
import type { CoverPalette } from '../../utils/coverPalette';
import type { LibraryNumbers } from '../../utils/library';
import WatercolorStain from './WatercolorStain';

/**
 * De combien la tache déborde du bloc, à gauche / à droite et en haut / en bas.
 * Les chiffres restent alignés sur le titre ; c'est la tache qui dépasse dans la
 * marge, pour que le premier chiffre ne touche pas son bord.
 */
const BLEED_X = 48;
const BLEED_Y = 16;

/** « 1 204 », avec une espace insécable comme séparateur de milliers */
function formatNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

interface ReadingNumbersProps {
  numbers: LibraryNumbers;
  palette: CoverPalette;
}

export default function ReadingNumbers({ numbers, palette }: ReadingNumbersProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const items = [
    { value: numbers.done, label: numbers.done > 1 ? 'terminées' : 'terminée' },
    { value: numbers.reading, label: 'en cours' },
    { value: numbers.pages, label: numbers.pages > 1 ? 'pages lues' : 'page lue' },
  ];

  return (
    <View
      style={styles.block}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      accessible
      accessibilityLabel={items.map((item) => `${item.value} ${item.label}`).join(', ')}
    >
      {size && (
        <WatercolorStain
          palette={palette}
          width={size.width + BLEED_X * 2}
          height={size.height + BLEED_Y * 2}
          style={styles.stain}
        />
      )}
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <Text style={styles.value} maxFontSizeMultiplier={1.4}>
            {formatNumber(item.value)}
          </Text>
          <Text style={styles.label} maxFontSizeMultiplier={1.4}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Le bloc épouse ses chiffres : la tache reste derrière eux, pas sur toute la largeur
  block: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing['3xl'],
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
  },
  stain: {
    position: 'absolute',
    left: -BLEED_X,
    top: -BLEED_Y,
  },
  item: {
    gap: 2,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});
