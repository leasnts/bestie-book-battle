/**
 * Composant RibbonBookmark
 *
 * Un signet en ruban, brodé, qui sort du haut du livre et pend devant la
 * couverture, bout coupé en V, surpiqûre sur tout le tour :
 *
 *     ┌─────────┐  ┌─────────┐  ┌─────────┐
 *     │┆       ┆│  │┆       ┆│  │┆       ┆│
 *     │┆       ┆│  │┆∿∿∿∿∿∿∿┆│  │┆   ✦   ┆│
 *     │┆   ✓   ┆│  │┆▓▓▓▓▓▓▓┆│  │┆       ┆│
 *     └──╲ ╱──┘   └──╲ ╱──┘   └──╲ ╱──┘
 *      terminé      en cours     nouveau
 *
 * - `done`    : ruban lie de vin, coche Lucide crème ;
 * - `reading` : ruban écru qu'un brun noyer imprègne depuis le bout, à mon %,
 *               comme une teinture qui monte dans le tissu. Front ondulé et
 *               fondu, avec une ligne plus foncée là où la teinture s'accumule
 *               (comme le bord d'une aquarelle) : une coupe droite faisait
 *               abrupte. Le lie de vin reste réservé à « terminé » ;
 * - `new`     : ruban écru, étincelle Lucide lie de vin (dernier livre ajouté).
 *
 * Les pictogrammes sont des icônes Lucide posées sur l'image, pas brodés : règle
 * « Lucide uniquement », et la coche brodée ne plaisait pas.
 *
 * Les rubans sont calculés par scripts/generate-ribbon-bookmarks.py (tissu,
 * surpiqûre en relief, ombre portée) : c'est ce qui les rend réalistes. Pour une
 * nouvelle variante, l'ajouter au script plutôt que de dessiner un ruban ici.
 */

