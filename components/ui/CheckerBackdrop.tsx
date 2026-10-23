/**
 * CheckerBackdrop — un damier ton sur ton sur les couleurs de la charte.
 *
 *    ┌───────────────────────────────┐
 *    │ beurre ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ rouge   │   ← grandes taches qui se mêlent
 *    │ ▚▚▚▚▚▚▚▚▚ (beurre → rouge) ▚▚ │      (dégradé en maillage)
 *    │ chocolat ▚▚▚▚▚▚▚▚▚▚ rouge fcé │   ← une case sur deux un peu plus
 *    └···························· ──┘      sombre, l'autre un peu plus claire
 *
 * Derrière l'en-tête du profil (inspi Basta, Lea 2026-10-23). Beurre, rouge et
 * chocolat Lowki en taches, sans beige. Le damier n'ajoute aucune couleur : il
 * fonce ou éclaircit ce qu'il y a dessous, donc il reste ton sur ton partout.
 *
 * - Taches en `radial-gradient` (`experimental_backgroundImage`), comme
 *   `DriftingBackdrop` : pas d'image.
 * - Damier en motif SVG (`Pattern`), qui se répète tout seul.
 * - Bord du bas cousu (`StitchLine`), comme une pièce de tissu.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Pattern, Rect } from 'react-native-svg';
import { creamAlpha, lowki } from '../../utils/constants';
import { StitchLine } from './Stitch';

/** Côté d'une case du damier */
const CELL = 22;

/** Les taches : beurre en haut à gauche, rouge en haut à droite, chocolat et rouge foncé en bas */
const WASH = [
  `radial-gradient(60% 55% at 12% 10%, ${lowki.butter.light} 0%, rgba(245,230,168,0) 70%)`,
  `radial-gradient(55% 55% at 92% 8%, ${lowki.red.light} 0%, rgba(166,47,67,0) 72%)`,
  `radial-gradient(60% 55% at 8% 95%, ${lowki.chocolate.light} 0%, rgba(99,61,50,0) 72%)`,
  `radial-gradient(60% 55% at 95% 92%, ${lowki.red.dark} 0%, rgba(124,32,49,0) 72%)`,
  `linear-gradient(180deg, ${lowki.butter.dark}, ${lowki.red.light})`,
].join(', ');

export default function CheckerBackdrop() {
  return (
    <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: WASH }]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Pattern id="checker" width={CELL * 2} height={CELL * 2} patternUnits="userSpaceOnUse">
          <Rect width={CELL} height={CELL} fill="rgba(46,27,22,0.10)" />
          <Rect x={CELL} y={CELL} width={CELL} height={CELL} fill="rgba(46,27,22,0.10)" />
          <Rect x={CELL} width={CELL} height={CELL} fill="rgba(255,255,255,0.06)" />
          <Rect y={CELL} width={CELL} height={CELL} fill="rgba(255,255,255,0.06)" />
        </Pattern>
        <Rect width="100%" height="100%" fill="url(#checker)" />
      </Svg>
      <StitchLine color={creamAlpha(0.6)} style={styles.seam} />
    </View>
  );
}

const styles = StyleSheet.create({
  seam: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 4,
  },
});
