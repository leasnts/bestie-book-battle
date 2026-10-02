/**
 * RoundButton — LE bouton rond plein de l'app, pour les actions dans le contenu
 * (à distinguer de `GlassButton`, le rond en verre des en-têtes et de la barre).
 *
 * - `dark` : l'action principale, encre chocolat en dégradé (✓ enregistrer,
 *   ✓ ajouter la note, 🎙 enregistrer, ✎ ☺ de « Ma page ») ;
 * - `ghost` : les autres, `inkAlpha(0.07)` (↺ annuler, ↺ refaire, 🗑) ;
 * - `light` : sur une surface foncée (■ arrêter, sur la gélule lie de vin).
 *
 * Même taille partout (`ROUND_BUTTON_SIZE`, aussi celle de `GlassButton`), même
 * place : seule l'icône change (DESIGN.md › Boutons-icônes).
 * Désactivé, il se grise (`PressableScale`).
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  colors,
  creamAlpha,
  inkAlpha,
  inkGradient,
  ROUND_BUTTON_ICON,
  ROUND_BUTTON_ICON_FILLED,
  ROUND_BUTTON_SIZE,
  shadowAlpha,
} from '../../utils/constants';
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
  /** Un point lie de vin dans le coin : quelque chose attend (un brouillon) */
  badge?: boolean;
}

export { ROUND_BUTTON_SIZE };

export default function RoundButton({
  icon: Icon,
  variant,
  label,
  hint,
  onPress,
  disabled,
  filled = false,
  badge = false,
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
      {/* Jamais d'aplat : l'encre chocolat, plus claire en haut */}
      {variant === 'dark' && (
        <LinearGradient colors={inkGradient} style={[StyleSheet.absoluteFill, styles.round]} />
      )}
      <Icon size={filled ? ROUND_BUTTON_ICON_FILLED : ROUND_BUTTON_ICON} color={color} fill={filled ? color : 'none'} strokeWidth={2.2} />
      {badge && <View style={styles.badge} />}
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
  round: {
    borderRadius: ROUND_BUTTON_SIZE / 2,
  },
  dark: {
    backgroundColor: colors.dark900,
    shadowColor: shadowAlpha(0.25),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  // Cerclé de crème : il se détache sur l'encre comme sur le verre
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.white,
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: inkAlpha(0.07),
  },
  light: {
    backgroundColor: creamAlpha(0.95),
  },
});
