/**
 * Le bloc de marque, partagé par le splash et l'écran de connexion : les yeux,
 * « chapi » et la tagline, ton sur ton sur le fond rouge.
 *
 * Les deux écrans le posent au même endroit (par rapport au centre de l'écran),
 * au point près : le splash s'efface sur un écran de connexion identique, le
 * relais ne se voit pas.
 */

import React from 'react';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import {
  LOGO_EYES_CLIP,
  LOGO_EYES_PATH,
  LOGO_EYES_VIEWBOX,
  LOGO_SUBTITLE_PATH,
  LOGO_SUBTITLE_VIEWBOX,
  LOGO_WORD_PATH,
  LOGO_WORD_VIEWBOX,
} from './logoEyesPath';

/**
 * Ton sur ton, comme les visuels officiels de Lea (« lowki_red ») : fond rouge,
 * logo d'un rouge plus profond, et un liseré clair d'1 pt sous chaque forme pour
 * l'effet gravé dans le papier. Dégradés partout (jamais d'aplat), sauf le texte.
 */
export const BRAND_BG = ['#a62f43', '#92293b'] as const;
const SHAPE_GRADIENT = ['#6e1f2c', '#581924'] as const;
const SHAPE_WORD = '#611b27';
const DEBOSS_LIGHT = '#c35164';
const DEBOSS_OPACITY = 0.55;

/** Côté du carré du logo, en points. */
export const LOGO_SIZE = 220;
/** Décalage du liseré des yeux, 1 pt dans le repère 1200. */
const DEBOSS_EYES = 5.5;

/**
 * « chapi » et la tagline sont des tracés (pas des <Text> : au splash, les
 * polices ne sont pas encore chargées). Échelle en points par unité de police :
 * celle de l'ancien « Lowki » pour le mot, un peu plus petite pour la tagline,
 * plus longue que « book club ».
 */
const WORD_SCALE = 51.5 / 1643;
const SUBTITLE_SCALE = (13.8 / 865) * 0.85;
/** Le liseré : 1 pt sous le mot, 0,75 pt sous la tagline (en unités de police). */
const DEBOSS_WORD = 1 / WORD_SCALE;
const DEBOSS_SUBTITLE = 0.75 / SUBTITLE_SCALE;

/** Le cadre d'un tracé, agrandi vers le bas pour laisser la place au liseré. */
function frame(viewBox: string, scale: number, deboss: number) {
  const [x, y, w, h] = viewBox.split(' ').map(Number);
  return { viewBox: `${x} ${y} ${w} ${h + deboss}`, width: w * scale, height: (h + deboss) * scale };
}
const WORD = frame(LOGO_WORD_VIEWBOX, WORD_SCALE, DEBOSS_WORD);
const SUBTITLE = frame(LOGO_SUBTITLE_VIEWBOX, SUBTITLE_SCALE, DEBOSS_SUBTITLE);

/**
 * Positions finales, par rapport au centre de l'écran : l'ensemble (yeux, 16 pt,
 * mot, 8 pt, tagline) est centré. Au splash, les yeux arrivent centrés puis
 * remontent de EYES_Y.
 */
export const LOCKUP = {
  eyesY: -50,
  wordTop: 40,
  subtitleTop: 40 + WORD.height + 8,
};

/** Un tracé gravé : le liseré clair décalé dessous, la forme pleine dessus. */
function Debossed({ d, viewBox, deboss }: { d: string; viewBox: string; deboss: number }) {
  return (
    <Svg width="100%" height="100%" viewBox={viewBox}>
      <G transform={`translate(0 ${deboss})`}>
        <Path d={d} fill={DEBOSS_LIGHT} fillOpacity={DEBOSS_OPACITY} />
      </G>
      <Path d={d} fill={SHAPE_WORD} />
    </Svg>
  );
}

/** « chapi », à sa place sous les yeux (à poser dans le point d'ancrage central). */
export function BrandWord({ style }: { style?: object }) {
  return (
    <Animated.View style={[styles.word, style]}>
      <Debossed d={LOGO_WORD_PATH} viewBox={WORD.viewBox} deboss={DEBOSS_WORD} />
    </Animated.View>
  );
}

/** « Ta lecture, en bonne compagnie », sous « chapi ». */
export function BrandTagline({ style }: { style?: object }) {
  return (
    <Animated.View style={[styles.subtitle, style]}>
      <Debossed d={LOGO_SUBTITLE_PATH} viewBox={SUBTITLE.viewBox} deboss={DEBOSS_SUBTITLE} />
    </Animated.View>
  );
}

