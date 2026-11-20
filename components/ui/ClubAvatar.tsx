/**
 * ClubAvatar — le rond d'un club (#238) : sa photo, sinon son initiale.
 *
 * Sans photo, l'initiale écrite à la main (Welcome Valentines) sur un dégradé
 * d'une paire de la charte, toujours la même pour un club (tirée de son id) :
 * rouge, beurre ou chocolat. Jamais d'aplat. La police d'accent n'a pas de
 * lettres accentuées : l'initiale perd son accent (« É » → « E »).
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Club } from '../../types/supabase';
import { colors, fonts, lowki } from '../../utils/constants';

const WASHES = [
  { colors: [lowki.red.light, lowki.red.dark] as const, ink: colors.white },
  { colors: [lowki.butter.light, lowki.butter.dark] as const, ink: lowki.chocolate.dark },
  { colors: [lowki.chocolate.light, lowki.chocolate.dark] as const, ink: colors.white },
];

function washOf(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return WASHES[n % WASHES.length];
}

/** L'initiale du club, sans accent (la police d'accent n'en a pas) */
export function clubInitial(name: string): string {
  const first = name.trim().charAt(0).normalize('NFD').replace(/[̀-ͯ]/g, '');
  return first.toUpperCase() || '?';
}

interface ClubAvatarProps {
  club: Pick<Club, 'id' | 'name' | 'photo_url'>;
  size: number;
  style?: StyleProp<ViewStyle>;
}

export default function ClubAvatar({ club, size, style }: ClubAvatarProps) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (club.photo_url) {
    return <Image source={{ uri: club.photo_url }} style={[round, style as any]} contentFit="cover" transition={150} />;
  }
  const wash = washOf(club.id);
  return (
    <View style={[round, styles.clip, style]}>
      <LinearGradient colors={wash.colors} style={StyleSheet.absoluteFill} />
      <Text style={[styles.initial, { color: wash.ink, fontSize: size * 0.58, lineHeight: size * 0.9 }]}>
        {clubInitial(club.name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.accent,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
