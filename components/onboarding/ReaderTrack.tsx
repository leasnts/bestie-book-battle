/**
 * ReaderTrack — une lectrice et où elle en est, sur une ligne :
 *
 *    (C)  ●●●●●●●●●●●···················  23 %
 *
 * Le disque à l'initiale (dégradé encre, ou rouge pour l'autre), la couture de
 * GoalTrack (`Seam`), le % : on se compare toujours en %. Une place libre
 * (`initial` absent) a un disque cousu, vide.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg from 'react-native-svg';
import { accentGradient, colors, fonts, inkGradient, lowki, spacing } from '../../utils/constants';
import { Seam } from '../ui/GoalTrack';
import { StitchBorder } from '../ui/Stitch';

const DISC = 32;
const SEAM_H = 8;

interface ReaderTrackProps {
  /** L'initiale ; absente = une place libre */
  initial?: string;
  /** De 0 à 100 */
  percent: number;
  /** La lectrice d'en face, en rouge ; moi, en encre */
  other?: boolean;
  /** Le texte de droite ; par défaut « 23 % » */
  label?: string;
}

export default function ReaderTrack({ initial, percent, other = false, label }: ReaderTrackProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.row}>
      {initial ? (
        <View style={styles.disc}>
          <LinearGradient colors={other ? accentGradient : inkGradient} style={StyleSheet.absoluteFill} />
          <Text style={[styles.initial, other && styles.initialOther]}>{initial}</Text>
        </View>
      ) : (
        <View style={styles.disc}>
          <StitchBorder radius={DISC / 2} inset={0} />
          <Text style={styles.empty}>?</Text>
        </View>
      )}
      <View style={styles.seam} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={SEAM_H}>
            <Seam width={width} readUntil={(width * Math.max(0, Math.min(100, percent))) / 100} y={SEAM_H / 2} />
          </Svg>
        )}
      </View>
      <Text style={styles.label}>{label ?? `${Math.round(percent)} %`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.displayBold,
    fontSize: 13,
    color: colors.white,
  },
  initialOther: {
    color: lowki.butter.light,
  },
  empty: {
    fontFamily: fonts.displayBold,
    fontSize: 13,
    color: colors.textPlaceholder,
  },
  seam: {
    flex: 1,
    height: SEAM_H,
  },
  label: {
    minWidth: 48,
    textAlign: 'right',
    fontFamily: fonts.displayBold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
});
