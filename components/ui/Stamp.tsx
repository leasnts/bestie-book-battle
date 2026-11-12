/**
 * Stamp — le coup de tampon de l'app (#168, idée reprise de bencho.dev,
 * traduite en encre) : la chose tombe d'un peu plus haut, s'écrase sur le
 * papier, puis rebondit vif (Lea : « trop lent » sinon).
 *
 * - `useStamp` : le mouvement seul, pour tout ce qui se tamponne (l'emoji d'une
 *   réaction dans NoteCard, le tampon d'encre ci-dessous).
 * - `InkStamp` : un vrai coup de tampon d'encre rouge, cadre et mot en
 *   capitales, posé de travers (la date sur la carte de lecture). L'encre
 *   manque par endroits : grain, trous, un côté moins appuyé (une des trois
 *   empreintes d'assets/images/stamp, tirée au hasard, parfois retournée).
 *
 * « Réduire les animations » : rien ne bouge, le tampon est déjà posé.
 */

import MaskedView from './MaskedView';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '../../utils/constants';

/** La chute, avant l'impact */
export const STAMP_FALL = 180;

/**
 * Le mouvement d'un tampon. `fallAfter` : il tombe tout seul à la naissance,
 * après ce délai (ms) ; absent, il est déjà posé et `press()` le tamponne sur place.
 * `height` et `grow` : d'où il tombe, et combien il est plus gros en l'air.
 */
export function useStamp({ fallAfter, height = 26, grow = 0.7 }: { fallAfter?: number; height?: number; grow?: number } = {}) {
  const reducedMotion = useReducedMotion();
  const falls = fallAfter !== undefined && !reducedMotion;
  /** 0 = en l'air, 1 = posé */
  const fall = useSharedValue(falls ? 0 : 1);
  /** 1 = écrasé à plat, 0 = au repos */
  const squash = useSharedValue(0);

  const press = (delay = 0) => {
    if (reducedMotion) return;
    squash.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 50, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 14, stiffness: 700 }),
      ),
    );
  };

  useEffect(() => {
    if (!falls) return;
    fall.value = withDelay(fallAfter, withTiming(1, { duration: STAMP_FALL, easing: Easing.in(Easing.quad) }));
    press(fallAfter + STAMP_FALL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const air = 1 - fall.value;
    return {
      opacity: Math.min(1, fall.value * 4),
      transform: [
        { translateY: -height * air },
        { scale: 1 + grow * air },
        { scaleX: 1 + 0.32 * squash.value },
        { scaleY: 1 - 0.3 * squash.value },
      ],
    };
  });

  return { style, press };
}

/** Les empreintes d'encre : blanc = encre, transparent = papier qui reste */
const INK = [
  require('../../assets/images/stamp/ink-1.png'),
  require('../../assets/images/stamp/ink-2.png'),
  require('../../assets/images/stamp/ink-3.png'),
];

/** Un tampon d'encre rouge, posé de travers, qui tombe après `delay` ms */
export function InkStamp({
  label,
  delay,
  angle = -10,
  style,
}: {
  label: string;
  delay: number;
  /** Son inclinaison, en degrés */
  angle?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { style: stamp } = useStamp({ fallAfter: delay, height: 0, grow: 0.9 });
  // Chaque coup de tampon a son empreinte
  const [print] = useState(() => ({ ink: INK[Math.floor(Math.random() * INK.length)], flip: Math.random() < 0.5 }));
  return (
    <Animated.View style={[styles.place, { transform: [{ rotate: `${angle}deg` }] }, style]} pointerEvents="none">
      <Animated.View style={stamp}>
        <MaskedView
          maskElement={
            <Image source={print.ink} style={[StyleSheet.absoluteFill, print.flip && styles.flip]} contentFit="fill" />
          }
        >
          <View style={styles.frame}>
            <Text style={styles.label}>{label}</Text>
          </View>
        </MaskedView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  place: {
    position: 'absolute',
  },
  frame: {
    borderWidth: 2.5,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    opacity: 0.92,
  },
  flip: {
    transform: [{ scaleX: -1 }, { scaleY: -1 }],
  },
  label: {
    fontFamily: fonts.displayBold,
    fontSize: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.accent,
  },
});
