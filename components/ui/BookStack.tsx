/**
 * Composant BookStack
 * 
 * Affiche une pile de couvertures de livres empilées avec le livre actif
 * au premier plan montrant les détails (auteur, titre, pages, progression circulaire).
 * 
 * Comment ça marche :
 * - Les couvertures sont empilées horizontalement avec un overlap négatif (marginRight négatif)
 * - La dernière carte (livre actif) est plus large et affiche les détails
 * - Un CircularProgress montre la progression de lecture
 * - Quand on tap sur la section, ça déclenche onPress (pour ouvrir l'étagère de livres)
 * 
 * La pile est alignée à droite (justify-end) comme dans le Figma,
 * les petites covers se superposent, et le livre actif est au premier plan.
 */

import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, borderRadius, spacing } from '../../utils/constants';
import CircularProgress from './CircularProgress';

interface BookStackProps {
  /** Titre du livre actif */
  bookTitle: string;
  /** Auteur du livre actif */
  bookAuthor: string;
  /** Nombre total de pages */
  totalPages: number;
  /** Pourcentage de progression moyen */
  progressPercentage: number;
  /** URL/source de la couverture du livre actif */
  coverUrl: string | null;
  /** Liste des URLs de covers des autres challenges (pour les covers empilées derrière) */
  otherCovers?: (string | null)[];
  /** Callback quand on tap pour ouvrir l'étagère */
  onPress: () => void;
}

// Image par défaut si pas de couverture
const DEFAULT_COVER = require('../../assets/images/random_cover_1.png');

/**
 * Résout la source d'image : gère les URLs et les images locales
 */
const resolveImage = (ref: string | null | undefined) => {
  if (!ref) return DEFAULT_COVER;
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return { uri: ref };
  }
  return DEFAULT_COVER;
};

export default function BookStack({
  bookTitle,
  bookAuthor,
  totalPages,
  progressPercentage,
  coverUrl,
  otherCovers = [],
  onPress,
}: BookStackProps) {
  // On prend maximum 3 covers d'arrière-plan (les autres challenges)
  const backgroundCovers = otherCovers.slice(0, 3);

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* Les covers d'arrière-plan (empilées, petites) */}
      <View style={styles.stackRow}>
        {backgroundCovers.map((cover, index) => (
          <View
            key={`bg-cover-${index}`}
            style={[
              styles.smallCoverWrapper,
              // Chaque cover se superpose à la précédente avec un décalage
              { zIndex: index, marginRight: -40 },
            ]}
          >
            <View style={styles.smallCoverShadow}>
              <Image
                source={resolveImage(cover)}
                style={styles.smallCover}
                contentFit="cover"
              />
            </View>
          </View>
        ))}

        {/* Le livre actif (premier plan) avec détails */}
        <View style={[styles.activeCoverWrapper, { zIndex: backgroundCovers.length + 1 }]}>
          <View style={styles.activeCard}>
            {/* Couverture du livre actif */}
            <Image
              source={resolveImage(coverUrl)}
              style={styles.activeCover}
              contentFit="cover"
            />

            {/* Infos du livre : auteur, titre, pages */}
            <View style={styles.bookInfo}>
              <View style={styles.bookDetails}>
                <View style={styles.textAndBadge}>
                  {/* Auteur */}
                  <Text style={styles.author} numberOfLines={1}>
                    {bookAuthor || 'Auteur inconnu'}
                  </Text>
                  {/* Titre */}
                  <Text style={styles.title} numberOfLines={1}>
                    {bookTitle}
                  </Text>
                  {/* Badge nombre de pages */}
                  <View style={styles.pagesBadge}>
                    <Text style={styles.pagesText}>{totalPages}p</Text>
                  </View>
                </View>
              </View>

              {/* Progression circulaire */}
              <CircularProgress
                percentage={progressPercentage}
                size={56}
                strokeWidth={4}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  // La rangée horizontale qui contient les covers empilées
  stackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 0,
  },
  // Wrapper pour les petites covers d'arrière-plan
  smallCoverWrapper: {
    // marginRight négatif appliqué dynamiquement
  },
  smallCoverShadow: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
  },
  // Petite cover (70x50) avec coins arrondis
  smallCover: {
    width: 50,
    height: 70,
    borderRadius: 20,
  },
  // Wrapper du livre actif (plus large pour les détails)
  activeCoverWrapper: {
    flex: 1,
  },
  // Carte du livre actif : cover + infos
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
  },
  // Cover du livre actif (50x70 comme les autres)
  activeCover: {
    width: 50,
    height: 70,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
  },
  // Zone d'infos à droite de la cover active
  bookInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  bookDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  textAndBadge: {
    gap: 4,
  },
  // Nom de l'auteur
  author: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  // Titre du livre
  title: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  // Badge du nombre de pages
  pagesBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  pagesText: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    textAlign: 'center',
  },
});
