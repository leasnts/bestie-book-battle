/**
 * CoverBackdrop — le fond de l'accueil, en taches douces sur le papier.
 *
 * Pourquoi : du verre posé sur un blanc chaud uni ne se voit presque pas, il n'a
 * rien à flouter. Le fond pose donc des taches dégradées sur le papier (mêmes
 * positions que la maquette de l'accueil).
 *
 * Par défaut, et c'est ce qu'utilise l'accueil : des tons **neutres** tirés de la
 * palette (beige, sable, chocolat clair). Les couleurs de la couverture en fond
 * agaçaient Lea (2026-09-24) : elles faisaient une couleur de plus sur l'écran.
 *
 * - `palette` (facultatif) : les couleurs d'une couverture (`cover_palette`),
 *   pour un écran qui parlerait d'un seul livre. Même fond pour tout le club.
 * - Chaque tache est dosée par `safeOpacity` : une couverture sombre donne une
 *   tache plus légère, jamais un fond qui rendrait les cadres illisibles.
 * - Changement de livre : la nouvelle palette apparaît en fondu (400 ms) par-dessus
 *   l'ancienne. Reanimated saute le fondu si « Réduire les animations » est activé.
 *
 * Plus tard, cet emplacement portera la couleur du club (DESIGN.md › La couleur
 * appartient au club).
 *
 * Les taches sont des `radial-gradient` dessinés par React Native lui-même
 * (`experimental_backgroundImage`) : pas d'image, pas de bibliothèque.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, LayoutAnimationConfig } from 'react-native-reanimated';
import { colors, motion } from '../../utils/constants';
import { hexToRgb, safeOpacity, type CoverPalette } from '../../utils/coverPalette';

/** Beige, sable et chocolat clair : les trois tons de l'app, adoucis (DESIGN.md › Trois tons) */
export const NEUTRAL_BACKDROP: CoverPalette = ['#cdb8a3', '#a88f7b', '#e2d4c4'];

/** Les taches de la maquette : taille, centre, couleur de la palette, intensité max, fin du fondu */
const BLOBS = [
  { size: '115% 48%', at: '18% -4%', color: 0, strength: 0.62, fade: '62%' },
  { size: '80% 42%', at: '96% 6%', color: 1, strength: 0.42, fade: '66%' },
  { size: '90% 38%', at: '40% 52%', color: 2, strength: 0.32, fade: '72%' },
  { size: '70% 30%', at: '90% 88%', color: 1, strength: 0.22, fade: '70%' },
] as const;

/** Les dégradés CSS du fond pour une palette */
function backgroundFor(palette: CoverPalette | null | undefined): string {
  const source = palette?.length ? palette : NEUTRAL_BACKDROP;
  return BLOBS.map((blob) => {
    const hex = source[blob.color % source.length];
    const rgb = hexToRgb(hex).join(',');
    const alpha = safeOpacity(hex, blob.strength).toFixed(3);
    // Fondu vers la même teinte transparente, pas vers `transparent` (noir
    // transparent) : sinon le milieu du dégradé grisaille.
    return `radial-gradient(${blob.size} at ${blob.at}, rgba(${rgb},${alpha}) 0%, rgba(${rgb},0) ${blob.fade})`;
  }).join(', ');
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
