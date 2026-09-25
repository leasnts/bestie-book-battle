/**
 * BookSpine — la tranche du livre, pleine largeur, en tête de la fiche.
 *
 *    ┌─────────────────────────────────────────┐
 *    │ ‖  Les nuits blanches     DOSTOÏEVSKI ‖ │   ← aux couleurs de sa couverture
 *    └─────────────────────────────────────────┘
 *
 * Pour qu'on y croie, cinq couches par-dessus le dégradé de la couverture :
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
import { colors, fonts, shadowAlpha, shadows } from '../../utils/constants';
import { FALLBACK_PALETTE, type CoverPalette } from '../../utils/coverPalette';

interface BookSpineProps {
  title: string;
  author: string | null;
  palette: CoverPalette | null;
}

export default function BookSpine({ title, author, palette }: BookSpineProps) {
  const [main, second, third] = palettePair(palette);
  const ink = isLight(main) ? colors.textPrimary : colors.white;

  // Le titre frappé : un creux, donc une ombre claire sous une encre foncée,
  // une ombre sombre sous un titre crème
  const stamp = isLight(main)
    ? { textShadowColor: 'rgba(255,255,255,0.45)', textShadowOffset: { width: 0, height: 1 } }
    : { textShadowColor: shadowAlpha(0.45), textShadowOffset: { width: 0, height: -1 } };

  return (
    <View style={styles.spine} accessible accessibilityRole="header" accessibilityLabel={title}>
      <View style={styles.clip}>
        <LinearGradient
          colors={[main, second]}
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
      </View>

      <View style={[styles.band, styles.bandLeft, { borderColor: ink }]} />
      <View style={[styles.band, styles.bandRight, { borderColor: ink }]} />

      <Text
        style={[styles.title, { color: ink }, stamp, styles.stampRadius]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </Text>
      {!!author && (
        <Text style={[styles.author, { color: ink }, stamp, styles.stampRadius]} numberOfLines={1}>
          {lastName(author)}
        </Text>
      )}
    </View>
  );
}

/** Trois teintes, en complétant avec le repli si la couverture en a moins */
function palettePair(palette: CoverPalette | null): [string, string, string] {
  const p = palette && palette.length > 0 ? palette : FALLBACK_PALETTE;
  return [p[0], p[1] ?? p[0], p[2] ?? p[1] ?? p[0]];
}

/** Clair ou foncé, pour écrire en encre ou en crème sur la tranche */
function isLight(hex: string) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
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
          <Line x1={0.5} y1={0} x2={0.5} y2={4} stroke="#fff" strokeOpacity={0.08} strokeWidth={1} />
          <Line x1={2} y1={0} x2={2} y2={4} stroke="#000" strokeOpacity={0.06} strokeWidth={1} />
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
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    ...shadows.cardSelected,
  },
  /** Les couches restent dans les coins ; l'ombre, elle, vit sur `spine` */
  clip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 5,
    overflow: 'hidden',
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
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
    left: 14,
  },
  bandRight: {
    right: 14,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 23,
  },
  author: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  stampRadius: {
    textShadowRadius: 0.5,
  },
});