import { Image } from 'expo-image';
import { CheckIcon, SparkleIcon, type LucideIcon } from 'lucide-react-native';
import React, { useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  Image as SvgImage,
  LinearGradient,
  Mask,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

const RIBBONS = {
  done: require('../../assets/images/ribbons/ribbon-done.png'),
  new: require('../../assets/images/ribbons/ribbon-new.png'),
  track: require('../../assets/images/ribbons/ribbon-progress-track.png'),
  fill: require('../../assets/images/ribbons/ribbon-progress-fill.png'),
};

/** Taille de l'image, ombre comprise, et bornes du ruban (CANVAS_*, RIBBON_*, TOP, TAIL_END du script) */
const WIDTH = 34;
const HEIGHT = 66;
const RIBBON_LEFT = 5;
const RIBBON_WIDTH = 23;
const RIBBON_TOP = 1.5;
const RIBBON_END = 60;
/** Couleur de la ligne plus foncée au front de teinture (noyer profond) */
const TIDE_LINE = '#3a2a20';

/** Pictogramme de chaque ruban : icône Lucide, sa couleur, centrée dans le ruban */
const ICONS: Record<'done' | 'new', { icon: LucideIcon; color: string; filled: boolean }> = {
  done: { icon: CheckIcon, color: '#f6ede4', filled: false },
  // Étincelle pleine : en contour, elle faisait une forme cernée d'une bordure
  new: { icon: SparkleIcon, color: '#7a2e3e', filled: true },
};
const ICON_SIZE = 16;
const ICON_CENTER_Y = 38;

/** Hauteur de l'ondulation du front, et largeur du fondu sous elle */
const WAVE = 0.9;
const FEATHER = 4.5;
/** Hauteur du ruban au-dessus du bord de la couverture (COVER_TOP du script) */
export const RIBBON_ABOVE_COVER = 9;
/**
 * Remplissage minimum d'un livre commencé : à 3 %, le lie de vin n'est qu'un
 * liseré et on ne le distingue plus d'un livre pas commencé. Le vrai % reste lu
 * par VoiceOver sur la couverture.
 */
const MIN_FILL_PERCENT = 10;

type RibbonBookmarkProps =
  | { kind: 'done' | 'new' }
  | { kind: 'reading'; /** Mon avancement, de 0 à 100 */ percent: number };

/** Le front de teinture : une ondulation irrégulière (deux vagues), à la hauteur `y` */
function dyeFront(y: number, phase: number): string {
  const steps = 20;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const x = RIBBON_LEFT + (RIBBON_WIDTH * i) / steps;
    const t = (i / steps) * Math.PI * 2;
    // Trois vagues de plus en plus fines : le tissu boit la teinture inégalement
    const wy =
      y +
      WAVE *
        (Math.sin(t * 0.9 + phase) * 0.55 +
          Math.sin(t * 2.3 + phase * 1.7) * 0.3 +
          Math.sin(t * 5.1 + phase * 2.9) * 0.15);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${wy.toFixed(2)} `;
  }
  return d;
}

export default function RibbonBookmark(props: RibbonBookmarkProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const percent = props.kind === 'reading' ? Math.min(100, Math.max(MIN_FILL_PERCENT, props.percent)) : 0;

  // Hauteur du front : le lie de vin monte depuis le bout du V
  const front = RIBBON_END - ((RIBBON_END - RIBBON_TOP) * percent) / 100;
  // Une ondulation différente selon le %, pour que deux livres ne se ressemblent pas
  const line = useMemo(() => dyeFront(front, percent * 0.37), [front, percent]);

  if (props.kind !== 'reading') {
    const { icon: Icon, color, filled } = ICONS[props.kind];
    return (
      <View style={styles.ribbon}>
        <Image source={RIBBONS[props.kind]} style={StyleSheet.absoluteFill} contentFit="contain" />
        <View style={styles.icon}>
          <Icon
            size={ICON_SIZE}
            color={color}
            fill={filled ? color : 'none'}
            // Pleine : un trait quasi nul garde les pointes fines (un trait plus épais
            // les arrondissait et l'étincelle virait à la croix)
            strokeWidth={filled ? 0.25 : 2.5}
            absoluteStrokeWidth
          />
        </View>
      </View>
    );
  }

  // Zone teinte : sous le front, jusqu'en bas de l'image
  const dyed = `${line} L${RIBBON_LEFT + RIBBON_WIDTH},${HEIGHT} L${RIBBON_LEFT},${HEIGHT} Z`;
  const full = percent >= 100;

  return (
    <Svg width={WIDTH} height={HEIGHT}>
      <Defs>
        {/* Fondu du front : transparent au-dessus des vagues, plein juste dessous */}
        <LinearGradient
          id={`fade${id}`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={front - WAVE}
          x2="0"
          y2={front + WAVE + FEATHER}
        >
          <Stop offset="0" stopColor="#fff" stopOpacity={full ? 1 : 0} />
          <Stop offset="0.35" stopColor="#fff" stopOpacity={full ? 1 : 0.45} />
          <Stop offset="1" stopColor="#fff" stopOpacity={1} />
        </LinearGradient>
        <Mask id={`dye${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={WIDTH} height={HEIGHT}>
          <Path d={full ? `M0,0 H${WIDTH} V${HEIGHT} H0 Z` : dyed} fill={`url(#fade${id})`} />
        </Mask>
        <ClipPath id={`ribbon${id}`}>
          <Rect x={RIBBON_LEFT} y={RIBBON_TOP} width={RIBBON_WIDTH} height={RIBBON_END - RIBBON_TOP} />
        </ClipPath>
      </Defs>

      <SvgImage href={RIBBONS.track} width={WIDTH} height={HEIGHT} />
      {/* Le lie de vin : même tissu, même surpiqûre, calés au pixel, révélés sous le front */}
      <SvgImage href={RIBBONS.fill} width={WIDTH} height={HEIGHT} mask={`url(#dye${id})`} />
      {/* La ligne de teinture accumulée, juste au bord du front */}
      {!full && (
        <Path
          d={line}
          stroke={TIDE_LINE}
          strokeOpacity={0.16}
          strokeWidth={1.4}
          fill="none"
          clipPath={`url(#ribbon${id})`}
          transform={`translate(0, ${WAVE * 0.6})`}
        />
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    width: WIDTH,
    height: HEIGHT,
  },
  // Légère ombre sous l'icône : elle semble posée sur le tissu, pas imprimée dessous
  icon: {
    position: 'absolute',
    left: RIBBON_LEFT + (RIBBON_WIDTH - ICON_SIZE) / 2,
    top: ICON_CENTER_Y - ICON_SIZE / 2,
    shadowColor: '#1e140e',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.3,
    shadowRadius: 0.5,
  },
});
