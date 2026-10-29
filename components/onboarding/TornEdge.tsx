/**
 * TornEdge — le haut d'une feuille au bord frangé, comme un papier fait main.
 *
 * Posé au-dessus du pied de l'onboarding : la feuille qui porte « Continuer »
 * occupe toute la largeur et finit par ce bord, sans ombre (Lea, 2026-10-29 :
 * l'ombre derrière était trop voyante). Le bord est tiré au hasard une fois pour
 * toutes (graine fixe) : le même à chaque écran.
 */

import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** Hauteur des dents du bord */
export const TORN_EDGE_H = 6;

interface TornEdgeProps {
  /** La couleur de la feuille */
  color: string;
}

export default function TornEdge({ color }: TornEdgeProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View style={styles.edge} onLayout={onLayout} pointerEvents="none">
      {width > 0 && (
        <Svg width={width} height={TORN_EDGE_H + 1}>
          <Path d={edgePath(width)} fill={color} />
        </Svg>
      )}
    </View>
  );
}

/** Des dents irrégulières de 5 à 14 pt, de hauteur variable ; le bas est plein */
function edgePath(width: number) {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const base = TORN_EDGE_H;
  let x = 0;
  let d = `M0 ${base}`;
  while (x < width) {
    x = Math.min(width, x + 5 + random() * 9);
    const y = base - random() * TORN_EDGE_H * (random() < 0.2 ? 1 : 0.55);
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L${width} ${base + 1} L0 ${base + 1} Z`;
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -TORN_EDGE_H,
    height: TORN_EDGE_H + 1,
  },
});
