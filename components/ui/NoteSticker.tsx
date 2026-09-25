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
 */

import React from 'react';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { inkAlpha, shadowAlpha } from '../../utils/constants';

/** Papier nu des notes verrouillées */
const LOCKED_PAPER = '#efe9df';

interface NoteStickerProps {
  /** Couleur de la catégorie ; `null` pour une note verrouillée */
  color: string | null;
  size?: number;
  /** Un identifiant, pour des dégradés propres à chaque autocollant */
  id: string;
}

export default function NoteSticker({ color, size = 26, id }: NoteStickerProps) {
  const s = size;
  const r = s * 0.26;
  /** Le coin décollé */
  const c = s * 0.34;
  const inset = s * 0.12;

  // Carré arrondi, le coin en haut à droite coupé en diagonale
  // Les deux bouts de la coupe sont adoucis, comme le reste de l'autocollant
  const k = s * 0.05;
  const shape = `M ${r} 0 H ${s - c - k} Q ${s - c} 0 ${s - c + k * 0.7} ${k * 0.7} L ${s - k * 0.7} ${c - k * 0.7} Q ${s} ${c} ${s} ${c + k} V ${s - r} Q ${s} ${s} ${s - r} ${s} H ${r} Q 0 ${s} 0 ${s - r} V ${r} Q 0 0 ${r} 0 Z`;
  // La couture, un peu en retrait, qui suit la même forme
  const i = inset;
  const ri = r - inset * 0.6;
  const ci = c - inset * 0.4;
  const stitch = `M ${i + ri} ${i} H ${s - i - ci} L ${s - i} ${i + ci} V ${s - i - ri} Q ${s - i} ${s - i} ${s - i - ri} ${s - i} H ${i + ri} Q ${i} ${s - i} ${i} ${s - i - ri} V ${i + ri} Q ${i} ${i} ${i + ri} ${i} Z`;
  // Le rabat : le coin replié par-dessus, symétrique par rapport à la coupe
  // La pliure s'incurve un peu (le coin se roule), et la pointe repliée garde
  // l'arrondi du coin d'origine
  const bulge = c * 0.14;
  const fold = `Q ${s - c / 2 + bulge} ${c / 2 - bulge} ${s} ${c}`;
  const tip = Math.min(r, c * 0.5);
  const flapAt = (o: number) =>
    `M ${s - c} 0 ${fold} L ${s - c + tip - o} ${c + o} Q ${s - c - o} ${c + o} ${s - c - o} ${c - tip + o} Z`;
  const flap = flapAt(0);
  const flapShadow = flapAt(1.5);

  const fill = color ?? LOCKED_PAPER;

  return (
    <Svg width={s} height={s}>
      <Defs>
        <LinearGradient id={`shade-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff" stopOpacity={0.25} />
          <Stop offset="1" stopColor="#000" stopOpacity={0.08} />
        </LinearGradient>
        <LinearGradient id={`flap-${id}`} x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fdfbf8" />
          <Stop offset="1" stopColor="#d8d1c6" />
        </LinearGradient>
      </Defs>
      {/* Dessiné coin à droite, puis retourné : le coin décollé passe à gauche */}
      <G transform={`translate(${s} 0) scale(-1 1)`}>
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
