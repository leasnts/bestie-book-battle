/**
 * GlassMaterial — le matériau verre de l'app, sans contenu.
 *
 * Partagé par la barre d'onglets (`GlassTabBar`) et les cadres de l'accueil
 * (`GlassSection`). Il remplit son parent en position absolue : le parent pose
 * son contenu PAR-DESSUS, jamais dedans. Placé comme enfant de GlassView, iOS 26
 * réadapte la couleur du contenu à ce qui passe derrière le verre, avec plusieurs
 * secondes de retard. Même raison pour l'absence d'`isInteractive`, qui éclaire
 * et reteinte le verre au toucher.
 *
 * - iOS 26 : `GlassView` (expo-glass-effect), le vrai UIGlassEffect des barres système.
 * - Avant iOS 26 : flou expo-blur, toujours voilé de crème à 80 % au moins, car le
 *   flou seul ne suffit pas à rendre le texte lisible.
 */

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { creamAlpha, inkAlpha } from '../../utils/constants';

/** Voile minimum du repli flou */
const FALLBACK_VEIL = 0.8;
/** Filet du repli flou quand aucun bord n'est demandé : détache le flou du papier */
const FALLBACK_EDGE = inkAlpha(0.08);

interface GlassMaterialProps {
  /** Rayon des coins, identique à celui du parent */
  radius: number;
  /**
   * Opacité d'un voile crème posé sur le verre (0 = verre nu). Il garantit un
   * contraste minimum au texte, quel que soit le fond qui passe derrière.
   */
  veil?: number;
  /**
   * Couleur d'un filet de 1 pt sur le bord. Sans valeur : aucun sur le verre
   * natif, un filet d'encre très fin sur le repli.
   */
  edgeColor?: string;
}

export default function GlassMaterial({ radius, veil = 0, edgeColor }: GlassMaterialProps) {
  const shape = { borderRadius: radius };
  const native = isLiquidGlassAvailable();
  const veilOpacity = native ? veil : Math.max(veil, FALLBACK_VEIL);
  const edge = edgeColor ?? (native ? undefined : FALLBACK_EDGE);
  const edgeWidth = edgeColor ? 1 : StyleSheet.hairlineWidth;

  return (
    <>
      {native ? (
        <GlassView style={[styles.fill, shape]} glassEffectStyle="regular" />
      ) : (
        <BlurView style={[styles.fill, shape]} intensity={40} tint="light" />
      )}
      {veilOpacity > 0 && (
        <View
          style={[styles.fill, shape, { backgroundColor: creamAlpha(veilOpacity) }]}
          pointerEvents="none"
        />
      )}
      {edge && (
        <View
          style={[styles.fill, shape, { borderWidth: edgeWidth, borderColor: edge }]}
          pointerEvents="none"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
