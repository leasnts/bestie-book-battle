/**
 * TEMP-ESSAI — la progression en tranche de livre, vue en perspective.
 *
 *     ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁      ← couverture du dessus (toile chocolat)
 *    ┃▌▌▌▌▌▌▌▌▌▌│││││││││││││││││││      ← la tranche : pages lues teintées,
 *    ┃▌▌▌▌▌▌▌▌▌▌││││││││││││││││ ╱          plus haute devant, plus basse au fond
 *     ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
 *             ▼ toi  ▽ club                ← les marque-pages qui dépassent
 *
 * On en garde une version, le reste de ce fichier disparaît.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import {
  accentGradient,
  borderRadius,
  colors,
  fonts,
  inkGradient,
  shadows,
  spacing,
} from '../../utils/constants';
import { CLUB_GRADIENT } from './GoalTrack';

interface TrialProps {
  myPercent: number;
  clubPercent: number;
}

const clamp = (p: number) => Math.max(0, Math.min(100, p));

export default function ProgressTrials(props: TrialProps) {
  return (
    <View style={styles.list}>
      <View style={styles.tile}>
        <Text style={styles.kicker}>Essai · tranche en perspective</Text>
        <PageEdge {...props} />
        <LegendRow {...props} />
      </View>
    </View>
  );
}

function LegendRow({ myPercent, clubPercent }: TrialProps) {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: accentGradient[0] }]} />
        <Text style={styles.legendLabel}>Toi</Text>
        <Text style={styles.legendValue}>{Math.round(myPercent)} %</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: CLUB_GRADIENT[1] }]} />
        <Text style={styles.legendLabel}>Club</Text>
        <Text style={styles.legendValue}>{Math.round(clubPercent)} %</Text>
      </View>
    </View>
  );
}

// ─── La tranche ────────────────────────────────────────────────────

const HEIGHT = 112;
/** Nombre de feuillets dessinés sur la tranche */
const PAGES = 110;
/** Hauteur de la tranche devant (à gauche) et au fond (à droite) */
const NEAR = 58;
const FAR = 40;
/** Épaisseur d'une couverture, devant */
const BOARD = 7;
/** La tranche est un peu creusée au milieu, comme sur un vrai livre */
const SAG = 3;
/** Perspective : les pages se serrent vers le fond */
const DEPTH = 0.9;
/** Où finit la tranche (le reste en bas : les marque-pages qui dépassent) */
const CENTER_Y = 46;

/** 0 → 1 le long du livre, compressé vers le fond */
function warp(u: number) {
  return (u * (1 + DEPTH)) / (1 + DEPTH * u);
}

function PageEdge({ myPercent, clubPercent }: TrialProps) {
  const [width, setWidth] = useState(0);
  const w = width;

  // La tranche, point par point : hauteur qui diminue au fond, bords creusés
  const edgeAt = (u: number) => {
    const h = NEAR + (FAR - NEAR) * u;
    const sag = SAG * Math.sin(Math.PI * u);
    return { top: CENTER_Y - h / 2 + sag, bottom: CENTER_Y + h / 2 - sag };
  };
  const xAt = (u: number) => 2 + (w - 4) * warp(u);

  const curve = (side: 'top' | 'bottom', offset = 0) => {
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      pts.push(`${xAt(u).toFixed(1)} ${(edgeAt(u)[side] + offset).toFixed(1)}`);
    }
    return pts;
  };

  // Couverture du dessus : une bande sombre qui suit le haut de la tranche
  const boardTop = () => {
    const top = curve('top', -BOARD);
    const bottom = curve('top').reverse();
    return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`;
  };
  const boardBottom = () => {
    const top = curve('bottom');
    const bottom = curve('bottom', BOARD).reverse();
    return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`;
  };
  const block = () => {
    const top = curve('top');
    const bottom = curve('bottom').reverse();
    return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`;
  };

  const read = Math.round((clamp(myPercent) / 100) * PAGES);

  /** Un marque-page qui dépasse sous la couverture, à `percent` */
  const ribbon = (percent: number, length: number, ribbonWidth: number) => {
    const u = clamp(percent) / 100;
    const x = xAt(u);
    const y = edgeAt(u).bottom + BOARD - 2;
    const half = ribbonWidth / 2;
    // Bout fendu en V
    return `M ${x - half} ${y} L ${x + half} ${y} L ${x + half} ${y + length} L ${x} ${y + length - 5} L ${x - half} ${y + length} Z`;
  };

  return (
    <View style={styles.edge} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={HEIGHT}>
          <Defs>
            <LinearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#fbf7f0" />
              <Stop offset="0.55" stopColor="#f1e9dc" />
              <Stop offset="1" stopColor="#ddd1bf" />
            </LinearGradient>
            <LinearGradient id="board" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={inkGradient[0]} />
              <Stop offset="1" stopColor={inkGradient[1]} />
            </LinearGradient>
            <LinearGradient id="depth" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#000" stopOpacity={0} />
              <Stop offset="1" stopColor="#000" stopOpacity={0.12} />
            </LinearGradient>
            <ClipPath id="blockClip">
              <Path d={block()} />
            </ClipPath>
            <LinearGradient id="readTint" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accentGradient[0]} stopOpacity={0.22} />
              <Stop offset="1" stopColor={accentGradient[1]} stopOpacity={0.42} />
            </LinearGradient>
            <LinearGradient id="ribbonMe" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accentGradient[0]} />
              <Stop offset="1" stopColor={accentGradient[1]} />
            </LinearGradient>
            <LinearGradient id="ribbonClub" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={CLUB_GRADIENT[0]} />
              <Stop offset="1" stopColor={CLUB_GRADIENT[1]} />
            </LinearGradient>
          </Defs>

          {/* Les marque-pages passent derrière la couverture du dessous */}
          <Path d={ribbon(clubPercent, 30, 7)} fill="url(#ribbonClub)" />
          <Path d={ribbon(myPercent, 40, 9)} fill="url(#ribbonMe)" />

          {/* Le bloc de pages */}
          <Path d={block()} fill="url(#paper)" />
          {/* Les pages lues : une tranche teintée, comme peinte */}
          <Rect
            x={0}
            y={0}
            width={xAt(clamp(myPercent) / 100)}
            height={HEIGHT}
            fill="url(#readTint)"
            clipPath="url(#blockClip)"
          />
          <G>
            {Array.from({ length: PAGES }, (_, i) => {
              const u = (i + 0.5) / PAGES;
              const x = xAt(u);
              const { top, bottom } = edgeAt(u);
              const isRead = i < read;
              return (
                <Line
                  key={i}
                  x1={x}
                  y1={top + 1}
                  x2={x}
                  y2={bottom - 1}
                  stroke={isRead ? (i % 3 === 0 ? accentGradient[1] : accentGradient[0]) : '#000'}
                  strokeOpacity={isRead ? 0.55 + (i % 2) * 0.2 : 0.07 + (i % 3) * 0.03}
                  strokeWidth={0.7 * (1 - 0.35 * u)}
                />
              );
            })}
          </G>
          {/* Le fond s'assombrit un peu : il s'éloigne */}
          <Path d={block()} fill="url(#depth)" />

          {/* Les couvertures */}
          <Path d={boardTop()} fill="url(#board)" />
          <Path d={boardBottom()} fill="url(#board)" />
        </Svg>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  tile: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.xs,
  },
  kicker: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  edge: {
    height: HEIGHT,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  legendValue: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
