/**
 * Icône "flame" (style Lucide, version remplie)
 * Dessin identique à lucide/icons/flame mais en mode filled (pas stroke).
 * Utilisé dans les badges streak pour indiquer les jours consécutifs de lecture.
 *
 * Comment ça marche :
 * - On utilise react-native-svg pour dessiner le SVG
 * - Le path reproduit exactement le tracé Lucide "flame"
 * - fill={color} remplit la forme en solide (au lieu de stroke qui trace le contour)
 * - La viewBox 0 0 24 24 est la taille native Lucide, le composant se redimensionne
 *   automatiquement à n'importe quelle taille via les props width/height
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function IconFlame({ size = 24, color = 'currentColor' }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        fill={color}
      />
    </Svg>
  );
}
