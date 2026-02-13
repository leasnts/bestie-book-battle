/**
 * Icône "rotate counter-clockwise" (style Lucide)
 * Utilise react-native-svg pour éviter les soucis de résolution Metro avec lucide-react-native.
 * Dessin identique à lucide/icons/rotate-ccw.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconRotateCcwProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function IconRotateCcw({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconRotateCcwProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <Path d="M3 3v5h5" />
    </Svg>
  );
}
