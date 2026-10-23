/**
 * InkBevel — la matière du bouton marron : cerne, liseré dégradé, fond dégradé
 * (`inkBevel` dans utils/constants.ts). Se pose en fond absolu d'un bouton qui
 * porte lui-même son rayon ; partagé par Button3D (primaire) et RoundButton
 * (`dark`) pour qu'ils restent identiques.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { inkBevel } from '../../utils/constants';

interface InkBevelProps {
  radius: number;
  /** Appuyé : le liseré s'inverse, la lumière passe en bas */
  pressed?: boolean;
}

const { ringWidth, strokeWidth } = inkBevel;

export default function InkBevel({ radius, pressed = false }: InkBevelProps) {
  const stroke = pressed ? [inkBevel.stroke[1], inkBevel.stroke[0]] as const : inkBevel.stroke;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: inkBevel.ring }]}>
      <LinearGradient
        colors={stroke}
        style={[styles.inset, { margin: ringWidth, borderRadius: radius - ringWidth }]}
      >
        <LinearGradient
          colors={inkBevel.fill}
          style={[styles.inset, { margin: strokeWidth, borderRadius: radius - ringWidth - strokeWidth }]}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  inset: {
    flex: 1,
  },
});
