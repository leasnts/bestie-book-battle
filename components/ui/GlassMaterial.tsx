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
 *
 * `rim` ajoute le liseré des boutons en verre d'iOS 26 : un filet d'encre très fin
 * qui dessine la forme même sur un fond blanc, doublé à l'intérieur d'un reflet
 * crème qui accroche la lumière en haut à gauche et en bas à droite.
 */

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React, { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
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
  /** Liseré des boutons en verre : filet d'encre + reflet crème (voir en tête) */
  rim?: boolean;
}

export default function GlassMaterial({ radius, veil = 0, edgeColor, rim = false }: GlassMaterialProps) {
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
      {rim && <GlassRim radius={radius} />}
    </>
  );
}

/**
 * Le liseré, dessiné en SVG : React Native ne sait pas faire de bordure en dégradé.
 * Deux contours superposés, mesurés sur le parent :
 * - dehors, un filet d'encre à 8 % qui détache la forme d'un fond clair ;
 * - dedans, un reflet crème en diagonale, vif aux deux coins opposés.
 */
function GlassRim({ radius }: { radius: number }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  // Un identifiant de dégradé par liseré ; les « : » de useId cassent `url(#…)`
  const gradientId = `rim${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <View
      style={styles.fill}
      pointerEvents="none"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
    >
      {size && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={creamAlpha(1)} />
              <Stop offset="0.35" stopColor={creamAlpha(0.15)} />
              <Stop offset="0.65" stopColor={creamAlpha(0.1)} />
              <Stop offset="1" stopColor={creamAlpha(0.8)} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0.5}
            y={0.5}
            width={size.width - 1}
            height={size.height - 1}
            rx={radius - 0.5}
            stroke={inkAlpha(0.08)}
            strokeWidth={1}
            fill="none"
          />
          <Rect
            x={1.75}
            y={1.75}
            width={size.width - 3.5}
            height={size.height - 3.5}
            rx={radius - 1.75}
            stroke={`url(#${gradientId})`}
            strokeWidth={1.5}
            fill="none"
          />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
