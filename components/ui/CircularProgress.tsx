/**
 * Composant CircularProgress
 * 
 * Affiche un cercle de progression SVG avec le pourcentage au centre.
 * Utilisé dans la section livre de la home page pour montrer
 * la progression de lecture du challenge actif.
 * 
 * Comment ça marche :
 * - On dessine un cercle de fond (gris clair)
 * - Par-dessus, on dessine un arc coloré proportionnel au pourcentage
 * - L'arc est dessiné avec strokeDasharray/strokeDashoffset (technique SVG standard)
 * - Le texte du pourcentage est affiché au centre
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../../utils/constants';

interface CircularProgressProps {
  /** Pourcentage de 0 à 100 */
  percentage: number;
  /** Taille du cercle en pixels */
  size?: number;
  /** Épaisseur du trait */
  strokeWidth?: number;
  /** Couleur de la piste (fond) */
  trackColor?: string;
  /** Couleur de la progression */
  progressColor?: string;
}

export default function CircularProgress({
  percentage,
  size = 56,
  strokeWidth = 4,
  trackColor = 'rgba(0,0,0,0.08)',
  progressColor = colors.dark900,
}: CircularProgressProps) {
  // Le rayon du cercle = moitié de la taille moins la moitié du trait
  // pour que le cercle ne dépasse pas du conteneur
  const radius = (size - strokeWidth) / 2;

  // La circonférence = 2 * π * rayon
  // C'est la longueur totale du trait si on faisait le tour complet
  const circumference = 2 * Math.PI * radius;

  // Le strokeDashoffset détermine combien du cercle est "caché"
  // Plus l'offset est grand, moins le cercle est rempli
  const strokeDashoffset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Cercle de fond (la piste grise) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Cercle de progression (l'arc coloré) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          // On tourne de -90° pour que l'arc commence en haut (12h)
          // Par défaut SVG commence à droite (3h)
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      {/* Texte du pourcentage centré */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { fontSize: size * 0.21 }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Rokkitt_400Regular',
    color: colors.textPlaceholder,
    textAlign: 'center',
  },
});
