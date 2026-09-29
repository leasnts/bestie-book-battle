/**
 * RoundButton — LE bouton rond plein de l'app, pour les actions dans le contenu
 * (à distinguer de `GlassButton`, le rond en verre des en-têtes et de la barre).
 *
 * - `dark` : l'action principale, encre pleine (✓ enregistrer, ✓ ajouter la note,
 *   🎙 enregistrer) ;
 * - `ghost` : les autres, `inkAlpha(0.07)` (↺ annuler, ↺ refaire, 🗑) ;
 * - `light` : sur une surface foncée (■ arrêter, sur la gélule lie de vin).
 *
 * Même taille, même place : seule l'icône change (DESIGN.md › Boutons-icônes).
 * Désactivé, il se grise (`PressableScale`).
 */

import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { colors, creamAlpha, inkAlpha, shadowAlpha } from '../../utils/constants';
import PressableScale from './PressableScale';

interface RoundButtonProps {
  icon: LucideIcon;
  variant: 'dark' | 'ghost' | 'light';
  /** Ce que VoiceOver annonce */
  label: string;
  hint?: string;
  onPress: () => void;
  disabled?: boolean;
  /** Icône pleine (■ arrêter) */
  filled?: boolean;
}

export const ROUND_BUTTON_SIZE = 42;

export default function RoundButton({
  icon: Icon,
  variant,
  label,
  hint,
  onPress,
  disabled,
  filled = false,
}: RoundButtonProps) {
  const color = variant === 'dark' ? colors.white : variant === 'light' ? colors.accent : colors.dark900;
  return (
    <PressableScale
      style={[styles.button, styles[variant]]}
      pressedScale={0.9}
      hitSlop={6}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      <Icon size={filled ? 15 : 19} color={color} fill={filled ? color : 'none'} strokeWidth={2.2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: ROUND_BUTTON_SIZE,
    height: ROUND_BUTTON_SIZE,
    borderRadius: ROUND_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dark: {
    backgroundColor: colors.dark900,
    shadowColor: shadowAlpha(0.25),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  ghost: {
    backgroundColor: inkAlpha(0.07),
  },
  light: {
    backgroundColor: creamAlpha(0.95),
  },
});
