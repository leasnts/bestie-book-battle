/**
 * BookSpine — la tranche du livre, pleine largeur, en tête de la fiche.
 *
 *    ┌─────────────────────────────────────────┐
 *    │ ‖  Les nuits blanches     DOSTOÏEVSKI ‖ │   ← toile chocolat, titre crème
 *    └─────────────────────────────────────────┘
 *
 * Dans nos couleurs, pas dans celles de la couverture : les tuiles lie de vin
 * et chocolat de la fiche juraient avec les teintes de chaque livre. Crème sur
 * le chocolat : 8,8:1 au plus clair du dégradé.
 *
 * Pour qu'on y croie, cinq couches par-dessus le dégradé :
 * - le **grain** du papier de l'app, en multiply (seuls les points foncés
 *   marquent, le blanc disparaît) ;
 * - une **trame de toile**, de fins traits verticaux, comme une reliure ;
 * - le **volume** : le dos est arrondi, reflet en haut, ombre en bas ;
 * - les **bouts** plus sombres, là où le dos tourne vers les plats ;
 * - le titre **frappé** dans la toile (ombre portée d'un pixel).
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import {
  borderRadius,
  colors,
  fonts,
  inkGradient,
  shadowAlpha,
  shadows,
} from '../../utils/constants';

interface BookSpineProps {
  title: string;
  author: string | null;
}

const INK = colors.white;

// Le titre frappé dans la toile : un creux, donc une ombre sombre au-dessus
const STAMP = {
  textShadowColor: shadowAlpha(0.45),
  textShadowOffset: { width: 0, height: -1 },
  textShadowRadius: 0.5,
};

export default function BookSpine({ title, author }: BookSpineProps) {
  return (
    <View style={styles.spine} accessible accessibilityRole="header" accessibilityLabel={title}>
      <View style={styles.clip}>
        <LinearGradient
          colors={inkGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <Image source={GRAIN} style={styles.grain} contentFit="cover" />
        <Weave />
        {/* Volume : le dos est bombé */}
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.10)',
            'rgba(255,255,255,0.38)',
            'rgba(255,255,255,0)',
            shadowAlpha(0.12),
            shadowAlpha(0.34),
          ]}
          locations={[0, 0.2, 0.5, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Les bouts tournent vers les plats */}
        <LinearGradient
          colors={[shadowAlpha(0.28), 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', shadowAlpha(0.28)]}
          locations={[0, 0.04, 0.96, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.band, styles.bandLeft, { borderColor: INK }]} />
        <View style={[styles.band, styles.bandRight, { borderColor: INK }]} />
      </View>

      {/* Titre long : il passe sur deux lignes, puis rétrécit, sans jamais déborder */}
      <Text
        style={[styles.title, { color: INK }, STAMP]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {title}
      </Text>
      {!!author && (
        <Text
          style={[styles.author, { color: INK }, STAMP]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {lastName(author)}
        </Text>
      )}
    </View>
  );
}

/** Sur une tranche, on imprime le nom de famille */
function lastName(author: string) {
  const parts = author.trim().split(/\s+/);
  return parts[parts.length - 1];
}

const GRAIN = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

/** La toile de reliure : un fil clair, un fil sombre, tous les 3 pt */
function Weave() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="weave" width={3} height={4} patternUnits="userSpaceOnUse">
          <Line x1={0.5} y1={0} x2={0.5} y2={4} stroke="#fff" strokeOpacity={0.04} strokeWidth={1} />
          <Line x1={2} y1={0} x2={2} y2={4} stroke="#000" strokeOpacity={0.03} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#weave)" />
    </Svg>
  );
}

const SPINE_HEIGHT = 64;

const styles = StyleSheet.create({
  spine: {
    height: SPINE_HEIGHT,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
    ...shadows.cardSelected,
  },
  /** Les couches restent dans les coins ; l'ombre, elle, vit sur `spine` */
  clip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    mixBlendMode: 'multiply',
  },
  /** Les filets de la reliure, près de chaque bout */
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    opacity: 0.35,
  },
  bandLeft: {
    left: 22,
  },
  bandRight: {
    right: 22,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 25,
  },
  /** Un nom très long est coupé, il ne pousse pas le titre */
  author: {
    flexShrink: 1,
    maxWidth: '38%',
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
});
