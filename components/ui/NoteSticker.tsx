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
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { fonts, inkAlpha, shadowAlpha, stickerMaterial } from '../../utils/constants';

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
  /**
   * Plafond du côté qui règle l'arrondi, le coin et la couture. Une grande
   * carte (une note du carnet) garde ainsi les détails d'un autocollant moyen
   * au lieu d'un arrondi démesuré.
   */
  maxBase?: number;
  /**
   * Le coin qui se décolle. En haut à gauche par défaut (en pile d'autocollants,
   * c'est lui qui reste visible) ; en bas à droite pour une note du carnet, où
   * le haut porte l'autrice et la page. `none` : à plat, sans coin décollé
   * (la pile des nouvelles, où c'est le doigt qui décolle la note).
   */
  corner?: 'top-left' | 'bottom-right' | 'none';
  /**
   * Le nom de la catégorie, en très grand et presque transparent, en bas,
   * ferré à gauche sur la marge du texte de la note, coupé par le bas (et par
   * la droite s'il est long) :
   * il fait partie du fond de l'autocollant. Toujours en minuscules : en grand,
   * les capitales crieraient.
   */
  watermark?: string;
  /** La marge de gauche du texte de la note, pour que le filigrane s'y aligne */
  watermarkInset?: number;
  /**
   * À plat (`none`) seulement : la couture s'ouvre en bas entre `left` et `right`
   * et descend dans l'intercalaire choisi, qui la continue (`CategoryPicker`).
   */
  notch?: { left: number; right: number } | null;
}

/** Le point de couture, le même sur la note et sur l'intercalaire qui la prolonge */
export const STITCH = { width: 0.9, dash: '2 1.6' };
export const stitchColor = (colored: boolean) => inkAlpha(colored ? 0.32 : 0.2);
/** L'écart entre la couture et le bord, selon le côté qui règle l'autocollant */
export const stitchInset = (base: number) => base * 0.07;
/**
 * Plafond de ce côté pour une grande note : elle garde les détails d'un
 * autocollant moyen. Les cadres de l'accueil (`GlassSection`) cousent à cet écart.
 */
export const STICKER_BASE_LARGE = 96;

