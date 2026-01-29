/**
 * Composant Crown
 * 
 * Affiche une couronne dorée pour indiquer le leader d'un projet.
 * Utilisé à côté du nom du participant qui est en tête.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/constants';

interface CrownProps {
  /** Taille de la couronne */
  size?: 'small' | 'medium' | 'large';
}

export function Crown({ size = 'medium' }: CrownProps) {
  // Tailles en pixels pour chaque variante
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 28,
  };
  
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: sizeMap[size] }}>👑</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Le container permet d'ajouter des effets si besoin
  },
});

