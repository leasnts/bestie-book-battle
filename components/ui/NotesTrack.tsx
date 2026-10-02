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
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, RadialGradient, Stop } from 'react-native-svg';
import type { AnnotationCategory } from '../../types/supabase';
import { ANNOTATION_CATEGORIES } from '../../utils/annotations';
import { inkAlpha, motion } from '../../utils/constants';
import GlassMaterial from './GlassMaterial';
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
  /**
   * Où en est la liste quand on la fait défiler, 0 → 1, mis à jour à chaque
   * image : une goutte de verre glisse sur le fil en continu. Absent : pas de
   * goutte (au repos, en haut du carnet).
   */
  focus?: SharedValue<number>;
}

/** Au-delà, les nœuds se chevauchent : on n'en dessine plus que la moitié */
const MAX_DOTS = 30;
const HEIGHT = 32;
/** Une note : un peu plus grosse qu'un cap de l'accueil, pour sa couleur */
const NOTE_R = 4.6;
/** Ce que le dessin déborde de la piste de chaque côté : les nœuds du bout entiers */
const PAD = NOTE_R + 1;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/** La goutte : un peu plus petite que les épingles du groupe (24 pt) sur Ma page */
const DROP = 18;
/** Ce que la pointe dépasse sous le rond (carré tourné de 45°) */
const DROP_TIP = (DROP * (Math.SQRT2 - 1)) / 2 + 1;

export default function NotesTrack({ dots, lockedPositions, myPosition, onSeek, focus }: NotesTrackProps) {
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
      {width > 0 && focus && <Lens focus={focus} width={width} />}
    </Pressable>
  );
}

/**
 * Où en est la liste : une goutte de verre, la pointe sur le fil — la forme
 * des épingles du groupe sur Ma page (Lea, 2026-10-02), sans photo, en verre
 * (`GlassMaterial`) : elle situe, rien de plus. Elle glisse d'une note à
 * l'autre en suivant la liste, en continu.
 */
function Lens({ focus, width }: { focus: SharedValue<number>; width: number }) {
  // Elle suit le défilement image par image : pas d'animation à elle, sinon elle traînerait
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: focus.value * width - DROP / 2 }],
  }));
  return (
    <Animated.View
      style={[styles.pin, style]}
      pointerEvents="none"
      entering={FadeIn.duration(motion.duration.standard)}
    >
      {/* Un carré aux trois coins ronds tourné de 45° : le coin vif fait la pointe */}
      <View style={styles.drop}>
        {/* Le verre est rogné à la forme ; l'ombre et le liseré, eux, restent dehors */}
        <View style={[styles.dropShape, styles.dropClip]}>
          <GlassMaterial radius={DROP / 2} veil={0.45} />
        </View>
        <View style={[styles.dropShape, styles.dropRim]} />
      </View>
    </Animated.View>
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
  // La pointe de la goutte touche le fil
  pin: {
    position: 'absolute',
    left: 0,
    top: HEIGHT / 2 - DROP - DROP_TIP + 1,
    width: DROP,
    alignItems: 'center',
  },
  drop: {
    width: DROP,
    height: DROP,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  // Le même liseré que les épingles : blanc, et un filet d'encre autour
  dropShape: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: DROP / 2,
    borderTopRightRadius: DROP / 2,
    borderBottomLeftRadius: DROP / 2,
    borderBottomRightRadius: 2,
  },
  dropClip: {
    overflow: 'hidden',
    backgroundColor: '#f3eee7',
  },
  dropRim: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    boxShadow: '0 0 0 1px rgba(90,69,54,0.22)',
  },

});
