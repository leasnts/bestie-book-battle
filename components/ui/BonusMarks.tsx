/**
 * BonusMarks — mes marque-pages sur ce livre (3 par livre) : pleins s'il en
 * reste, en creux une fois posés sur un jour manqué. Une ligne sous un filet,
 * libellé à gauche, marque-pages à droite.
 */

import { BookmarkIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, lowki, spacing } from '../../utils/constants';
import { STREAK_BONUS_PER_BOOK } from '../../utils/streak';

export default function BonusMarks({ left }: { left: number }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${left} marque-page${left > 1 ? 's' : ''} sur ${STREAK_BONUS_PER_BOOK} pour ce livre`}
    >
      <Text style={styles.label}>Marque-pages</Text>
      <View style={styles.marks}>
        {Array.from({ length: STREAK_BONUS_PER_BOOK }, (_, i) => {
          const available = i < left;
          return (
            <BookmarkIcon
              key={i}
              size={20}
              strokeWidth={2.25}
              color={available ? lowki.red.light : lowki.beige.light}
              fill={available ? lowki.red.light : 'transparent'}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing['2xl'],
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  marks: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
