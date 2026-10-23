/**
 * PatchworkBackdrop — un patchwork des couleurs de la charte, cousu.
 *
 *    ┌────────┬─────────────┬────────┐
 *    │ beurre │    beige    │ rouge  │
 *    ├────────┴────┬────────┴┬───────┤   ← coutures en points (STITCH)
 *    │  chocolat   │ papier  │ beurre│
 *    ├─────┬───────┴─────┬───┴───────┤
 *    │beige│    rouge    │  papier   │
 *    └─────┴─────────────┴───────────┘
 *
 * Derrière l'en-tête du profil. Les quatre paires Lowki (beurre, beige, rouge,
 * chocolat) et le papier, chaque pièce en dégradé (jamais d'aplat), un peu
 * adoucies dans le papier. Le prénom tombe sur une pièce de papier. Les
 * pièces sont des fractions de la vue : le patchwork suit n'importe quelle taille.
 */

import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import { inkAlpha, lowki } from '../../utils/constants';
import { STITCH } from './NoteSticker';

/** Le papier dans lequel on adoucit chaque pièce */
const PAPER = '#f5efe6';
type Tone = keyof typeof lowki | 'paper';

/**
 * Part de couleur gardée par ton (le reste est du papier). Le chocolat et le
 * rouge trop dilués virent au gris et au rose : on les garde francs.
 */
const STRENGTH: Record<keyof typeof lowki, number> = { butter: 0.85, beige: 0.7, red: 0.8, chocolate: 0.85 };

/** Les rangées du patchwork : hauteur, puis largeur et ton de chaque pièce */
const ROWS: { height: number; patches: [number, Tone][] }[] = [
  { height: 0.36, patches: [[0.3, 'butter'], [0.42, 'beige'], [0.28, 'red']] },
  { height: 0.34, patches: [[0.44, 'chocolate'], [0.26, 'paper'], [0.3, 'butter']] },
  { height: 0.3, patches: [[0.22, 'beige'], [0.4, 'red'], [0.38, 'paper']] },
];

/** #rrggbb mêlé au papier, `t` = part de couleur */
function soften(hex: string, t: number): string {
  const channel = (color: string, i: number) => parseInt(color.slice(1 + i * 2, 3 + i * 2), 16);
  const mixed = [0, 1, 2].map((i) => Math.round(channel(hex, i) * t + channel(PAPER, i) * (1 - t)));
  return `rgb(${mixed.join(',')})`;
}

function toneStops(tone: Tone): [string, string] {
  if (tone === 'paper') return ['#fbf8f3', '#efe7da'];
  return [soften(lowki[tone].light, STRENGTH[tone]), soften(lowki[tone].dark, STRENGTH[tone])];
}

const TONES: Tone[] = ['butter', 'beige', 'red', 'chocolate', 'paper'];

export default function PatchworkBackdrop() {
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w !== width || h !== height) setSize({ width: w, height: h });
  };

  const patches: { x: number; y: number; w: number; h: number; tone: Tone }[] = [];
  const seams: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let y = 0;
  ROWS.forEach((row, r) => {
    const h = row.height * height;
    let x = 0;
    row.patches.forEach(([share, tone], c) => {
      const w = share * width;
      patches.push({ x, y, w, h, tone });
      // Couture verticale entre deux pièces d'une même rangée
      if (c > 0) seams.push({ x1: x, y1: y, x2: x, y2: y + h });
      x += w;
    });
    // Couture horizontale entre deux rangées
    if (r > 0) seams.push({ x1: 0, y1: y, x2: width, y2: y });
    y += h;
  });

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            {TONES.map((tone) => {
              const [top, bottom] = toneStops(tone);
              return (
                <LinearGradient key={tone} id={`patch-${tone}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={top} />
                  <Stop offset="1" stopColor={bottom} />
                </LinearGradient>
              );
            })}
          </Defs>
          {patches.map((p, i) => (
            <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={`url(#patch-${p.tone})`} />
          ))}
          {seams.map((s, i) => (
            <Line
              key={i}
              {...s}
              stroke={inkAlpha(0.28)}
              strokeWidth={STITCH.width}
              strokeDasharray={STITCH.dash}
              strokeLinecap={STITCH.cap}
            />
          ))}
        </Svg>
      )}
    </View>
  );
}
