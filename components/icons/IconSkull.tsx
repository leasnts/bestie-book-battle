/**
 * Icône "skull" (tête de mort - style Lucide)
 * Utilisée dans le badge streak quand le streak est en danger de mourir
 * (tu as lu hier mais pas encore aujourd'hui).
 *
 * Version plus dramatique que le frown pour montrer que le streak va "mourir".
 */
import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function IconSkull({ size = 24, color = 'currentColor' }: Props) {
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
      <Circle cx="9" cy="12" r="1" />
      <Circle cx="15" cy="12" r="1" />
      <Path d="M8 20h8" />
      <Path d="m12 5-2 18" />
      <Path d="M9.5 11.5 8 20m7-8.5 1.5 8.5" />
      <Path d="M4 11a8 8 0 0 1 16 0c0 4.5-2 10-8 10s-8-5.5-8-10" />
    </Svg>
  );
}
