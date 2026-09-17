/**
 * Composant RibbonBookmark
 *
 * Un signet en ruban, brodé, qui sort du haut du livre et pend devant la
 * couverture, bout coupé en V, surpiqûre sur tout le tour :
 *
 *     ┌─────────┐  ┌─────────┐  ┌─────────┐
 *     │┆       ┆│  │┆▓▓▓▓▓▓▓┆│  │┆       ┆│
 *     │┆       ┆│  │┆▓▓▓▓▓▓▓┆│  │┆   ✦   ┆│
 *     │┆   ✓   ┆│  │┆       ┆│  │┆       ┆│
 *     └──╲ ╱──┘   └──╲ ╱──┘   └──╲ ╱──┘
 *      terminé      en cours     nouveau
 *
 * - `done`    : ruban lie de vin, coche brodée crème ;
 * - `reading` : ruban écru que le lie de vin remplit depuis le haut, à mon % —
 *               à 100 %, c'est le ruban « terminé » ;
 * - `new`     : ruban écru, étincelle brodée lie de vin (dernier livre ajouté).
 *
 * Les images sont calculées par scripts/generate-ribbon-bookmarks.py (tissu,
 * broderie en relief, ombre portée) : c'est ce qui les rend réalistes. Pour une
 * nouvelle variante, l'ajouter au script plutôt que de dessiner un ruban ici.
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const RIBBONS = {
  done: require('../../assets/images/ribbons/ribbon-done.png'),
  new: require('../../assets/images/ribbons/ribbon-new.png'),
  track: require('../../assets/images/ribbons/ribbon-progress-track.png'),
  fill: require('../../assets/images/ribbons/ribbon-progress-fill.png'),
};

/** Taille de l'image, ombre comprise, et bornes du ruban (CANVAS_*, TOP, TAIL_END du script) */
const WIDTH = 34;
const HEIGHT = 66;
const RIBBON_TOP = 1.5;
const RIBBON_END = 60;
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

export default function RibbonBookmark(props: RibbonBookmarkProps) {
  if (props.kind !== 'reading') {
    return <Image source={RIBBONS[props.kind]} style={styles.ribbon} contentFit="contain" />;
  }

  const percent = Math.min(100, Math.max(MIN_FILL_PERCENT, props.percent));
  const fillHeight = RIBBON_TOP + ((RIBBON_END - RIBBON_TOP) * percent) / 100;

  return (
    <View style={styles.ribbon}>
      <Image source={RIBBONS.track} style={StyleSheet.absoluteFill} contentFit="contain" />
      {/* Le lie de vin, coupé à mon % : même tissu, même surpiqûre, calés au pixel */}
      <View style={[styles.fill, { height: fillHeight }]}>
        <Image source={RIBBONS.fill} style={styles.ribbon} contentFit="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    width: WIDTH,
    height: HEIGHT,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WIDTH,
    overflow: 'hidden',
  },
});
