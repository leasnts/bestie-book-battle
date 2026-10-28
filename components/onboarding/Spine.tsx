/**
 * Spine — un livre couché vu par la tranche : un dégradé d'une paire Lowki et
 * une bande plus claire où serait le titre. Les piles de l'ouverture (ton sur
 * ton, en fantôme) et de la préparation (les trois tons).
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { creamAlpha } from '../../utils/constants';

export const SPINE_H = 26;

export default function Spine({
  width,
  colors,
  style,
}: {
  width: number;
  colors: readonly [string, string];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.spine, { width }, style]}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
      <View style={styles.band} />
    </View>
  );
}

const styles = StyleSheet.create({
  spine: {
    height: SPINE_H,
    borderRadius: 3,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: '18%',
    width: '22%',
    borderRadius: 2,
    backgroundColor: creamAlpha(0.1),
  },
});
