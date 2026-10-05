/**
 * InkFigure — un grand chiffre à l'encre, avec son total derrière.
 *
 *    13 /16      le chiffre en dégradé d'encre (jamais d'aplat), le total plus
 *                petit, décalé, pâle et flouté
 *
 * La façon d'écrire un nombre de « Ma page » (`PageRuler`, qui l'anime quand on
 * tourne les pages) ; ici à l'arrêt, pour le compte des notes du carnet. Un
 * seul dessin du total fantôme : `GhostTotal` sert aux deux.
 */

import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, FeGaussianBlur, Filter, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../utils/constants';

/** L'encre du chiffre : plus claire en haut */
export const INK = ['#6b5546', colors.dark950] as const;

/*
  Mesures de Martian Grotesk Wide Bold (`fonts.displayHero`), en fraction de
  la taille du texte. Les boîtes du chiffre et du total en découlent : trop
  justes, le masque coupe le dessin (haut des chiffres, fin du « /624 »).
  - GLYPH_EM : la chasse de chaque signe ; la police n'a pas de chiffres à
    chasse fixe, un « 1 » est bien plus étroit qu'un « 4 »
  - LINE_EM : la hauteur de ligne de la police (ascendante 1 + descendante 0,2)
  - FOOTPRINT_EM : la place que le chiffre prend dans la mise en page ; la
    ligne déborde à parts égales au-dessus et au-dessous, l'encre reste centrée
*/
const GLYPH_EM: Record<string, number> = {
  '0': 0.807, '1': 0.566, '2': 0.728, '3': 0.739, '4': 0.819,
  '5': 0.766, '6': 0.789, '7': 0.691, '8': 0.753, '9': 0.789, '/': 0.53,
};
const LINE_EM = 1.2;
const FOOTPRINT_EM = 1.05;

/** La boîte du chiffre : assez haute pour la ligne, sans grandir dans la page */
export function figureBox(fontSize: number) {
  const lineHeight = Math.ceil(fontSize * LINE_EM);
  return {
    lineHeight,
    /** La ligne de base des chiffres, depuis le haut de la boîte (l'ascendante, 1 em) */
    baseline: fontSize,
    /** À poser sur la vue qui contient le chiffre */
    frame: { height: lineHeight, marginVertical: -Math.round((fontSize * (LINE_EM - FOOTPRINT_EM)) / 2) },
  };
}

/** La largeur de « 624 » ou « /624 » écrit en `fontSize` */
export function figureWidth(text: string, fontSize: number) {
  let em = 0;
  for (const c of text) em += GLYPH_EM[c] ?? 0.82;
  return Math.ceil(em * fontSize);
}

interface InkFigureProps {
  value: number;
  total: number;
  fontSize: number;
  /** Ce que VoiceOver lit, le chiffre seul ne dit pas de quoi il parle */
  accessibilityLabel: string;
}

export default function InkFigure({ value, total, fontSize, accessibilityLabel }: InkFigureProps) {
  const { lineHeight, frame, baseline } = figureBox(fontSize);
  const numberWidth = figureWidth(String(value), fontSize);
  const ghostSize = Math.round(fontSize * 0.72);
  return (
    <View
      style={[frame, { width: numberWidth + figureWidth(`/${total}`, ghostSize) }]}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <GhostTotal total={total} size={ghostSize} left={numberWidth * 0.7} baseline={baseline} />
      <MaskedView
        style={{ width: numberWidth, height: lineHeight }}
        maskElement={<Text style={[styles.number, { fontSize, lineHeight }]}>{value}</Text>}
      >
        <LinearGradient colors={INK} style={StyleSheet.absoluteFill} />
      </MaskedView>
    </View>
  );
}

/**
 * « / 624 » derrière le chiffre : plus petit, décalé, pâle et flouté.
 * Calé sur la ligne de base du chiffre (`baseline`), un peu plus bas que lui.
 */
export function GhostTotal({
  total,
  size,
  left,
  baseline,
}: {
  total: number;
  size: number;
  left: number;
  baseline: number;
}) {
  const label = `/${total}`;
  const blur = 3;
  const margin = blur * 4;
  const width = figureWidth(label, size) + margin * 2;
  const height = Math.round(size * 1.25) + margin * 2;
  // La ligne de base du total, un peu sous celle du chiffre
  const top = baseline + size * 0.12 - size;
  return (
    <View pointerEvents="none" style={[styles.ghost, { left: left - margin, top: top - margin }]}>
      <Svg width={width} height={height}>
        <Defs>
          <Filter id="ghostBlur" x="-20%" y="-20%" width="140%" height="140%">
            <FeGaussianBlur stdDeviation={blur} />
          </Filter>
        </Defs>
        <SvgText
          x={margin}
          y={margin + size}
          fontFamily={fonts.displayHero}
          fontSize={size}
          fill={colors.textPrimary}
          fillOpacity={0.16}
          filter="url(#ghostBlur)"
        >
          {label}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  number: {
    fontFamily: fonts.displayHero,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    padding: 0,
  },
  ghost: {
    position: 'absolute',
  },
});
