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

interface InkFigureProps {
  value: number;
  total: number;
  fontSize: number;
  /** Ce que VoiceOver lit, le chiffre seul ne dit pas de quoi il parle */
  accessibilityLabel: string;
}

export default function InkFigure({ value, total, fontSize, accessibilityLabel }: InkFigureProps) {
  const lineHeight = Math.round(fontSize * 1.05);
  const numberWidth = Math.round(String(value).length * fontSize * 0.6);
  const ghostSize = Math.round(fontSize * 0.72);
  return (
    <View
      style={{ height: lineHeight, width: numberWidth + ghostSize * (String(total).length + 1) * 0.6 }}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <GhostTotal total={total} size={ghostSize} left={numberWidth * 0.7} />
      <MaskedView
        style={{ width: numberWidth, height: lineHeight }}
        maskElement={<Text style={[styles.number, { fontSize, lineHeight }]}>{value}</Text>}
      >
        <LinearGradient colors={INK} style={StyleSheet.absoluteFill} />
      </MaskedView>
    </View>
  );
}

/** « / 624 » derrière le chiffre : plus petit, décalé, pâle et flouté */
export function GhostTotal({ total, size, left }: { total: number; size: number; left: number }) {
  const label = `/${total}`;
  const blur = 3;
  const margin = blur * 4;
  const width = Math.round(label.length * size * 0.58) + margin * 2;
  const height = Math.round(size * 1.25) + margin * 2;
  return (
    <View pointerEvents="none" style={[styles.ghost, { left: left - margin, top: size * 0.3 - margin }]}>
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
