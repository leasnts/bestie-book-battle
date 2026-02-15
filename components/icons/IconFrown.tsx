/**
 * Icône "frown" (visage triste - style Lucide)
 * Utilisée dans le badge streak quand le streak est en danger de mourir
 * (tu as lu hier mais pas encore aujourd'hui).
 *
 * Même approche que IconFlame : SVG via react-native-svg pour un rendu net.
 */
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function IconFrown({ size = 24, color = 'currentColor' }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="12" r="10" />
      <Path d="M16 16s-1.5-2-4-2-4 2-4 2" />
      <Circle cx="9" cy="9" r="1.5" fill={color} />
      <Circle cx="15" cy="9" r="1.5" fill={color} />
    </Svg>
  );
}
