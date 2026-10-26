/**
 * PaperWashBackdrop — le fond de l'en-tête du profil : de l'aquarelle sur papier,
 * découpée en festons.
 *
 *    ┌───────────────────────────────┐
 *    │ beurre ░░░░░░░░░░░░░░░░ rouge │   ← grandes taches qui se mêlent,
 *    │ ░░░░░░░ auréoles ░░░░░░░░░░░░ │      auréoles plus claires
 *    │ chocolat ░░░░░░░░░ rouge foncé│
 *    ╰◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡◡╯   ← bas coupé en demi-cercles, couture qui suit
 *
 * Le papier aquarelle choisi par Lea (2026-10-23) : beurre, rouge et chocolat
 * Lowki, sans beige. L'image vient de scripts/generate-profile-wash.py (les
 * auréoles ne se dessinent pas en React Native). Tout tient dans un seul SVG :
 * l'image est rognée par la forme festonnée, et la couture en points (STITCH)
 * suit les festons un peu au-dessus du bord.
 */

import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { ClipPath, Defs, Image, Path } from 'react-native-svg';
import { creamAlpha } from '../../utils/constants';
import { STITCH } from './NoteSticker';

const WASH = require('../../assets/images/watercolor/profile-wash.png');

/**
 * Rayon visé d'un feston ; ajusté pour qu'un nombre entier tombe pile sur la largeur.
 * Petit : sur le profil, le cadre des chiffres cache le milieu, et deux festons
 * doivent encore se voir dans la marge de 16 pt de chaque côté.
 */
const SCALLOP = 4;
/** Écart entre la couture et le bord découpé */
const STITCH_GAP = 4;

/** Une rangée de demi-cercles vers le bas, de droite à gauche, à la hauteur `y` */
function scallops(width: number, y: number, r: number, count: number): string {
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = width - i * 2 * r;
    d += ` A ${r} ${r} 0 0 1 ${x - 2 * r} ${y}`;
  }
  return d;
}

export default function PaperWashBackdrop() {
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w !== width || h !== height) setSize({ width: w, height: h });
  };

  const count = Math.max(1, Math.round(width / (2 * SCALLOP)));
  const r = width / (2 * count);
  const edge = height - r; // le bord droit, d'où partent les festons

  const shape = `M 0 0 H ${width} V ${edge}${scallops(width, edge, r, count)} Z`;
  const seam = `M ${width} ${edge - STITCH_GAP}${scallops(width, edge - STITCH_GAP, r, count)}`;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <ClipPath id="wash-cut">
              <Path d={shape} />
            </ClipPath>
          </Defs>
          <Image
            href={WASH}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#wash-cut)"
          />
          <Path
            d={seam}
            fill="none"
            stroke={creamAlpha(0.6)}
            strokeWidth={STITCH.width}
            strokeDasharray={STITCH.dash}
            strokeLinecap={STITCH.cap}
          />
        </Svg>
      )}
    </View>
  );
}
