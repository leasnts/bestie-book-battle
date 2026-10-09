/**
 * CoverBackdrop — le fond de l'accueil, un dégradé linéaire sur le papier.
 *
 * Pourquoi : du verre posé sur un blanc chaud uni ne se voit presque pas, il n'a
 * rien à flouter. Le fond descend donc du papier clair vers le sable, de haut en
 * bas. Plus de taches (Lea, 2026-10-09 : trop d'auras plus ou moins foncées).
 *
 * Par défaut, et c'est ce qu'utilise l'accueil : des tons **neutres** tirés de la
 * palette (beige, sable, chocolat clair). Les couleurs de la couverture en fond
 * agaçaient Lea (2026-09-24) : elles faisaient une couleur de plus sur l'écran.
 *
 * - `palette` (facultatif) : les couleurs d'une couverture (`cover_palette`),
 *   pour un écran qui parlerait d'un seul livre. Même fond pour tout le club.
 * - Chaque arrêt est dosé par `safeOpacity` : une couverture sombre donne un
 *   dégradé plus léger, jamais un fond qui rendrait les cadres illisibles.
 * - Changement de livre : la nouvelle palette apparaît en fondu (400 ms) par-dessus
 *   l'ancienne. Reanimated saute le fondu si « Réduire les animations » est activé.
 *
 * Plus tard, cet emplacement portera la couleur du club (DESIGN.md › La couleur
 * appartient au club).
 *
 * Le dégradé est un `linear-gradient` dessiné par React Native lui-même
 * (`experimental_backgroundImage`) : pas d'image, pas de bibliothèque.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, LayoutAnimationConfig } from 'react-native-reanimated';
import { colors, motion } from '../../utils/constants';
import { hexToRgb, safeOpacity, type CoverPalette } from '../../utils/coverPalette';

/** Beige, sable et chocolat clair : les trois tons de l'app, adoucis (DESIGN.md › Trois tons) */
export const NEUTRAL_BACKDROP: CoverPalette = ['#cdb8a3', '#a88f7b', '#e2d4c4'];

/**
 * Les arrêts du dégradé, de haut en bas : couleur de la palette, intensité max.
 * Clair en haut, plus soutenu en bas, comme toute surface de l'app (DESIGN.md ›
 * Dégradés, jamais d'aplat).
 */
const STOPS = [
  { at: '0%', color: 2, strength: 0.35 },
  { at: '55%', color: 0, strength: 0.4 },
  { at: '100%', color: 1, strength: 0.45 },
] as const;

/** Le dégradé CSS du fond pour une palette */
function backgroundFor(palette: CoverPalette | null | undefined): string {
  const source = palette?.length ? palette : NEUTRAL_BACKDROP;
  const stops = STOPS.map((stop) => {
    const hex = source[stop.color % source.length];
    const rgb = hexToRgb(hex).join(',');
    const alpha = safeOpacity(hex, stop.strength).toFixed(3);
    return `rgba(${rgb},${alpha}) ${stop.at}`;
  });
  return `linear-gradient(180deg, ${stops.join(', ')})`;
}

const fadeIn = FadeIn.duration(motion.duration.entrance).easing(
  Easing.bezier(...motion.easing.easeOutQuart)
);

export default function CoverBackdrop({ palette }: { palette?: CoverPalette | null }) {
  const background = useMemo(() => backgroundFor(palette), [palette]);

  // Fond affiché juste avant : il reste dessous pendant que le nouveau apparaît
  const previous = useRef(background);
  const under = previous.current;
  useEffect(() => {
    previous.current = background;
  }, [background]);

  return (
    <View style={styles.paper} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: under }]} />
      {/* Au premier affichage, pas de fondu : le fond est là tout de suite */}
      <LayoutAnimationConfig skipEntering>
        <Animated.View
          key={background}
          entering={fadeIn}
          style={[StyleSheet.absoluteFill, { experimental_backgroundImage: background }]}
        />
      </LayoutAnimationConfig>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgLight,
  },
});
