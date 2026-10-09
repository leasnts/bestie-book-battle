/**
 * BonusPill — mes marque-pages sur ce livre (3 par livre), la même gélule
 * que la série de l'accueil, en version marque-page : le marque-page beurre
 * aquarelle, le nombre qu'il en reste.
 *
 * Le beurre ne se lit pas en texte sur le verre clair (1,2:1) : il colore le
 * marque-page, et le nombre reste en chocolat.
 */

import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { fonts, lowki } from '../../utils/constants';
import { STREAK_BONUS_PER_BOOK } from '../../utils/streak';
import GlassPill from './GlassPill';

const BOOKMARKS = {
  1: require('../../assets/images/bookmark/bookmark-1.png'),
  2: require('../../assets/images/bookmark/bookmark-2.png'),
} as const;
const BOOKMARK = BOOKMARKS[2];

/** Le marque-page aquarelle de la série : à reprendre tel quel (semaine, sheet) */
export function BonusBookmark({ size = 22 }: { size?: number }) {
  return <Image source={BOOKMARK} style={{ width: size, height: size }} />;
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
