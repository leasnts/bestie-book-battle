/**
 * Les briques des réglages : un cadre papier sans titre (`SettingsCard`), une
 * ligne à interrupteur (`ToggleRow`) et une ligne qui ouvre un écran (`LinkRow`).
 * Chaque ligne se suffit (icône + mot) : pas de sous-titre de section. Quand un
 * réglage a besoin de contexte, il s'ouvre dans son propre sheet (Notifications).
 */

import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRightIcon, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { borderRadius, colors, dangerText, fonts, fontSize, paperFrameGradient, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

export function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={paperFrameGradient} style={[StyleSheet.absoluteFill, styles.cardPaper]} />
      {children}
    </View>
  );
}

export function ToggleRow({
  icon: Icon,
  label,
  accessory,
  on,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  /** Avant l'interrupteur : l'heure du rappel */
  accessory?: React.ReactNode;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Icon size={22} color={colors.textSecondary} />
      <Text style={styles.label}>{label}</Text>
      {accessory}
      <Switch
        value={on}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.white}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function LinkRow({
  icon: Icon,
  label,
  onPress,
  danger = false,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  /** Irréversible (« Supprimer mon compte ») : rouge d'erreur, pas de › (rien ne s'ouvre) */
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <PressableScale
      style={styles.row}
      pressedScale={0.98}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Icon size={22} color={danger ? dangerText : colors.textSecondary} />
      <Text style={[styles.label, danger && styles.danger]}>{label}</Text>
      {!danger && <ChevronRightIcon size={20} color={colors.textTertiary} />}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardPaper: {
    borderRadius: borderRadius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    // Une marge et pas une hauteur fixe : avec minHeight, iOS colle le Switch en haut de la ligne
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  danger: {
    color: dangerText,
  },
});
