/**
 * Composant FilterChips
 *
 * Une rangée de capsules de filtre, à choix unique :
 *
 *    [ En cours ]  [ Non lus ]  [█ Lus █]
 *
 * Toucher une capsule la sélectionne ; toucher celle déjà sélectionnée la
 * désélectionne, et tout s'affiche à nouveau. Pas de capsule « Tous » : rien
 * de sélectionné, c'est tout.
 *
 * Carrés arrondis, pas des pilules. Sélectionnée : encre en dégradé (jamais
 * d'aplat), texte crème. Sinon : contour encre sur fond blanc, pour rester
 * lisible par-dessus l'aquarelle du coin.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, fonts, inkAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

interface FilterChipsProps<K extends string> {
  options: { key: K; label: string }[];
  /** Filtre actif, `null` = aucun (tout s'affiche) */
  value: K | null;
  onChange: (key: K | null) => void;
}

/** Hauteur d'une capsule ; la zone tactile est agrandie à 44 pt par hitSlop */
export const FILTER_CHIPS_H = 34;
/** Encre, du noyer vers le noyer profond */
const SELECTED_GRADIENT = [colors.textSecondary, colors.dark950] as const;

export default function FilterChips<K extends string>({ options, value, onChange }: FilterChipsProps<K>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <PressableScale
            key={option.key}
            style={[styles.chip, !selected && styles.chipIdle]}
            pressedScale={0.94}
            onPress={() => onChange(selected ? null : option.key)}
            hitSlop={{ top: (44 - FILTER_CHIPS_H) / 2, bottom: (44 - FILTER_CHIPS_H) / 2 }}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
          >
            {selected && (
              <LinearGradient colors={SELECTED_GRADIENT} style={StyleSheet.absoluteFill} />
            )}
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    height: FILTER_CHIPS_H,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
  labelSelected: {
    color: colors.white,
  },
});
