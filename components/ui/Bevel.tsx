/**
 * Bevel — la matière des boutons en relief : cerne, liseré dégradé, fond dégradé
 * (`bevel` dans utils/constants.ts). Se pose en fond absolu d'un bouton qui porte
 * lui-même son rayon ; partagé par Button3D et RoundButton pour qu'ils restent
 * identiques.
 *
 * - `ink` : le chocolat (Button3D primaire, RoundButton `dark`) ;
 * - `paper` : le papier (Button3D secondaire).
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { bevel } from '../../utils/constants';

interface BevelProps {
  tone: 'ink' | 'paper';
  radius: number;
  /** Appuyé : le liseré s'inverse, la lumière passe en bas */
  pressed?: boolean;
}

const { ringWidth, strokeWidth } = bevel;

export default function Bevel({ tone, radius, pressed = false }: BevelProps) {
  const { fill, ring } = bevel[tone];
  const stroke = pressed ? [bevel[tone].stroke[1], bevel[tone].stroke[0]] as const : bevel[tone].stroke;
  const inner = { margin: ringWidth, borderRadius: radius - ringWidth };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: ring }]}>
      {/* Le fond sous le liseré : là où le liseré s'efface, c'est lui qu'on voit */}
      <LinearGradient colors={fill} style={[StyleSheet.absoluteFill, inner]} />
      <LinearGradient colors={stroke} style={[styles.inset, inner]}>
        <LinearGradient
          colors={fill}
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
