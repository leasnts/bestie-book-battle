/**
 * Composant FilterChips
 *
 * Une rangée de capsules de filtre, à choix unique, une toujours sélectionnée :
 *
 *    [█ Tout █]  [ En cours ]  [ Non lus ]  [ Lus ]
 *
 * Carrés arrondis, pas des pilules. Sélectionnée : rouge en dégradé, la
 * couleur d'accent (la même que les signets), texte crème. Sinon : contour encre
 * sur fond blanc, pour rester lisible par-dessus l'aquarelle du coin.
 *
 * `ToggleChips` : les mêmes capsules à choix multiple, aucune obligatoire
 * (les moments de lecture de l'onboarding). En `large`, une icône Lucide devant,
 * 44 pt de haut et la rangée passe à la ligne.
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, fonts, inkAlpha, spacing, accentGradient } from '../../utils/constants';
import { feel } from '../../utils/feel';
import PressableScale from './PressableScale';

interface ChipOption<K extends string> {
  key: K;
  label: string;
  icon?: LucideIcon;
}

interface FilterChipsProps<K extends string> {
  options: ChipOption<K>[];
  value: K;
  onChange: (key: K) => void;
  /** 44 pt, icônes, et passage à la ligne */
  large?: boolean;
}

interface ToggleChipsProps<K extends string> {
  options: ChipOption<K>[];
  values: K[];
  onChange: (keys: K[]) => void;
  large?: boolean;
}

/** Hauteur d'une capsule ; la zone tactile est agrandie à 44 pt par hitSlop */
export const FILTER_CHIPS_H = 34;
const LARGE_H = 44;

export default function FilterChips<K extends string>({ options, value, onChange, large }: FilterChipsProps<K>) {
  return (
    <View style={[styles.row, large && styles.rowLarge]}>
      {options.map((option) => (
        <Chip
          key={option.key}
          option={option}
          selected={option.key === value}
          large={large}
          onPress={() => onChange(option.key)}
        />
      ))}
    </View>
  );
}

export function ToggleChips<K extends string>({ options, values, onChange, large }: ToggleChipsProps<K>) {
  return (
    <View style={[styles.row, large && styles.rowLarge]}>
      {options.map((option) => {
        const selected = values.includes(option.key);
        return (
          <Chip
            key={option.key}
            option={option}
            selected={selected}
            large={large}
            onPress={() => onChange(selected ? values.filter((k) => k !== option.key) : [...values, option.key])}
          />
        );
      })}
    </View>
  );
}

function Chip<K extends string>({
  option,
  selected,
  large,
  onPress,
}: {
  option: ChipOption<K>;
  selected: boolean;
  large?: boolean;
  onPress: () => void;
}) {
  const height = large ? LARGE_H : FILTER_CHIPS_H;
  const Icon = large ? option.icon : undefined;
  return (
    <PressableScale
      style={[styles.chip, { height }, large && styles.chipLarge, !selected && styles.chipIdle]}
      pressedScale={0.94}
      onPress={() => {
        if (large) feel('tic');
        onPress();
      }}
      hitSlop={{ top: (44 - height) / 2, bottom: (44 - height) / 2 }}
      accessibilityRole="button"
      accessibilityLabel={option.label}
      accessibilityState={{ selected }}
    >
      {selected && <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />}
      {Icon && <Icon size={18} color={selected ? colors.white : colors.textSecondary} strokeWidth={2} />}
      <Text style={[styles.label, large && styles.labelLarge, selected && styles.labelSelected]}>{option.label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowLarge: {
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLarge: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.md + 2,
    borderRadius: borderRadius.md,
  },
  chipIdle: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.14),
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  labelLarge: {
    fontSize: 15,
  },
  labelSelected: {
    color: colors.white,
  },
});
