/**
 * Composant WatercolorCorner
 *
 * Un lavis d'aquarelle léger dans le coin haut droit d'un sheet, qui passe SOUS
 * le bouton en verre de la barre : sans rien de coloré derrière lui, le verre ne
 * se voit pas (DESIGN.md › Direction artistique).
 *
 *    ┌───────────────────────── ░░▒▒░┐
 *    │ Mes lectures          ░▒( + )▒░│
 *    │ Trier par ⌄             ░▒▒░░  │
 *
 * Deux textures superposables (assets/images/watercolor/corner-*.png, générées
 * par scripts/generate-watercolor.py), blanches : l'app les teinte avec deux
 * couleurs et les mêle en `multiply`. Tons neutres par défaut ; les couleurs d'une
 * couverture seulement sur un écran qui parle de ce livre (`coverWash`, cf.
 * utils/watercolor.ts). Le lavis déborde du sheet, qui le coupe
 * net à son bord, comme une feuille posée sur une tache.
 *
 * Placement : à rendre APRÈS la liste de l'écran, en frère, jamais avant ni avec
 * un `zIndex` négatif. iOS cherche la liste en suivant le premier enfant de
 * l'écran ; placée devant elle dans cet ordre, la tache lui fait perdre sa marge
 * sous la barre de navigation.
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NEUTRAL_WASH, type WashTints } from '../../utils/watercolor';

const WASH = require('../../assets/images/watercolor/corner-wash.png');
const BLEED = require('../../assets/images/watercolor/corner-bleed.png');

/** Taille du lavis (ratio des textures 720 × 560) et débordement hors du sheet */
const WIDTH = 250;
const HEIGHT = Math.round((WIDTH * 560) / 720);
const OVERFLOW_RIGHT = 64;
/** Assez haut pour que le lavis s'arrête avant la première étagère */
const OVERFLOW_TOP = 62;

/** Opacité des deux couches : léger, le lavis ne doit jamais devenir le sujet */
const WASH_OPACITY = 0.85;
const BLEED_OPACITY = 0.75;

export default function WatercolorCorner({ tints = NEUTRAL_WASH }: { tints?: WashTints }) {
  const [first, second] = tints;

  return (
    <View style={styles.corner} pointerEvents="none">
      <View style={[styles.layer, { opacity: WASH_OPACITY }]}>
        <Image source={WASH} tintColor={first} contentFit="fill" style={StyleSheet.absoluteFill} />
      </View>
      <View style={[styles.layer, { opacity: BLEED_OPACITY }]}>
        <Image source={BLEED} tintColor={second} contentFit="fill" style={StyleSheet.absoluteFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    top: -OVERFLOW_TOP,
    right: -OVERFLOW_RIGHT,
    width: WIDTH,
    height: HEIGHT,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    mixBlendMode: 'multiply',
  },
});
