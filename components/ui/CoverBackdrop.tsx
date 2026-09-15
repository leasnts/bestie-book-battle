/**
 * CoverBackdrop — le fond de l'accueil, aux couleurs de la couverture.
 *
 * Pourquoi : du verre posé sur un blanc chaud uni ne se voit presque pas, il n'a
 * rien à flouter. Le fond reprend donc les couleurs du livre en cours, en taches
 * douces sur le papier (mêmes positions que la maquette de l'accueil).
 *
 * - `palette` vient du challenge (`cover_palette`) : même fond pour tout le club.
 * - Chaque tache est dosée par `safeOpacity` : une couverture sombre donne une
 *   tache plus légère, jamais un fond qui rendrait les cadres illisibles.
 * - Pas de palette (couverture absente, en noir et blanc, pas encore calculée) :
 *   teintes noyer, affichées tout de suite.
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
import { FALLBACK_PALETTE, hexToRgb, safeOpacity, type CoverPalette } from '../../utils/coverPalette';

/** Les taches de la maquette : taille, centre, couleur de la palette, intensité max, fin du fondu */
const BLOBS = [
  { size: '115% 48%', at: '18% -4%', color: 0, strength: 0.62, fade: '62%' },
  { size: '80% 42%', at: '96% 6%', color: 1, strength: 0.42, fade: '66%' },
  { size: '90% 38%', at: '40% 52%', color: 2, strength: 0.32, fade: '72%' },
  { size: '70% 30%', at: '90% 88%', color: 1, strength: 0.22, fade: '70%' },
] as const;

/** Les dégradés CSS du fond pour une palette */
function backgroundFor(palette: CoverPalette | null | undefined): string {
  const source = palette?.length ? palette : FALLBACK_PALETTE;
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

export default function CoverBackdrop({ palette }: { palette: CoverPalette | null | undefined }) {
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
