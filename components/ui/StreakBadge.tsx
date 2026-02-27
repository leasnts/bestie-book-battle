/**
 * Composant StreakBadge
 * 
 * Badge qui affiche le nombre de jours consécutifs de lecture.
 * Une seule flamme (icône IconFlame) est toujours affichée,
 * accompagnée du nombre de jours.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../../utils/constants';
import IconFlame from '../icons/IconFlame';

interface StreakBadgeProps {
  /** Nombre de jours consécutifs */
  streak: number;
  /** Taille du badge : small, medium, large */
  size?: 'small' | 'medium' | 'large';
  /** Affiche uniquement la flamme (sans le nombre) */
  iconOnly?: boolean;
}

export function StreakBadge({
  streak,
  size = 'medium',
  iconOnly = false,
}: StreakBadgeProps) {
  if (streak === 0) {
    return null;
  }

  const sizeStyles = {
    small: {
      paddingHorizontal: 5,
      paddingVertical: 2,
      fontSize: 11,
      iconSize: 10,
    },
    medium: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      fontSize: 12,
      iconSize: 12,
    },
    large: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      fontSize: 14,
      iconSize: 14,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
      ]}
    >
      <IconFlame size={currentSize.iconSize} color={colors.textTertiary} />
      {!iconOnly && (
        <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>
          {streak}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    gap: 2,
  },
  text: {
    fontFamily: 'WorkSans_600SemiBold',
    color: colors.textTertiary,
    lineHeight: 16,
  },
});

