/**
 * StreakHero — le grand chiffre de ma série en tête des sheets /streak et
 * /streak-save : la flamme Lowki, le nombre en rouge de la charte, « jours ».
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, lowki, spacing } from '../../utils/constants';
import { STREAK_FLAME } from './StreakPill';

interface StreakHeroProps {
  days: number;
  /** `dim` : hier manqué, la flamme pâlit ; `off` : pas de série, flamme sable */
  flame?: 'lit' | 'dim' | 'off';
}

export default function StreakHero({ days, flame = 'lit' }: StreakHeroProps) {
  return (
    <View
      style={styles.hero}
      accessible
      accessibilityLabel={days > 0 ? `${days} jour${days > 1 ? 's' : ''} d'affilée` : 'Pas de série'}
    >
      <Image source={STREAK_FLAME} style={[styles.flame, flame === 'dim' && styles.dim, flame === 'off' && styles.off]} />
      <Text style={styles.days}>{days}</Text>
      <Text style={styles.unit}>{days > 1 ? 'jours' : 'jour'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  flame: {
    width: 40,
    height: 40,
  },
  dim: {
    opacity: 0.5,
  },
  off: {
    tintColor: lowki.beige.light,
  },
  days: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: lowki.red.light,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textTertiary,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
});
