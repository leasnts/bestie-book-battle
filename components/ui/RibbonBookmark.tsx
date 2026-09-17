/**
 * Composant RibbonBookmark
 *
 * Un signet en ruban, brodé, qui sort du haut du livre, passe par-dessus le bord
 * de la couverture et pend devant elle :
 *
 *        ▄▄▄       ← le pli, au-dessus du bord
 *     ┌──███──┐
 *     │  ███  │    gros-grain, bout coupé en V
 *     │  █✓█  │    motif brodé au point passé
 *     │  ▀ ▀  │
 *
 * - `done` : ruban noyer, coche brodée crème — livre terminé ;
 * - `new`  : ruban sable, étincelle brodée noyer — dernier livre ajouté.
 *
 * Les images sont calculées par scripts/generate-ribbon-bookmarks.py (tissu,
 * broderie en relief, ombre portée) : c'est ce qui les rend réalistes. Pour une
 * nouvelle variante, l'ajouter au script plutôt que de dessiner un ruban ici.
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet } from 'react-native';

const RIBBONS = {
  done: require('../../assets/images/ribbons/ribbon-done.png'),
  new: require('../../assets/images/ribbons/ribbon-new.png'),
};

/** Taille de l'image, ombre comprise (cf. CANVAS_W / CANVAS_H du script) */
const WIDTH = 34;
const HEIGHT = 66;
/** Hauteur du pli au-dessus du bord de la couverture (COVER_TOP du script) */
export const RIBBON_ABOVE_COVER = 9;

export default function RibbonBookmark({ kind }: { kind: keyof typeof RIBBONS }) {
  return <Image source={RIBBONS[kind]} style={styles.ribbon} contentFit="contain" />;
}

const styles = StyleSheet.create({
  ribbon: {
    width: WIDTH,
    height: HEIGHT,
  },
});
