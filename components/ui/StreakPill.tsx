/**
 * StreakPill — ma série, en haut à droite de l'accueil.
 *
 * Elle a quitté le cadre du livre (Lea, 2026-10-09) pour une gélule en verre,
 * en miroir du rond de la bibliothèque : même verre, même hauteur
 * (`ROUND_BUTTON_SIZE`), même ombre. La flamme Lowki à l'aquarelle, le nombre
 * de jours en rouge de la charte, sans « j ».
 *
 * Trois visages (voir `getStreakState`), sans animation :
 * - en cours (lu aujourd'hui) : la flamme et le nombre en rouge plein ;
 * - qui va mourir (pas encore lu aujourd'hui, ou hier manqué) : flamme et
 *   nombre en rouge atténué ;
 * - éteinte (pas de série) : flamme et 0 grisés.
 *
 * Un toucher ouvre la semaine de ma série (/streak).
 */

import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts, lowki } from '../../utils/constants';
import type { StreakState } from '../../utils/streak';
import GlassPill from './GlassPill';

/** La flamme Lowki, à reprendre partout où l'on parle de la série */
export const STREAK_FLAME = require('../../assets/images/streak/streak-2.png');

interface StreakPillProps {
  /** Jours consécutifs de lecture */
  days: number;
  state: StreakState;
  onPress: () => void;
}

const LABELS: Record<StreakState, (days: number) => string> = {
  active: (d) => `Série de ${d} jour${d > 1 ? 's' : ''}`,
  atRisk: (d) => `Série de ${d} jour${d > 1 ? 's' : ''}, à garder aujourd'hui`,
  missed: (d) => `Série de ${d} jour${d > 1 ? 's' : ''}, hier manqué`,
  inactive: () => 'Pas de série',
};

export default function StreakPill({ days, state, onPress }: StreakPillProps) {
  const dying = state === 'atRisk' || state === 'missed';
  const off = state === 'inactive';

  return (
    <GlassPill
      onPress={onPress}
      accessibilityLabel={LABELS[state](days)}
      accessibilityHint="Ouvre ma série de la semaine"
    >
      <Image
        source={STREAK_FLAME}
        style={[styles.flame, dying && styles.dim, off && styles.off]}
        tintColor={off ? colors.textTertiary : undefined}
      />
      <Text style={[styles.days, dying && styles.dim, off && styles.daysOff, off && styles.off]} maxFontSizeMultiplier={1.3}>
        {days}
      </Text>
    </GlassPill>
  );
}

const styles = StyleSheet.create({
  // Éteinte : la silhouette de la flamme, grisée (tintColor d'expo-image ;
  // celui du style de l'Image de React Native ne s'applique pas)
  flame: {
    width: 20,
    height: 20,
  },
  days: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: lowki.red.light,
    fontVariant: ['tabular-nums'],
  },
  // Va mourir : flamme et nombre atténués ensemble
  dim: {
    opacity: 0.45,
  },
  // Éteinte : grisée, comme un bouton désactivé
  daysOff: {
    color: colors.textTertiary,
  },
  off: {
    opacity: 0.4,
  },
});
