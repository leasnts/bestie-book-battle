/**
 * NotesTrack — la piste du carnet, qui sert d'ascenseur.
 *
 *    -●●●●●●○-------○------○------○
 *      ↑ les notes        ↑ plus loin, verrouillées
 *
 * Le fil du livre de l'accueil (`GoalTrack`, Lea, 2026-10-02 : la barre grise
 * hachurée n'était « pas du tout cohérente ») : point avant chocolat jusqu'à ma
 * page, sable après. Chaque note y est un nœud brodé, à la couleur de son
 * thème ; une note plus loin que ma page est un nœud sable, sans couleur — la
 * couleur dirait déjà de quoi elle parle. La fin du livre, un dernier nœud.
 *
 * Toucher la piste saute à cet endroit de la liste : « retrouver mes notes sans
 * feuilleter ». Un filtre éteint les nœuds des autres, sans les retirer.
 */

import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, RadialGradient, Stop } from 'react-native-svg';
import type { AnnotationCategory } from '../../types/supabase';
import { ANNOTATION_CATEGORIES } from '../../utils/annotations';
import { inkAlpha, motion } from '../../utils/constants';
import { KNOT_R, KnotGradients, Seam } from './GoalTrack';

export interface TrackDot {
  id: string;
  position: number;
  category: AnnotationCategory | null;
  /** Hors du filtre choisi : le nœud s'efface et rapetisse, sans disparaître */
  dimmed?: boolean;
}

interface NotesTrackProps {
  /** Les notes lisibles : un nœud coloré chacune */
  dots: TrackDot[];
  /** Les notes encore verrouillées : un nœud sable chacune */
  lockedPositions: number[];
  /** Ma progression, 0 → 1 : le fil est chocolat jusque-là */
  myPosition: number;
  /** Toucher la piste : la liste saute à cette position */
  onSeek: (position: number) => void;
}

/** Au-delà, les nœuds se chevauchent : on n'en dessine plus que la moitié */
const MAX_DOTS = 30;
const HEIGHT = 32;
/** Une note : un peu plus grosse qu'un cap de l'accueil, pour sa couleur */
const NOTE_R = 4.6;
/** Ce que le dessin déborde de la piste de chaque côté : les nœuds du bout entiers */
const PAD = NOTE_R + 1;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function NotesTrack({ dots, lockedPositions, myPosition, onSeek }: NotesTrackProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // Trop de nœuds : on en garde un sur deux, la piste reste lisible
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
      {width > 0 && (
        <Svg width={width + PAD * 2} height={HEIGHT} style={styles.svg} pointerEvents="none">
          <KnotGradients />
          <CategoryGradients />
          <G transform={`translate(${PAD} 0)`}>
            <Seam width={width} readUntil={width * myPosition} y={HEIGHT / 2} />
            {lockedPositions.map((position, index) => (
              <Circle key={`locked-${index}`} cx={width * position} cy={HEIGHT / 2} r={KNOT_R} fill="url(#knotAhead)" />
            ))}
            {/* La fin du livre */}
            <Circle cx={width} cy={HEIGHT / 2} r={KNOT_R} fill="url(#knotAhead)" />
            {visibleDots.map((dot) => (
              <Knot key={dot.id} dot={dot} x={width * dot.position} />
            ))}
          </G>
        </Svg>
      )}
    </Pressable>
  );
}

/** Les nœuds des thèmes : bombés comme ceux de l'accueil, dans la couleur du thème */
function CategoryGradients() {
  return (
    <Defs>
      {(Object.keys(ANNOTATION_CATEGORIES) as AnnotationCategory[]).map((category) => {
        const color = ANNOTATION_CATEGORIES[category].color;
        return (
          <RadialGradient key={category} id={`knot-${category}`} cx="35%" cy="30%" r="80%">
            <Stop offset="0" stopColor={shade(color, 1.05)} />
            <Stop offset="0.6" stopColor={color} />
            <Stop offset="1" stopColor={shade(color, 0.72)} />
          </RadialGradient>
        );
      })}
    </Defs>
  );
}

/** Un nœud de note : il suit le filtre en s'effaçant (200 ms, ease-out-quart) */
function Knot({ dot, x }: { dot: TrackDot; x: number }) {
  const on = useSharedValue(dot.dimmed ? 0 : 1);
  useEffect(() => {
    on.value = withTiming(dot.dimmed ? 0 : 1, {
      duration: motion.duration.standard,
      easing: Easing.bezier(...motion.easing.easeOutQuart),
    });
  }, [dot.dimmed, on]);
  const animatedProps = useAnimatedProps(() => ({
    opacity: 0.18 + on.value * 0.82,
    r: NOTE_R * (0.6 + on.value * 0.4),
  }));
  return (
    <AnimatedCircle
      cx={x}
      cy={HEIGHT / 2}
      fill={dot.category ? `url(#knot-${dot.category})` : 'url(#knotAhead)'}
      stroke={inkAlpha(0.28)}
      strokeWidth={0.8}
      animatedProps={animatedProps}
    />
  );
}

/** Une couleur `#rrggbb` éclaircie (> 1) ou assombrie (< 1) */
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v * k)));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
}

const styles = StyleSheet.create({
  // Une zone tactile confortable autour d'un fil fin
  hit: {
    height: HEIGHT,
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    left: -PAD,
    top: 0,
  },
});
