/**
 * NotesTrack — la piste du carnet, qui sert d'ascenseur.
 *
 * Le livre entier tient sur une ligne : chaque note est un point posé à sa
 * position, à la couleur de sa catégorie. Toucher la piste saute à cet endroit
 * de la liste — c'est la réponse à « retrouver mes notes sans feuilleter ».
 *
 * Au-delà de ma progression, la piste est hachurée : les notes qui s'y trouvent
 * ne sont que des carrés gris. Ni couleur, ni emoji : la couleur d'un post-it
 * dirait déjà de quoi parle la note.
 */

import React from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { colors, creamAlpha, inkAlpha } from '../../utils/constants';
import { ANNOTATION_CATEGORIES } from '../../utils/annotations';
import type { AnnotationCategory } from '../../types/supabase';

export interface TrackDot {
  id: string;
  position: number;
  category: AnnotationCategory | null;
}

interface NotesTrackProps {
  /** Les notes lisibles : un point coloré chacune */
  dots: TrackDot[];
  /** Les notes encore verrouillées : un carré gris chacune */
  lockedPositions: number[];
  /** Ma progression, 0 → 1 : la piste est hachurée au-delà */
  myPosition: number;
  /** Toucher la piste : la liste saute à cette position */
  onSeek: (position: number) => void;
}

/** Au-delà, les points se chevauchent : on n'en dessine plus que la moitié */
const MAX_DOTS = 30;

export default function NotesTrack({
  dots,
  lockedPositions,
  myPosition,
  onSeek,
}: NotesTrackProps) {
  const [width, setWidth] = React.useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // Trop de points : on en garde un sur deux, la piste reste lisible
  const step = Math.max(1, Math.ceil(dots.length / MAX_DOTS));
  const visibleDots = dots.filter((_, index) => index % step === 0);

  return (
    <Pressable
      style={styles.hit}
      onLayout={onLayout}
      onPress={(event) => {
        if (width > 0) onSeek(Math.max(0, Math.min(1, event.nativeEvent.locationX / width)));
      }}
      accessibilityRole="adjustable"
      accessibilityLabel="Piste du livre"
      accessibilityHint="Touche un endroit pour y aller dans la liste"
    >
      <View style={styles.rail}>
        <View style={[styles.read, { width: `${myPosition * 100}%` }]} />
      </View>

      {/* La zone que je n'ai pas encore lue : hachurée à petits traits */}
      <View style={[styles.locked, { left: `${myPosition * 100}%` }]} pointerEvents="none">
        {Array.from({ length: 40 }).map((_, index) => (
          <View key={index} style={styles.hatch} />
        ))}
      </View>

      {visibleDots.map((dot) => (
        <View
          key={dot.id}
          style={[
            styles.dot,
            { left: `${dot.position * 100}%` },
            dot.category
              ? { backgroundColor: ANNOTATION_CATEGORIES[dot.category].color }
              : styles.dotNeutral,
          ]}
          pointerEvents="none"
        />
      ))}

      {lockedPositions.map((position, index) => (
        <View
          key={`locked-${index}`}
          style={[styles.lockedDot, { left: `${position * 100}%` }]}
          pointerEvents="none"
        />
      ))}

      {/* Où j'en suis */}
      <View style={[styles.me, { left: `${myPosition * 100}%` }]} pointerEvents="none" />
    </Pressable>
  );
}

const RAIL_TOP = 13;
const RAIL_HEIGHT = 6;

const styles = StyleSheet.create({
  // Une zone tactile confortable autour d'une piste fine
  hit: {
    height: 32,
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: RAIL_TOP,
    height: RAIL_HEIGHT,
    borderRadius: RAIL_HEIGHT / 2,
    backgroundColor: inkAlpha(0.08),
    overflow: 'hidden',
  },
  read: {
    height: '100%',
    backgroundColor: inkAlpha(0.18),
  },

  locked: {
    position: 'absolute',
    right: 0,
    top: RAIL_TOP,
    height: RAIL_HEIGHT,
    flexDirection: 'row',
    gap: 3,
    overflow: 'hidden',
  },
  hatch: {
    width: 3,
    height: RAIL_HEIGHT,
    backgroundColor: inkAlpha(0.22),
    transform: [{ skewX: '-20deg' }],
  },

  dot: {
    position: 'absolute',
    top: RAIL_TOP - 3,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: creamAlpha(0.9),
  },
  dotNeutral: {
    backgroundColor: inkAlpha(0.35),
  },

  /** Une note plus loin : un carré gris, sans couleur de catégorie */
  lockedDot: {
    position: 'absolute',
    top: RAIL_TOP - 2,
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: 3,
    backgroundColor: inkAlpha(0.16),
    borderWidth: 1,
    borderColor: inkAlpha(0.3),
  },

  me: {
    position: 'absolute',
    top: RAIL_TOP - 6,
    width: 2,
    height: 18,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: colors.dark900,
  },
});
