/**
 * BookSpine — la tranche du livre, couché sur une pile, en tête de la fiche.
 *
 *        ┌──────────────────────────────────┐
 *        │ ‖  Les nuits blanches   DOSTO… ‖ │   ← le livre, aux couleurs de sa couverture
 *        └──────────────────────────────────┘
 *     ┌─────────────────────────────────────┐    ← un autre livre dessous, plus sage
 *     └─────────────────────────────────────┘
 *
 * Les couleurs viennent de la couverture (cover_palette) : dégradé le long du
 * dos, jamais d'aplat, avec un reflet en haut et une ombre en bas pour le
 * volume, et deux filets près des bords comme sur une reliure.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
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

  return (
    <View style={styles.stack} accessible accessibilityRole="header" accessibilityLabel={title}>
      {/* ── Le livre du dessus : celui-ci ── */}
      <View style={styles.spine}>
        <LinearGradient
          colors={[main, second]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fill}
        />
        {/* Volume : reflet en haut, ombre en bas */}
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)', shadowAlpha(0.22)]}
          locations={[0, 0.45, 1]}
          style={styles.fill}
        />
        <View style={[styles.band, styles.bandLeft, { borderColor: ink }]} />
        <View style={[styles.band, styles.bandRight, { borderColor: ink }]} />

        <Text style={[styles.title, { color: ink }]} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
        {!!author && (
          <Text style={[styles.author, { color: ink }]} numberOfLines={1}>
            {lastName(author)}
          </Text>
        )}
      </View>

      {/* ── Le livre du dessous ── */}
      <View style={styles.under}>
        <LinearGradient
          colors={[third, main]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fill}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', shadowAlpha(0.3)]}
          style={styles.fill}
        />
      </View>
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

const SPINE_HEIGHT = 58;

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
  },
  spine: {
    width: '92%',
    height: SPINE_HEIGHT,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 30,
    zIndex: 1,
    ...shadows.cardSelected,
  },
  under: {
    width: '100%',
    height: 26,
    marginTop: -2,
    borderRadius: 5,
    transform: [{ rotate: '-1deg' }],
    ...shadows.xs,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
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
    left: 12,
  },
  bandRight: {
    right: 12,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  author: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
});
