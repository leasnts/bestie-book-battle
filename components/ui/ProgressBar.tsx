/**
 * Composant ProgressBar
 * 
 * Une barre de progression animée qui montre le pourcentage d'avancement.
 * Utilisée pour afficher la progression de lecture de chaque participant.
 * 
 * La barre se remplit de gauche à droite avec une animation fluide.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { colors, borderRadius, animationDuration } from '../../utils/constants';

interface ProgressBarProps {
  /** Pourcentage de progression (0-100) */
  percentage: number;
  /** Hauteur de la barre en pixels */
  height?: number;
  /** Couleur de remplissage (optionnel, utilise primary par défaut) */
  color?: string;
  /** Couleur de fond (optionnel) */
  backgroundColor?: string;
  /** Affiche le pourcentage à droite */
  showPercentage?: boolean;
  /** Animation au montage */
  animated?: boolean;
}

export function ProgressBar({
  percentage,
  height = 8,
  color = colors.primary,
  backgroundColor = colors.primaryLight + '40', // 40 = 25% opacité
  showPercentage = false,
  animated = true,
}: ProgressBarProps) {
  // Animated.Value pour l'animation de la largeur
  // useRef permet de garder la même référence entre les rendus
  const widthAnim = useRef(new Animated.Value(0)).current;
  
  // Clamp le pourcentage entre 0 et 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  // Animation quand le pourcentage change
  useEffect(() => {
    if (animated) {
      // spring crée une animation avec un effet de rebond naturel
      Animated.spring(widthAnim, {
        toValue: clampedPercentage,
        friction: 8,           // Résistance (plus haut = moins de rebond)
        tension: 40,           // Force du ressort
        useNativeDriver: false, // false car on anime width (layout)
      }).start();
    } else {
      // Sans animation, on met la valeur directement
      widthAnim.setValue(clampedPercentage);
    }
  }, [clampedPercentage, animated, widthAnim]);
  
  return (
    <View style={styles.container}>
      {/* Barre de fond */}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor,
            borderRadius: height / 2,
          },
        ]}
      >
        {/* Barre de progression animée */}
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: color,
              borderRadius: height / 2,
              // interpolate transforme 0-100 en "0%" à "100%"
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      
      {/* Affichage du pourcentage */}
      {showPercentage && (
        <Text style={styles.percentageText}>{Math.round(clampedPercentage)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    overflow: 'hidden', // Cache le débordement de la barre de remplissage
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
});

