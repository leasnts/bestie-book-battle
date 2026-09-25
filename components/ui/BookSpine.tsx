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
import { borderRadius, colors, fonts, shadowAlpha, shadows } from '../../utils/constants';
import { FALLBACK_PALETTE, type CoverPalette } from '../../utils/coverPalette';

interface BookSpineProps {
  title: string;
  author: string | null;
  palette: CoverPalette | null;
}

export default function BookSpine({ title, author, palette }: BookSpineProps) {
  const { ink, main, second } = readableSpine(palettePair(palette));
  const darkInk = ink === colors.textPrimary;

  // Le titre frappé : un creux, donc une ombre claire sous une encre foncée,
  // une ombre sombre sous un titre crème
  const stamp = darkInk
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
        <View style={[styles.band, styles.bandLeft, { borderColor: ink }]} />
        <View style={[styles.band, styles.bandRight, { borderColor: ink }]} />
      </View>

      {/* Titre long : il passe sur deux lignes, puis rétrécit, sans jamais déborder */}
      <Text
        style={[styles.title, { color: ink }, stamp, styles.stampRadius]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {title}
      </Text>
      {!!author && (
        <Text
          style={[styles.author, { color: ink }, stamp, styles.stampRadius]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {lastName(author)}
        </Text>
      )}
    </View>
  );
}

/** Deux teintes, en complétant avec le repli si la couverture en a moins */
function palettePair(palette: CoverPalette | null): [string, string] {
  const p = palette && palette.length > 0 ? palette : FALLBACK_PALETTE;
  return [p[0], p[1] ?? p[0]];
}

// ─── Contraste ─────────────────────────────────────────────────────

/** Contraste minimal du texte sur toute la tranche (WCAG AA, texte normal) */
const MIN_CONTRAST = 4.5;

/**
 * L'encre la plus lisible sur les DEUX bouts du dégradé (le titre peut
 * tomber sur l'un comme sur l'autre), puis, si ça ne suffit pas, chaque
 * teinte est éclaircie (encre foncée) ou assombrie (crème) jusqu'à 4,5:1.
 */
function readableSpine([a, b]: [string, string]) {
  const inks = [colors.textPrimary, colors.white];
  const score = (ink: string) => Math.min(contrast(ink, a), contrast(ink, b));
  const ink = score(inks[0]) >= score(inks[1]) ? inks[0] : inks[1];
  const toward = ink === colors.textPrimary ? '#ffffff' : '#000000';
  const fix = (hex: string) => {
    let out = hex;
    for (let step = 1; contrast(ink, out) < MIN_CONTRAST && step <= 12; step++) {
      out = mix(hex, toward, step * 0.07);
    }
    return out;
  };
  return { ink, main: fix(a), second: fix(b) };
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(hex: string, toward: string, t: number) {
  const [r1, g1, b1] = rgb(hex);
  const [r2, g2, b2] = rgb(toward);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(x: string, y: string) {
  const [hi, lo] = [luminance(x), luminance(y)].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
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
  stampRadius: {
    textShadowRadius: 0.5,
  },
});
