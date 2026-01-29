/**
 * Composant Avatar
 * 
 * Affiche la photo de profil d'un utilisateur ou ses initiales
 * si aucune photo n'est disponible.
 * 
 * Le composant utilise expo-image pour un chargement optimisé
 * avec cache automatique et placeholder pendant le chargement.
 * 
 * Il accepte soit une URL (string), soit une image locale (require).
 */

import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { colors, borderRadius } from '../../utils/constants';

// Type pour la source d'image : soit une URL, soit un require() local
type PhotoSource = string | ImageSource | null | undefined;

interface AvatarProps {
  /** Source de la photo : URL (string) ou image locale (require) */
  photoUrl?: PhotoSource;
  /** Nom de l'utilisateur (pour générer les initiales) */
  name: string;
  /** Taille de l'avatar en pixels */
  size?: number;
  /** Style de bordure */
  borderWidth?: number;
  borderColor?: string;
}

export function Avatar({
  photoUrl,
  name,
  size = 48,
  borderWidth = 0,
  borderColor = colors.primary,
}: AvatarProps) {
  // Génère les initiales à partir du nom
  // Ex: "Jean Dupont" -> "JD"
  const getInitials = (): string => {
    if (!name) return '?';
    
    const words = name.trim().split(' ');
    
    if (words.length === 1) {
      // Un seul mot : prend les 2 premières lettres
      return words[0].substring(0, 2).toUpperCase();
    }
    
    // Plusieurs mots : prend la première lettre de chaque
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  
  // Génère une couleur de fond basée sur le nom
  // Cela assure une couleur consistante pour chaque utilisateur
  const getBackgroundColor = (): string => {
    const backgroundColors = [
      '#6366F1', // Indigo
      '#EC4899', // Pink
      '#10B981', // Green
      '#F59E0B', // Amber
      '#3B82F6', // Blue
      '#8B5CF6', // Purple
      '#EF4444', // Red
      '#14B8A6', // Teal
    ];
    
    // Hash simple basé sur le nom
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return backgroundColors[Math.abs(hash) % backgroundColors.length];
  };
  
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2, // Cercle parfait
    borderWidth,
    borderColor,
  };
  
  // Détermine la source de l'image :
  // - Si c'est une string (URL), on utilise { uri: photoUrl }
  // - Si c'est un nombre (require local), on l'utilise directement
  const getImageSource = (): ImageSource | null => {
    if (!photoUrl) return null;
    
    // Si c'est une URL (string), on la wrappe dans un objet { uri: ... }
    if (typeof photoUrl === 'string') {
      return { uri: photoUrl };
    }
    
    // Sinon c'est déjà un ImageSource (venant de require())
    return photoUrl;
  };
  
  const imageSource = getImageSource();
  
  // Si on a une photo, on l'affiche
  if (imageSource) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Image
          source={imageSource}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
          transition={200} // Animation de fade-in
          placeholder={null}
        />
      </View>
    );
  }
  
  // Sinon, on affiche les initiales sur fond coloré
  return (
    <View
      style={[
        styles.container,
        styles.initialsContainer,
        containerStyle,
        { backgroundColor: getBackgroundColor() },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: size * 0.4 }, // Taille proportionnelle
        ]}
      >
        {getInitials()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden', // Cache tout ce qui dépasse du cercle
  },
  image: {
    backgroundColor: colors.surfaceVariant,
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
});