type Side = 'left' | 'right';

/**
 * Le tracé des yeux contient 5 contours : la silhouette, le creux de chaque œil
 * et chaque pupille. Séparés, ils laissent bouger les pupilles dans leur creux.
 */
const [OUTLINE, LEFT_HOLE, LEFT_PUPIL, RIGHT_HOLE, RIGHT_PUPIL] = LOGO_EYES_PATH.split(/(?=M)/);
const RING = OUTLINE + LEFT_HOLE + RIGHT_HOLE;
const PUPIL = { left: LEFT_PUPIL, right: RIGHT_PUPIL };

/** Les paupières se ferment vers le bas de chaque œil (repère 1200). */
const LID_PIVOT = { left: 975, right: 920 };
/** Jusqu'où va la pupille dans son creux, en points (regard à 1). */
const GAZE_REACH = { left: (62 / LOGO_EYES_VIEWBOX) * LOGO_SIZE, right: (46 / LOGO_EYES_VIEWBOX) * LOGO_SIZE };

function EyeGradient() {
  return (
    <SvgGradient id="eyes" gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="0" y2="1010">
      <Stop offset="0" stopColor={SHAPE_GRADIENT[0]} />
      <Stop offset="1" stopColor={SHAPE_GRADIENT[1]} />
    </SvgGradient>
  );
}

/** Une forme des yeux, coupée à un seul œil, dans le carré complet du logo. */
function EyeLayer({ side, d, evenOdd }: { side: Side; d: string; evenOdd?: boolean }) {
  const rule = evenOdd ? 'evenodd' : 'nonzero';
  return (
    <Svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox={`0 0 ${LOGO_EYES_VIEWBOX} ${LOGO_EYES_VIEWBOX}`}>
      <Defs>
        <EyeGradient />
        <ClipPath id="cut">
          <Path d={LOGO_EYES_CLIP[side]} />
        </ClipPath>
      </Defs>
      <G transform={`translate(0 ${DEBOSS_EYES})`}>
        <Path d={d} fill={DEBOSS_LIGHT} fillOpacity={DEBOSS_OPACITY} fillRule={rule} clipPath="url(#cut)" />
      </G>
      <Path d={d} fill="url(#eyes)" fillRule={rule} clipPath="url(#cut)" />
    </Svg>
  );
}

/** Un œil entier et figé (le splash le fait glisser et cligner d'un bloc). */
export function Eye({ side }: { side: Side }) {
  return <EyeLayer side={side} d={LOGO_EYES_PATH} />;
}

/**
 * Un œil vivant : la pupille suit `gaze` (de -1 à 1 sur chaque axe) et la
 * paupière se ferme quand `lid` descend vers 0. Au repos (regard 0, lid 1),
 * il est identique à <Eye />.
 */
export function LivingEye({
  side,
  gazeX,
  gazeY,
  lid,
}: {
  side: Side;
  gazeX: SharedValue<number>;
  gazeY: SharedValue<number>;
  lid: SharedValue<number>;
}) {
  const reach = GAZE_REACH[side];
  const pivot = (LID_PIVOT[side] / LOGO_EYES_VIEWBOX) * LOGO_SIZE;

  // scaleY s'écrase autour du centre : on recale pour garder le bas de l'œil fixe
  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (pivot - LOGO_SIZE / 2) * (1 - lid.value) }, { scaleY: lid.value }],
  }));
  const pupilStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: gazeX.value * reach }, { translateY: gazeY.value * reach * 0.7 }],
  }));

  // La pupille passe sous le contour : si elle touche le bord du creux, elle
  // glisse derrière au lieu de déborder.
  return (
    <Animated.View style={[StyleSheet.absoluteFill, lidStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, pupilStyle]}>
        <EyeLayer side={side} d={PUPIL[side]} />
      </Animated.View>
      <View style={StyleSheet.absoluteFill}>
        <EyeLayer side={side} d={RING} evenOdd />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  word: {
    position: 'absolute',
    width: WORD.width,
    height: WORD.height,
    left: -WORD.width / 2,
    top: LOCKUP.wordTop,
  },
  subtitle: {
    position: 'absolute',
    width: SUBTITLE.width,
    height: SUBTITLE.height,
    left: -SUBTITLE.width / 2,
    top: LOCKUP.subtitleTop,
  },
});
