/**
 * TEMP-ESSAI — trois idées de progression « page de livre », à comparer dans
 * la fiche du livre. On en garde une, le reste de ce fichier disparaît.
 *
 * A. Livre ouvert : deux pages, le tas de gauche (lu) grossit, celui de droite
 *    (à lire) fond ; un marque-page pour moi, un pour le club.
 * B. Tranche : le bloc de pages vu de côté, fines pages colorées jusqu'à ma
 *    page, un repère pour le club.
 * C. Page cornée : une page réglée qui se remplit ligne à ligne jusqu'à mon %,
 *    coin corné, le club noté dans la marge.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  accentGradient,
  borderRadius,
  colors,
  fonts,
  inkAlpha,
  shadowAlpha,
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
      <Trial title="A · Livre ouvert">
        <OpenBook {...props} />
      </Trial>
      <Trial title="B · Tranche">
        <PageBlock {...props} />
      </Trial>
      <Trial title="C · Page cornée">
        <RuledPage {...props} />
      </Trial>
    </View>
  );
}

function Trial({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.kicker}>{title}</Text>
      {children}
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

// ─── A. Livre ouvert ───────────────────────────────────────────────

/** Nombre maximal de feuillets dessinés sur le bord d'un tas */
const STACK_MAX = 10;

function OpenBook({ myPercent, clubPercent }: TrialProps) {
  const read = Math.round((clamp(myPercent) / 100) * STACK_MAX);
  const left = Math.max(1, read);
  const right = Math.max(1, STACK_MAX - read);
  return (
    <>
      <View style={styles.bookWrap}>
        <View style={styles.book}>
          {/* Page de gauche : le lu, feuillets empilés sur le bord */}
          <View style={[styles.page, styles.pageLeft]}>
            <LinearGradient
              colors={['#fbf8f3', '#efe8dd']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.stack, styles.stackLeft]}>
              {Array.from({ length: left }, (_, i) => (
                <View key={i} style={[styles.leaf, { left: i * 1.6, top: 4 + i * 0.6 }]} />
              ))}
            </View>
            <Text style={styles.pageNote}>lu</Text>
          </View>
          {/* Le pli */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', shadowAlpha(0.16), 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gutter}
          />
          {/* Page de droite : ce qui reste */}
          <View style={[styles.page, styles.pageRight]}>
            <LinearGradient
              colors={['#efe8dd', '#fbf8f3']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.stack, styles.stackRight]}>
              {Array.from({ length: right }, (_, i) => (
                <View key={i} style={[styles.leaf, { right: i * 1.6, top: 4 + i * 0.6 }]} />
              ))}
            </View>
            <Text style={[styles.pageNote, styles.pageNoteRight]}>à lire</Text>
          </View>
        </View>
        {/* Les marque-pages, posés à leur % sur toute la largeur du livre */}
        <Ribbon percent={clubPercent} colors={CLUB_GRADIENT} short />
        <Ribbon percent={myPercent} colors={accentGradient} />
      </View>
      <LegendRow myPercent={myPercent} clubPercent={clubPercent} />
    </>
  );
}

function Ribbon({
  percent,
  colors: ribbon,
  short = false,
}: {
  percent: number;
  colors: readonly [string, string];
  short?: boolean;
}) {
  return (
    <View style={[styles.ribbon, short && styles.ribbonShort, { left: `${clamp(percent)}%` }]}>
      <LinearGradient colors={ribbon} style={StyleSheet.absoluteFill} />
    </View>
  );
}

// ─── B. Tranche ────────────────────────────────────────────────────

const PAGE_LINES = 60;

function PageBlock({ myPercent, clubPercent }: TrialProps) {
  const mine = Math.round((clamp(myPercent) / 100) * PAGE_LINES);
  return (
    <>
      <View style={styles.block}>
        <LinearGradient
          colors={['#f7f2ea', '#ece3d6']}
          style={[StyleSheet.absoluteFill, styles.blockRadius]}
        />
        <View style={styles.blockLines}>
          {Array.from({ length: PAGE_LINES }, (_, i) => (
            <View
              key={i}
              style={[
                styles.blockLine,
                i < mine && { backgroundColor: i % 2 ? accentGradient[1] : accentGradient[0] },
              ]}
            />
          ))}
        </View>
        {/* Reliure en haut et en bas du bloc */}
        <View style={[styles.blockBand, styles.blockBandTop]} />
        <View style={[styles.blockBand, styles.blockBandBottom]} />
      </View>
      {/* Le club, repéré sous le bloc */}
      <View style={styles.markerRow}>
        <View style={[styles.marker, { left: `${clamp(clubPercent)}%` }]} />
      </View>
      <LegendRow myPercent={myPercent} clubPercent={clubPercent} />
    </>
  );
}

