/**
 * Composant HeaderIconButton
 *
 * Bouton carré 40 pt de l'en-tête de l'accueil, avec effet 3D (style Button3D
 * secondary) et pastille optionnelle.
 *
 * Usage aujourd'hui : à droite, la cloche des notifications (NotificationButton).
 * La bibliothèque, à gauche, est passée au rond en verre (GlassButton).
 *
 * Comment ça marche :
 * - Fond crème colors.bgLight, bordure encre à 10 %
 * - L'ombre interne est simulée par un LinearGradient, inversé à l'appui pour
 *   donner l'impression que le bouton s'enfonce
 * - La zone tactile est agrandie par hitSlop : 40 pt visibles, 44 pt touchables
 *   (minimum de la HIG)
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, creamAlpha, inkAlpha, shadowAlpha } from '../../utils/constants';

interface HeaderIconButtonProps {
  /** Icône Lucide à afficher */
  icon: LucideIcon;
  /** Callback quand on appuie sur le bouton */
  onPress: () => void;
  /** Nom lu par VoiceOver : une icône seule n'a pas de nom sinon */
  accessibilityLabel: string;
  /** Affiche la pastille rouge en haut à droite */
  hasBadge?: boolean;
}

const BUTTON_SIZE = 40;

export default function HeaderIconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  hasBadge = false,
}: HeaderIconButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={(44 - BUTTON_SIZE) / 2}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Shadow container — porte l'ombre portée */}
      <View style={styles.shadowContainer}>
        {/* Bouton avec overflow hidden pour clipper les gradients */}
        <View style={styles.button}>
          {/* Inner shadows via LinearGradient, identique à Button3D secondary */}
          <LinearGradient
            colors={
              pressed
                ? [shadowAlpha(0.15), shadowAlpha(0), creamAlpha(0), creamAlpha(0.6)]
                : [creamAlpha(0.6), creamAlpha(0), shadowAlpha(0), shadowAlpha(0.15)]
            }
            locations={[0, 0.3, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Stroke border */}
          <View style={styles.strokeBorder} />

          <Icon size={24} color={colors.dark900} />
        </View>
      </View>

      {hasBadge && (
        <View style={styles.badge}>
          <View style={styles.badgeInner} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 12,
    backgroundColor: colors.bgLight,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strokeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: inkAlpha(0.1),
  },
  // La pastille rouge en haut à droite du bouton
  badge: {
    position: 'absolute',
    top: 5,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});
