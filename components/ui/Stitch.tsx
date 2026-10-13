/**
 * Stitch — le fil, seule matière des traits de l'app (#112).
 *
 * Tout trait qui n'est pas un filet plein (un saut dans le classement, le bord
 * d'une zone « ajouter une couverture », une pastille en suspens) est une
 * couture : des points ronds au point des autocollants (`STITCH`), jamais des
 * tirets. Deux formes :
 * - `StitchLine` : une ligne horizontale cousue, sur toute la largeur ;
 * - `StitchBorder` : une couture tout le tour d'une vue, posée par-dessus
 *   (absolue, ne touche pas la mise en page), à la place d'un `borderStyle`.
 */

import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { STICKER_BASE_LARGE, STITCH, stitchColor, stitchInset } from './NoteSticker';

function useSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };
  return [size, onLayout] as const;
}

interface StitchLineProps {
  /** Teinte du fil ; par défaut l'encre pâle des coutures */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function StitchLine({ color = stitchColor(true), style }: StitchLineProps) {
  const [{ width }, onLayout] = useSize();
  const y = STITCH.width / 2;
  return (
    <View style={[{ height: STITCH.width }, style]} onLayout={onLayout} pointerEvents="none">
      {width > 0 && (
        <Svg width={width} height={STITCH.width}>
          <Line
            x1={y}
            y1={y}
            x2={width - y}
            y2={y}
            stroke={color}
            strokeWidth={STITCH.width}
            strokeDasharray={STITCH.dash}
            strokeLinecap={STITCH.cap}
          />
        </Svg>
      )}
    </View>
  );
}

interface StitchBorderProps {
  /** L'arrondi de la vue cousue */
  radius?: number;
  /** Écart entre la couture et le bord ; par défaut celui des cadres de l'accueil, 0 = sur le bord */
  inset?: number;
  color?: string;
}

export function StitchBorder({
  radius = 0,
  inset = stitchInset(STICKER_BASE_LARGE),
  color = stitchColor(true),
}: StitchBorderProps) {
  const [{ width, height }, onLayout] = useSize();
  // Le fil est centré sur son tracé : on rentre d'un demi-point pour qu'il reste entier
  const i = inset + STITCH.width / 2;
  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {width > 0 && height > 0 && (
        <Svg width={width} height={height}>
          <Rect
            x={i}
            y={i}
            width={width - i * 2}
            height={height - i * 2}
            // Même arrondi de couture que les cadres (GlassSection)
            rx={Math.max(radius - i * 0.6, 0)}
            fill="none"
            stroke={color}
            strokeWidth={STITCH.width}
            strokeDasharray={STITCH.dash}
            strokeLinecap={STITCH.cap}
          />
        </Svg>
      )}
    </View>
  );
}