// ─── C. Page cornée ────────────────────────────────────────────────

const RULED_LINES = 6;

function RuledPage({ myPercent, clubPercent }: TrialProps) {
  // Mon % se lit comme un texte : lignes pleines, puis la ligne en cours
  const written = (clamp(myPercent) / 100) * RULED_LINES;
  const clubLine = Math.min(RULED_LINES - 1, Math.floor((clamp(clubPercent) / 100) * RULED_LINES));
  return (
    <>
      <View style={styles.sheet}>
        <LinearGradient colors={['#fdfbf7', '#f3ede3']} style={[StyleSheet.absoluteFill, styles.sheetRadius]} />
        {/* La marge, comme une copie */}
        <View style={styles.margin} />
        {Array.from({ length: RULED_LINES }, (_, i) => {
          const fill = Math.max(0, Math.min(1, written - i));
          return (
            <View key={i} style={styles.ruledLine}>
              {i === clubLine && <View style={styles.clubTick} />}
              <View style={styles.rule} />
              {fill > 0 && (
                <LinearGradient
                  colors={accentGradient}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.ink, { width: `${fill * 100}%` }]}
                />
              )}
            </View>
          );
        })}
        {/* Le coin corné */}
        <View style={styles.dogEar}>
          <LinearGradient
            colors={['#e6dccd', '#fdfbf7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
      <LegendRow myPercent={myPercent} clubPercent={clubPercent} />
    </>
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

  // A
  bookWrap: {
    height: 92,
  },
  book: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 6,
    ...shadows.cardSelected,
  },
  page: {
    flex: 1,
    overflow: 'hidden',
  },
  pageLeft: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 10,
  },
  pageRight: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 10,
  },
  gutter: {
    position: 'absolute',
    left: '46%',
    width: '8%',
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  stack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 24,
  },
  stackLeft: {
    left: 2,
  },
  stackRight: {
    right: 2,
  },
  leaf: {
    position: 'absolute',
    bottom: 3,
    width: 1,
    backgroundColor: inkAlpha(0.14),
  },
  pageNote: {
    position: 'absolute',
    bottom: 8,
    left: 28,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.textTertiary,
  },
  pageNoteRight: {
    left: undefined,
    right: 28,
  },
  ribbon: {
    position: 'absolute',
    top: -4,
    width: 10,
    height: 56,
    marginLeft: -5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    overflow: 'hidden',
    zIndex: 2,
  },
  ribbonShort: {
    height: 40,
  },

  // B
  block: {
    height: 44,
    justifyContent: 'center',
    ...shadows.xs,
  },
  blockRadius: {
    borderRadius: 4,
  },
  blockLines: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    height: 32,
  },
  blockLine: {
    width: 1.5,
    borderRadius: 1,
    backgroundColor: inkAlpha(0.13),
  },
  blockBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: inkAlpha(0.06),
  },
  blockBandTop: {
    top: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  blockBandBottom: {
    bottom: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  markerRow: {
    height: 8,
    marginTop: -spacing.sm,
    marginHorizontal: 4,
  },
  marker: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    marginLeft: -5,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: CLUB_GRADIENT[1],
  },

  // C
  sheet: {
    paddingVertical: spacing.md,
    paddingLeft: 30,
    paddingRight: spacing.lg,
    gap: 9,
    ...shadows.xs,
  },
  sheetRadius: {
    borderRadius: 4,
  },
  margin: {
    position: 'absolute',
    left: 22,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: CLUB_GRADIENT[1],
  },
  ruledLine: {
    height: 6,
    justifyContent: 'center',
  },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: inkAlpha(0.1),
  },
  ink: {
    height: 4,
    borderRadius: 2,
  },
  /** Le club, noté dans la marge à sa ligne */
  clubTick: {
    position: 'absolute',
    left: -20,
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: CLUB_GRADIENT[1],
  },
  dogEar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    borderTopLeftRadius: 4,
    overflow: 'hidden',
    ...shadows.xs,
  },
});
