/**
 * PaperWashBackdrop — le fond de l'en-tête du profil : de l'aquarelle sur papier.
 *
 *    ┌───────────────────────────────┐
 *    │ beurre ░░░░░░░░░░░░░░░░ rouge │   ← grandes taches qui se mêlent,
 *    │ ░░░ auréoles, grain ░░░░░░░░░ │      auréoles et grain du papier
 *    │ chocolat ░░░░░░░░░ rouge foncé│
 *    └·······························┘   ← bord du bas cousu
 *
 * Le papier aquarelle choisi par Lea (2026-10-23) : beurre, rouge et chocolat
 * Lowki, sans beige. Une image calculée par scripts/generate-profile-wash.py
 * (le grain et les auréoles ne se dessinent pas en React Native), posée en
 * `cover` : elle remplit l'en-tête quelle que soit sa hauteur.
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { creamAlpha } from '../../utils/constants';
import { StitchLine } from './Stitch';

const WASH = require('../../assets/images/watercolor/profile-wash.png');

export default function PaperWashBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={WASH} style={StyleSheet.absoluteFill} contentFit="cover" />
      <StitchLine color={creamAlpha(0.6)} style={styles.seam} />
    </View>
  );
}

const styles = StyleSheet.create({
  seam: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 4,
  },
});
