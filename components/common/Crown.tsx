/**
 * Composant Crown
 * 
 * Affiche une couronne dorée pour indiquer le leader d'un projet.
 * Utilisé à côté du nom du participant qui est en tête.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const CROWN_IMAGE = require('../../assets/images/crown.png');

interface CrownProps {
  /** Taille de la couronne */
  size?: 'small' | 'medium' | 'large';
}

export function Crown({ size = 'medium' }: CrownProps) {
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 28,
  };

  const px = sizeMap[size];

  return (
    <View style={styles.container}>
      <Image source={CROWN_IMAGE} style={{ width: px, height: px }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});