export default function NoteSticker({
  color,
  size = 26,
  width,
  height,
  id,
  maxBase = Infinity,
  corner = 'top-left',
  watermark,
  watermarkInset = 12,
  notch = null,
}: NoteStickerProps) {
  const w = width ?? size;
  const h = height ?? size;
  // Arrondi, coin décollé et couture suivent le petit côté : une étiquette
  // allongée garde les proportions d'un autocollant carré
  const base = Math.min(w, h, maxBase);
  const r = base * 0.26;
  /** Le coin décollé */
  const c = base * 0.34;
  // La couture, près du bord (retour de Lea : plus près que les 12 % d'origine)
  const inset = stitchInset(base);

  // Carré arrondi, le coin en haut à droite coupé en diagonale
  // Les deux bouts de la coupe sont adoucis, comme le reste de l'autocollant
  const k = base * 0.05;
  const cut = `M ${r} 0 H ${w - c - k} Q ${w - c} 0 ${w - c + k * 0.7} ${k * 0.7} L ${w - k * 0.7} ${c - k * 0.7} Q ${w} ${c} ${w} ${c + k} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  // La couture, un peu en retrait, qui suit la même forme
  const i = inset;
  const ri = r - inset * 0.6;
  const ci = c - inset * 0.4;
  const cutStitch = `M ${i + ri} ${i} H ${w - i - ci} L ${w - i} ${i + ci} V ${h - i - ri} Q ${w - i} ${h - i} ${w - i - ri} ${h - i} H ${i + ri} Q ${i} ${h - i} ${i} ${h - i - ri} V ${i + ri} Q ${i} ${i} ${i + ri} ${i} Z`;
  // À plat (`none`) : le carré arrondi entier, aucun coin coupé
  const whole = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  const wholeStitch = `M ${i + ri} ${i} H ${w - i - ri} Q ${w - i} ${i} ${w - i} ${i + ri} V ${h - i - ri} Q ${w - i} ${h - i} ${w - i - ri} ${h - i} H ${i + ri} Q ${i} ${h - i} ${i} ${h - i - ri} V ${i + ri} Q ${i} ${i} ${i + ri} ${i} Z`;
  // Ouverte vers l'intercalaire : la couture tourne vers le bas et sort par le
  // bord. Près d'un coin arrondi, elle y descend en S depuis le côté.
  const f = 3;
  const x1 = notch?.left ?? 0;
  const x2 = notch?.right ?? 0;
  const notchLeft =
    x1 - f >= i + ri
      ? `M ${x1} ${h} V ${h - i + f} Q ${x1} ${h - i} ${x1 - f} ${h - i} H ${i + ri} Q ${i} ${h - i} ${i} ${h - i - ri}`
      : `M ${x1} ${h} V ${h - i} C ${x1} ${h - i - ri / 2} ${i} ${h - i - ri / 2} ${i} ${h - i - ri}`;
  const notchRight =
    x2 + f <= w - i - ri
      ? `Q ${w - i} ${h - i} ${w - i - ri} ${h - i} H ${x2 + f} Q ${x2} ${h - i} ${x2} ${h - i + f} V ${h}`
      : `C ${w - i} ${h - i - ri / 2} ${x2} ${h - i - ri / 2} ${x2} ${h - i} V ${h}`;
  const notchStitch = `${notchLeft} V ${i + ri} Q ${i} ${i} ${i + ri} ${i} H ${w - i - ri} Q ${w - i} ${i} ${w - i} ${i + ri} V ${h - i - ri} ${notchRight}`;
  const notched = corner === 'none' && !!notch;
  const shape = corner === 'none' ? whole : cut;
  const stitch = corner === 'none' ? wholeStitch : cutStitch;
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
  const flip = corner === 'bottom-right' ? `translate(0 ${h}) scale(1 -1)` : `translate(${w} 0) scale(-1 1)`;
  // Le filigrane : sa base passe juste sous le bord du bas
  const markSize = base * 0.62;

  return (
    <Svg width={w} height={h}>
      <Defs>
        {/* Retourné de haut en bas, le voile l'est aussi : on l'inverse pour garder le clair en haut */}
        <LinearGradient
          id={`shade-${id}`}
          x1="0"
          y1={corner === 'bottom-right' ? '1' : '0'}
          x2="0"
          y2={corner === 'bottom-right' ? '0' : '1'}
        >
          <Stop offset="0" stopColor="#fff" stopOpacity={0.25} />
          <Stop offset="1" stopColor="#000" stopOpacity={0.08} />
        </LinearGradient>
        <LinearGradient id={`flap-${id}`} x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stickerMaterial.flap[0]} />
          <Stop offset="1" stopColor={stickerMaterial.flap[1]} />
        </LinearGradient>
        {!!watermark && (
          <ClipPath id={`clip-${id}`}>
            <Path d={shape} transform={flip} />
          </ClipPath>
        )}
      </Defs>
      {/* Dessiné coin en haut à droite, puis retourné : à gauche, ou en bas */}
      <G transform={flip}>
        <Path d={shape} fill={fill} />
        {/* Jamais d'aplat : un voile clair en haut, plus sombre en bas */}
        <Path d={shape} fill={`url(#shade-${id})`} />
      </G>
      {!!watermark && (
        <G clipPath={`url(#clip-${id})`}>
          <SvgText
            x={watermarkInset}
            y={h + markSize * 0.02}
            fontFamily={fonts.display}
            fontSize={markSize}
            fill={inkAlpha(0.07)}
          >
            {watermark.toLocaleLowerCase('fr')}
          </SvgText>
        </G>
      )}
      {/* Ouverte, dessinée sans retournement : `left` et `right` sont pris depuis la gauche */}
      <G transform={notched ? undefined : flip}>
        <Path
          d={notched ? notchStitch : stitch}
          fill="none"
          stroke={stitchColor(!!color)}
          strokeWidth={STITCH.width}
          strokeDasharray={STITCH.dash}
        />
      </G>
      <G transform={flip}>
        {corner !== 'none' && (
          <>
            <Path d={flapShadow} fill={shadowAlpha(0.18)} />
            <Path d={flap} fill={`url(#flap-${id})`} />
          </>
        )}
      </G>
    </Svg>
  );
}
