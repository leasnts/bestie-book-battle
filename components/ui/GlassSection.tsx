/**
 * GlassSection — un cadre en verre de l'accueil (Le livre, Ma page, Classement).
 *
 * Une question = un cadre. Le verre (`GlassMaterial`) est posé en fond absolu et
 * le contenu PAR-DESSUS, jamais dedans : iOS 26 reteinte le contenu d'un verre
 * avec plusieurs secondes de retard (même leçon que `GlassTabBar`).
 *
 * Lisibilité : un voile crème (`glassVeil`, 56 %) recouvre le verre. Le fond tiré
 * de la couverture dose ses couleurs sur ce voile pour que `text-tertiary` garde
 * au moins 5:1 dans le cadre (`utils/coverPalette.ts`).
 *
 * Deux usages :
 * - sans `onPress` : simple cadre (Ma page, qui a ses propres zones tactiles) ;
 * - avec `onPress` : tout le cadre se touche et se rentre à 0,97 (Le livre,
 *   Classement). `PressableScale` coupe l'animation si « Réduire les animations »
 *   est activé ; le cadre n'en ajoute aucune autre.
 *
 * Brodé comme les autocollants (`NoteSticker`) : une couture au même point
 * (`STITCH`) court tout le tour, un peu en retrait du bord. Rien d'autre (ni
 * coin décollé ni filigrane) : ce sont des blocs, pas des autocollants.
 *
 * Pas de carte dans une carte : le contenu se structure avec des filets et des
 * espacements, pas avec un fond ou un cadre de plus.
 */

import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { borderRadius, creamAlpha, glassVeil, paperFrameGradient, spacing } from '../../utils/constants';
import GlassMaterial from './GlassMaterial';
import { STICKER_BASE_LARGE, STITCH, stitchColor, stitchInset } from './NoteSticker';
import PressableScale from './PressableScale';

const RADIUS = borderRadius.xl;
/** Bord clair qui détache le cadre du fond coloré */
const EDGE = creamAlpha(0.9);
/** La couture, au même écart du bord qu'une grande note ; son arrondi suit celui du cadre */
const STITCH_INSET = stitchInset(STICKER_BASE_LARGE);

/**
 * Le tracé de la couture. Haut ouvert (`openTop`) : elle descend du haut d'un
 * côté, fait le tour par le bas et remonte de l'autre, et s'efface avec le verre.
 */
function stitchPath(w: number, h: number, openTop: boolean) {
  const i = STITCH_INSET;
  // Même arrondi de couture que l'autocollant (NoteSticker)
  const r = RADIUS - i * 0.6;
  const bottom = `V ${h - i - r} Q ${i} ${h - i} ${i + r} ${h - i} H ${w - i - r} Q ${w - i} ${h - i} ${w - i} ${h - i - r}`;
  if (openTop) return `M ${i} 0 ${bottom} V 0`;
  return `M ${i + r} ${i} H ${w - i - r} Q ${w - i} ${i} ${w - i} ${i + r} V ${h - i - r} Q ${w - i} ${h - i} ${w - i - r} ${h - i} H ${i + r} Q ${i} ${h - i} ${i} ${h - i - r} V ${i + r} Q ${i} ${i} ${i + r} ${i} Z`;
}

function Stitch({ width, height, openTop }: { width: number; height: number; openTop: boolean }) {
  if (!width || !height) return null;
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      <Path
        d={stitchPath(width, height, openTop)}
        fill="none"
        stroke={stitchColor(true)}
        strokeWidth={STITCH.width}
        strokeDasharray={STITCH.dash}
        strokeLinecap={STITCH.cap}
      />
    </Svg>
  );
}

interface GlassSectionProps {
  children: React.ReactNode;
  /** Rend tout le cadre touchable */
  onPress?: () => void;
  /** Cadre touchable : ce que VoiceOver annonce (ex. « Fiche du livre ») */
  accessibilityLabel?: string;
  /** Cadre touchable : ce qui se passe au toucher */
  accessibilityHint?: string;
  /** Mise en page du cadre dans l'écran (hauteur, flex, marges) */
  style?: StyleProp<ViewStyle>;
  /** Marge intérieure resserrée (12 au lieu de 16) : accueil sur petit écran */
  compact?: boolean;
  /**
   * Le haut s'efface sur cette hauteur : le cadre sort de sous celui du dessus
   * (Ma page, sous Le livre). Coins droits en haut ; le bas garde son arrondi et
   * son bord.
   */
  fadeTop?: number;
  /**
   * Papier beige au lieu du verre : posé sur un fond clair (un sheet), le verre
   * blanc s'y perd. Même couture, même rayon.
   */
  paper?: boolean;
}

export default function GlassSection({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  compact = false,
  fadeTop = 0,
  paper = false,
}: GlassSectionProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  const layers = (
    <>
      {fadeTop > 0 ? (
        // Seul le verre s'efface ; le contenu, lui, commence sous le fondu
        <MaskedView
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          maskElement={
            // Le masque dessine la forme : droit en haut, arrondi en bas
            <View style={styles.maskColumn}>
              <LinearGradient colors={['transparent', '#000']} style={{ height: fadeTop }} />
              <View style={styles.maskSolid} />
            </View>
          }
        >
          <GlassMaterial radius={0} veil={glassVeil} />
          <View style={styles.edgeOpenTop} />
          <Stitch {...size} openTop />
        </MaskedView>
      ) : (
        <>
          {paper ? (
            <LinearGradient colors={paperFrameGradient} style={[StyleSheet.absoluteFill, styles.paper]} />
          ) : (
            <GlassMaterial radius={RADIUS} veil={glassVeil} edgeColor={EDGE} />
          )}
          <Stitch {...size} openTop={false} />
        </>
      )}
      <View style={[styles.content, compact && styles.contentCompact]}>{children}</View>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.frame, style]} onLayout={onLayout}>{layers}</View>
    );
  }

  return (
    <PressableScale
      style={[styles.frame, style]}
      onLayout={onLayout}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {layers}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: RADIUS,
  },
  // flexGrow et pas flex: 1 : sans hauteur imposée, le cadre prend celle de son contenu
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  contentCompact: {
    padding: spacing.md,
  },
  paper: {
    borderRadius: RADIUS,
  },
  maskColumn: {
    flex: 1,
  },
  maskSolid: {
    flex: 1,
    backgroundColor: '#000',
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
  },
  // Le bord, sans le haut : il s'efface avec le verre
  edgeOpenTop: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: EDGE,
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
  },
});
