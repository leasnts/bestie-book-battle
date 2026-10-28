/**
 * PageBlock — un livre couché vu de face, dont le bloc de pages s'épaissit
 * ou s'amincit avec le rythme choisi (la boîte qui grossit de Basta, en livre).
 *
 *    ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁   couverture (dégradé encre)
 *    ≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡    les pages, une ligne tous les 3 pt
 *    ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔   couverture
 *
 * Le changement d'épaisseur a un léger rebond, comme le tampon ; « Réduire les
 * animations » : l'épaisseur change d'un coup.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { colors, inkAlpha, inkGradient, shadowAlpha } from '../../utils/constants';

const WIDTH = 196;
const BOARD = 8;
/** La hauteur max du bloc : la zone réservée ne bouge pas */
export const PAGE_BLOCK_MAX = 84;

export default function PageBlock({ thickness, faded = false }: { thickness: number; faded?: boolean }) {
  const reducedMotion = useReducedMotion();
  const height = useSharedValue(thickness);

  useEffect(() => {
    height.value = reducedMotion ? thickness : withSpring(thickness, { damping: 12, stiffness: 220 });
  }, [thickness, reducedMotion, height]);

  const pages = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={styles.zone} accessible={false}>
      <View style={[styles.book, faded && styles.faded]}>
        <LinearGradient colors={inkGradient} style={styles.board} />
        <Animated.View style={[styles.pages, pages]}>
          <Svg width="100%" height={PAGE_BLOCK_MAX}>
            <Defs>
              <Pattern id="pageLines" width={4} height={3} patternUnits="userSpaceOnUse">
                <Rect width={4} height={3} fill={colors.white} />
                <Line x1={0} y1={2.5} x2={4} y2={2.5} stroke={inkAlpha(0.16)} strokeWidth={1} />
              </Pattern>
            </Defs>
            <Rect width="100%" height={PAGE_BLOCK_MAX} fill="url(#pageLines)" />
          </Svg>
        </Animated.View>
        <LinearGradient colors={inkGradient} style={styles.board} />
      </View>
      <View style={styles.shadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    height: PAGE_BLOCK_MAX + 2 * BOARD + 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  book: {
    width: WIDTH,
    transform: [{ rotate: '-3deg' }],
    zIndex: 1,
  },
  faded: {
    opacity: 0.55,
  },
  board: {
    height: BOARD,
    borderRadius: 3,
  },
  pages: {
    marginLeft: 3,
    marginRight: 7,
    overflow: 'hidden',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    borderRightWidth: 1,
    borderRightColor: inkAlpha(0.18),
  },
  shadow: {
    position: 'absolute',
    bottom: 2,
    width: WIDTH + 8,
    height: 12,
    borderRadius: 6,
    backgroundColor: shadowAlpha(0.12),
  },
});
