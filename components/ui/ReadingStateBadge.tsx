/**
 * Composant ReadingStateBadge
 *
 * La pastille d'état posée sur le coin d'une couverture, dans la bibliothèque.
 * Toujours au même endroit, calée à droite :
 *
 *    pas commencé     en cours        terminé
 *       ( ○ )         ( 58 % )         ( ✓ )
 *    cercle vide     mon avancement   disque encre
 *                                     et coche crème
 *
 * Même logique qu'une case à cocher : vide, puis cochée. Entre les deux, le
 * pourcentage exact plutôt qu'une jauge : une jauge en anneau se lit comme un
 * indicateur de chargement.
 * La pastille a toujours un fond plein et un liseré crème : elle reste lisible
 * sur n'importe quelle couverture, claire ou sombre.
 */

import { CheckIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, inkAlpha } from '../../utils/constants';
import type { BookReading } from '../../utils/library';

export const READING_BADGE_SIZE = 28;

/** Liseré crème autour de la pastille */
const EDGE = 1.5;
/** L'intérieur du liseré, où se dessine l'anneau */
const INNER = READING_BADGE_SIZE - 2 * EDGE;
const RING_STROKE = 2;
/** Rayon du cercle vide : laisse 4 pt de fond autour de lui */
const RING_R = INNER / 2 - 4 - RING_STROKE / 2;

export default function ReadingStateBadge({ state, percent }: BookReading) {
  if (state === 'done') {
    return (
      <View style={[styles.badge, styles.done]}>
        <CheckIcon size={16} color={colors.white} strokeWidth={3.2} />
      </View>
    );
  }

  if (state === 'reading') {
    return (
      <View style={[styles.badge, styles.percent]}>
        <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
          {percent} %
        </Text>
      </View>
    );
  }

  const c = INNER / 2;

  return (
    <View style={styles.badge}>
      <Svg width={INNER} height={INNER}>
        <Circle cx={c} cy={c} r={RING_R} stroke={inkAlpha(0.35)} strokeWidth={RING_STROKE} fill="none" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: READING_BADGE_SIZE,
    height: READING_BADGE_SIZE,
    borderRadius: READING_BADGE_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    // Détache la pastille de la couverture, quelle que soit sa couleur
    borderWidth: EDGE,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  percent: {
    paddingHorizontal: 7,
  },
  percentText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  done: {
    backgroundColor: colors.dark900,
  },
});
