/**
 * Composant StreakBadge
 * 
 * Badge qui affiche le nombre de jours consécutifs de lecture.
 * Le nombre de flammes augmente avec la durée du streak :
 * - 1-6 jours : 🔥
 * - 7-29 jours : 🔥🔥
 * - 30+ jours : 🔥🔥🔥
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../../utils/constants';

interface StreakBadgeProps {
  /** Nombre de jours consécutifs */
  streak: number;
  /** Taille du badge : small, medium, large */
  size?: 'small' | 'medium' | 'large';
  /** Affiche uniquement les flammes (sans le nombre) */
  iconOnly?: boolean;
}

export function StreakBadge({
  streak,
  size = 'medium',
  iconOnly = false,
}: StreakBadgeProps) {
  // Si pas de streak, on n'affiche rien
  if (streak === 0) {
    return null;
  }
  
  // Détermine le nombre de flammes selon le streak
  const getFlames = (): string => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 7) return '🔥🔥';
    return '🔥';
  };
  
  // Styles selon la taille
  const sizeStyles = {
    small: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      fontSize: 12,
      emojiSize: 12,
    },
    medium: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      fontSize: 14,
      emojiSize: 14,
    },
    large: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      fontSize: 18,
      emojiSize: 18,
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
      <Text style={{ fontSize: currentSize.emojiSize }}>{getFlames()}</Text>
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
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  text: {
    fontWeight: '700',
    color: colors.streak,
  },
});

