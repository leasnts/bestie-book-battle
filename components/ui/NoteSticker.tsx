/**
 * NoteSticker — une note du carnet en autocollant brodé.
 *
 *    ◤┄┄┄┄┄╮
 *    ┆ ◢      ┆      ← la couleur de sa catégorie, une couture en pointillés
 *    ┆        ┆        tout autour, et le coin en haut à gauche qui se décolle
 *                      (en pile, c'est le coin qui reste visible)
 *    ╰┄┄┄┄┄┄┄┄╯
 *
 * Une note encore verrouillée est un autocollant de papier nu : on sait qu'elle
 * est là, rien de plus (ni couleur ni contenu, cf. règles du carnet).
 *
 * Composant du design system (DESIGN.md › Autocollants brodés) : toute vue qui
 * montre une note reprend celui-ci, on ne redessine jamais une note autrement.
 */

import React from 'react';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { inkAlpha, shadowAlpha, stickerMaterial } from '../../utils/constants';

interface NoteStickerProps {
  /** Couleur de la catégorie ; `null` pour une note verrouillée */
  color: string | null;
  /** Côté d'un autocollant carré */
  size?: number;
  /** Autocollant rectangulaire (étiquette) : largeur et hauteur, à la place de `size` */
  width?: number;
  height?: number;
  /** Un identifiant, pour des dégradés propres à chaque autocollant */
  id: string;
}

export default function NoteSticker({ color, size = 26, width, height, id }: NoteStickerProps) {
  const w = width ?? size;
  const h = height ?? size;
  // Arrondi, coin décollé et couture suivent le petit côté : une étiquette
  // allongée garde les proportions d'un autocollant carré
  const base = Math.min(w, h);
  const r = base * 0.26;
  /** Le coin décollé */
  const c = base * 0.34;
  const inset = base * 0.12;

  // Carré arrondi, le coin en haut à droite coupé en diagonale
  // Les deux bouts de la coupe sont adoucis, comme le reste de l'autocollant
  const k = base * 0.05;
  const shape = `M ${r} 0 H ${w - c - k} Q ${w - c} 0 ${w - c + k * 0.7} ${k * 0.7} L ${w - k * 0.7} ${c - k * 0.7} Q ${w} ${c} ${w} ${c + k} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  // La couture, un peu en retrait, qui suit la même forme
  const i = inset;
  const ri = r - inset * 0.6;
  const ci = c - inset * 0.4;
  const stitch = `M ${i + ri} ${i} H ${w - i - ci} L ${w - i} ${i + ci} V ${h - i - ri} Q ${w - i} ${h - i} ${w - i - ri} ${h - i} H ${i + ri} Q ${i} ${h - i} ${i} ${h - i - ri} V ${i + ri} Q ${i} ${i} ${i + ri} ${i} Z`;
  // Le rabat : le coin replié par-dessus, symétrique par rapport à la coupe
  // La pliure s'incurve un peu (le coin se roule), et la pointe repliée garde
  // l'arrondi du coin d'origine
  const bulge = c * 0.14;
  const fold = `Q ${w - c / 2 + bulge} ${c / 2 - bulge} ${w} ${c}`;
  const tip = Math.min(r, c * 0.5);
  const flapAt = (o: number) =>
    `M ${w - c} 0 ${fold} L ${w - c + tip - o} ${c + o} Q ${w - c - o} ${c + o} ${w - c - o} ${c - tip + o} Z`;
  const flap = flapAt(0);
  const flapShadow = flapAt(1.5);

  const fill = color ?? stickerMaterial.locked;

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={`shade-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff" stopOpacity={0.25} />
          <Stop offset="1" stopColor="#000" stopOpacity={0.08} />
        </LinearGradient>
        <LinearGradient id={`flap-${id}`} x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stickerMaterial.flap[0]} />
          <Stop offset="1" stopColor={stickerMaterial.flap[1]} />
        </LinearGradient>
      </Defs>
      {/* Dessiné coin à droite, puis retourné : le coin décollé passe à gauche */}
      <G transform={`translate(${w} 0) scale(-1 1)`}>
        <Path d={shape} fill={fill} />
        {/* Jamais d'aplat : un voile clair en haut, plus sombre en bas */}
        <Path d={shape} fill={`url(#shade-${id})`} />
        <Path
          d={stitch}
          fill="none"
          stroke={inkAlpha(color ? 0.32 : 0.2)}
          strokeWidth={0.9}
          strokeDasharray="2 1.6"
        />
        <Path d={flapShadow} fill={shadowAlpha(0.18)} />
        <Path d={flap} fill={`url(#flap-${id})`} />
      </G>
    </Svg>
  );
}
