/**
 * Composant NotificationButton
 * 
 * Bouton de notification avec effet 3D (style Button3D secondary)
 * et pastille rouge quand il y a des notifications non lues.
 * 
 * Comment ça marche :
 * - Le bouton utilise le même style 3D que les Button3D secondary (fond crème colors.bgLight)
 * - Il contient une icône cloche (Lucide bell)
 * - Une pastille rouge (dot) s'affiche en haut à droite si hasUnread est true
 * - L'inner shadow est simulée via LinearGradient comme dans Button3D
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, creamAlpha, inkAlpha, shadowAlpha } from '../../utils/constants';
import { BellIcon } from 'lucide-react-native';

interface NotificationButtonProps {
  /** Callback quand on appuie sur le bouton */
  onPress: () => void;
  /** Affiche la pastille rouge (notifications non lues) */
  hasUnread?: boolean;
}

export default function NotificationButton({
  onPress,
  hasUnread = false,
}: NotificationButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      {/* Shadow container — porte l'ombre portée */}
      <View style={styles.shadowContainer}>
        {/* Bouton avec overflow hidden pour clipper les gradients */}
        <View style={styles.button}>
          {/* Inner shadows via LinearGradient, identique à Button3D secondary */}
          {!pressed ? (
            <LinearGradient
              colors={[
                creamAlpha(0.6),
                creamAlpha(0),
                shadowAlpha(0),
                shadowAlpha(0.15),
              ]}
              locations={[0, 0.3, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <LinearGradient
              colors={[
                shadowAlpha(0.15),
                shadowAlpha(0),
                creamAlpha(0),
                creamAlpha(0.6),
              ]}
              locations={[0, 0.3, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          {/* Stroke border */}
          <View style={styles.strokeBorder} />

          {/* Icône cloche */}
          <BellIcon size={24} color={colors.dark900} />
        </View>
      </View>

      {/* Pastille rouge de notification */}
      {hasUnread && (
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
    width: 40,
    height: 40,
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
