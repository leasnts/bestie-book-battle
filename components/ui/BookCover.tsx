/**
 * Composant BookCover
 *
 * Une couverture de livre, partagée entre la carte du livre en cours (accueil)
 * et la bibliothèque (sheet « Mes livres »).
 *
 * Deux états :
 * - pas fini  → la couverture seule, avec une ombre latérale (et un filet fin
 *               si `outlined`, pour détacher une couverture claire du fond)
 * - terminé   → la couverture posée sur un fond sombre qui déborde de 3 px,
 *               et un marque-page ✓ en haut à gauche
 *
 * La couverture REMPLIT son parent : c'est le parent qui fixe la taille. Ça
 * permet à l'accueil de l'étirer à la hauteur du texte, et à la bibliothèque
 * de lui donner une taille fixe.
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Challenge } from '../../types/supabase';
import { colors, creamAlpha, inkAlpha, shadowAlpha } from '../../utils/constants';

/** Ratio d'une couverture : 50:70 (largeur:hauteur) */
export const COVER_RATIO = 50 / 70;

// Image par défaut si pas de couverture
const DEFAULT_COVER = require('../../assets/images/random_cover_1.png');

/**
 * Résout la source d'image.
 * Si c'est une URL http(s), on renvoie { uri: url }. Sinon, l'image par défaut.
 */
export const resolveCoverImage = (ref: string | null | undefined) => {
  if (!ref) return DEFAULT_COVER;
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return { uri: ref };
  }
  return DEFAULT_COVER;
};

/** Un livre est terminé quand le challenge est clos ou que le groupe a tout lu */
export function isChallengeDone(challenge: Challenge): boolean {
  return challenge.status === 'completed' || challenge.average_progress_percentage >= 100;
}

// ─── Badge marque-page ✓ (SVG) ──────────────────────────────────
/**
 * Petit ruban avec un checkmark crème, en haut à gauche des livres terminés.
 * Rectangle avec une encoche en V en bas, dessiné en SVG pour rester net.
 */
const BookmarkCheckBadge = () => (
  <View style={styles.doneBadge}>
    <Svg width={14} height={18} viewBox="0 0 14 18" fill="none">
      <Path d="M0 0H14V14.5L7 11.5L0 14.5V0Z" fill={colors.dark900} />
      <Path
        d="M3.5 6.5L6 9L10.5 4.5"
        stroke={colors.white}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

interface BookCoverProps {
  coverUrl: string | null | undefined;
  /** true = affiche le fond sombre et le marque-page ✓ */
  done?: boolean;
  /** true = filet fin autour d'une couverture non terminée */
  outlined?: boolean;
}

export default function BookCover({ coverUrl, done = false, outlined = false }: BookCoverProps) {
  if (done) {
    return (
      <View style={styles.doneContainer}>
        <View style={styles.doneBackground}>
          <View style={styles.doneInnerShadow} />
        </View>
        <Image source={resolveCoverImage(coverUrl)} style={styles.cover} contentFit="cover" />
        <BookmarkCheckBadge />
      </View>
    );
  }

  return (
    <View style={styles.shadow}>
      <Image source={resolveCoverImage(coverUrl)} style={styles.cover} contentFit="cover" />
      {outlined && <View style={styles.outline} pointerEvents="none" />}
    </View>
  );
}

const COVER_SHADOW = {
  shadowColor: colors.black,
  shadowOffset: { width: -4, height: 0 },
  shadowOpacity: 0.26,
  shadowRadius: 4,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  shadow: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    ...COVER_SHADOW,
  },
  cover: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  // Posé PAR-DESSUS l'image : une bordure sur le conteneur rognerait la couverture
  outline: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: inkAlpha(0.15),
  },

  // ── Livre terminé ──
  doneContainer: {
    width: '100%',
    height: '100%',
    ...COVER_SHADOW,
  },
  // Fond sombre derrière la couverture — déborde de 3 px de chaque côté
  doneBackground: {
    position: 'absolute',
    left: -3,
    top: -3,
    right: -3,
    bottom: -3,
    borderRadius: 2,
    backgroundColor: colors.dark900,
    overflow: 'hidden',
  },
  // React Native n'a pas de `box-shadow: inset` : on simule les ombres internes
  // avec des bordures semi-transparentes (reflet en haut/gauche, ombre en bas/droite)
  doneInnerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 1,
    borderTopColor: creamAlpha(0.2),
    borderLeftColor: creamAlpha(0.15),
    borderBottomColor: shadowAlpha(0.35),
    borderRightColor: shadowAlpha(0.2),
  },
  // Le marque-page déborde légèrement au-dessus de la couverture
  doneBadge: {
    position: 'absolute',
    top: -2,
    left: 4,
    width: 14,
    height: 18,
  },
});
