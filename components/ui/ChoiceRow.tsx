/**
 * ChoiceRow — une ligne qu'on coche, dans un sheet de choix (trier, filtrer).
 *
 *    (photo)  Emma                     (✓)
 *
 * À gauche, ce qui la fait reconnaître (une photo, la couleur d'un thème, une
 * icône) ; à droite, la coche : un rond rouge en dégradé quand elle est
 * choisie, un simple cercle sinon. Toute la ligne se touche.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { CheckIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { accentGradient, colors, fonts, inkAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

interface ChoiceRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
  /** Un seul choix possible (le tri) : VoiceOver l'annonce comme un bouton radio */
  single?: boolean;
}

const CHECK = 24;

export default function ChoiceRow({ label, selected, onPress, leading, single = false }: ChoiceRowProps) {
  return (
    <PressableScale
      style={styles.row}
      pressedScale={0.98}
      onPress={onPress}
      accessibilityRole={single ? 'radio' : 'checkbox'}
      accessibilityState={single ? { selected } : { checked: selected }}
      accessibilityLabel={label}
    >
      {leading && <View style={styles.leading}>{leading}</View>}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.check, !selected && styles.checkOff]}>
        {selected && (
          <>
            <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
            <CheckIcon size={14} color={colors.white} strokeWidth={3} />
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: inkAlpha(0.1),
  },
  leading: {
    width: 28,
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  check: {
    width: CHECK,
    height: CHECK,
    borderRadius: CHECK / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: {
    borderWidth: 1.5,
    borderColor: inkAlpha(0.22),
  },
});
