/**
 * BonusPill — mes marque-pages sur ce livre (3 par livre), la même gélule
 * que la série de l'accueil, en version marque-page : le marque-page beurre
 * de la charte, le nombre qu'il en reste.
 *
 * Le beurre seul ne se lit pas sur le verre clair (1,2:1) : il colore le
 * marque-page, liseré beurre foncé, et le nombre reste en chocolat.
 */

import { BookmarkIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fonts, lowki } from '../../utils/constants';
import { STREAK_BONUS_PER_BOOK } from '../../utils/streak';
import GlassPill from './GlassPill';

/** Le marque-page de la série : à reprendre tel quel (semaine, sheet) */
export function BonusBookmark({ size = 20 }: { size?: number }) {
  return <BookmarkIcon size={size} strokeWidth={2.25} color={lowki.butter.dark} fill={lowki.butter.light} />;
}

export default function BonusPill({ left }: { left: number }) {
  return (
    <GlassPill accessibilityLabel={`${left} marque-page${left > 1 ? 's' : ''} sur ${STREAK_BONUS_PER_BOOK} pour ce livre`}>
      <BonusBookmark />
      <Text style={styles.count} maxFontSizeMultiplier={1.3}>
        {left}
      </Text>
    </GlassPill>
  );
}

const styles = StyleSheet.create({
  count: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: lowki.chocolate.light,
    fontVariant: ['tabular-nums'],
  },
});
