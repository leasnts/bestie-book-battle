/**
 * CodeBoxes — un code à six chiffres, une case par chiffre : le code reçu par
 * email (auth/email) et le code d'une lecture (onboarding/code).
 *
 * Les cases ne font que montrer : la saisie passe par un seul champ invisible
 * posé dessus, qui garde le collage et l'autoremplissage d'iOS.
 */

import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { borderRadius, colors, fonts, shadows, spacing } from '../../utils/constants';

export const CODE_LENGTH = 6;

interface CodeBoxesProps {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  accessibilityLabel: string;
  /** Code reçu par message : iOS le propose au-dessus du clavier */
  oneTimeCode?: boolean;
}

export default function CodeBoxes({ value, onChange, editable, accessibilityLabel, oneTimeCode = false }: CodeBoxesProps) {
  const input = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(true);
  return (
    <Pressable onPress={() => input.current?.focus()} accessible={false}>
      <View style={styles.boxes}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const active = focused && editable && i === Math.min(value.length, CODE_LENGTH - 1);
          return (
            <View key={i} style={[styles.box, active && styles.boxActive]}>
              <Text style={styles.digit}>{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        style={styles.hiddenInput}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType={oneTimeCode ? 'oneTimeCode' : 'none'}
        autoComplete={oneTimeCode ? 'one-time-code' : 'off'}
        maxLength={CODE_LENGTH}
        editable={editable}
        caretHidden
        autoFocus
        accessibilityLabel={accessibilityLabel}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boxes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    ...shadows.xs,
  },
  boxActive: {
    borderColor: colors.textSecondary,
    borderWidth: 1.5,
  },
  digit: {
    fontFamily: fonts.body,
    fontSize: 26,
    color: colors.textPrimary,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    opacity: 0.02,
  },
});
