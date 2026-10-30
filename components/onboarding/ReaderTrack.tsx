/**
 * ReaderTrack — une lectrice et où elle en est, sur une ligne, comme une ligne
 * de la Progression de l'accueil (LeaderboardSection) avec sa piste en plus :
 *
 *    [photo] Chloé  ●●●●●●●●●●●···················  37 %
 *
 * La photo (ou l'avatar par défaut), le prénom, la couture de GoalTrack
 * (`Seam`), le % : on se compare toujours en %. Ma place (`free`) : l'icône de
 * chapi en guise de photo, et une piste encore toute à faire.
 */

import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg from 'react-native-svg';
import { colors, creamAlpha, fonts, inkAlpha, spacing } from '../../utils/constants';
import { AccentUnit } from '../ui/AccentWord';
import { Seam } from '../ui/GoalTrack';

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');
const APP_ICON = require('../../assets/images/app_icon.png');
const AVATAR = 30;
const AVATAR_RADIUS = 9;
const SEAM_H = 8;
const NAME_W = 64;

interface ReaderTrackProps {
  name?: string;
  photoUrl?: string | null;
  /** De 0 à 100 */
  percent: number;
  /** Ma place, encore libre : le carré cousu, ma ligne surlignée */
  free?: boolean;
}

export default function ReaderTrack({ name, photoUrl, percent, free = false }: ReaderTrackProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const score = Math.round(percent);

  return (
    <View style={[styles.row, free && styles.rowMe]} accessible accessibilityLabel={free ? 'Ta place, à 0 pour cent' : `${name}, ${score} pour cent`}>
      {/* Ma place : pas encore de photo au début, l'icône de chapi la tient */}
      <Image
        source={free ? APP_ICON : photoUrl?.startsWith('http') ? { uri: photoUrl } : DEFAULT_AVATAR}
        style={[styles.avatar, styles.photo]}
        contentFit="cover"
      />
      {/* Une colonne de prénom de largeur fixe : toutes les pistes partent du même point */}
      <Text style={styles.name} numberOfLines={1}>{name ?? ''}</Text>
      <View style={styles.seam} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={SEAM_H}>
            <Seam width={width} readUntil={(width * Math.max(0, Math.min(100, percent))) / 100} y={SEAM_H / 2} />
          </Svg>
        )}
      </View>
      <Text style={styles.score}>
        {score}
        <AccentUnit size={styles.unit.fontSize} color={styles.score.color}>%</AccentUnit>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Comme une ligne de la Progression : elle déborde du padding du cadre
  row: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: -9,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 14,
  },
  rowMe: {
    backgroundColor: inkAlpha(0.06),
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR_RADIUS,
  },
  photo: {
    borderWidth: 1,
    borderColor: creamAlpha(0.6),
  },
  name: {
    width: NAME_W,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  seam: {
    flex: 1,
    height: SEAM_H,
  },
  score: {
    minWidth: 44,
    textAlign: 'right',
    fontFamily: fonts.display,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
  },
  unit: {
    fontSize: 12,
  },
});
