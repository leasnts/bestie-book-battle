/**
 * Composant NotificationButton
 * 
 * Bouton de notification avec effet 3D (style Button3D secondary)
 * et pastille rouge quand il y a des notifications non lues.
 * 
 * Comment ça marche :
 * - Le bouton utilise le même style 3D que les Button3D secondary (fond gris #f5f5f5)
 * - Il contient une icône cloche (Ionicons bell-outline)
 * - Une pastille rouge (dot) s'affiche en haut à droite si hasUnread est true
 * - L'inner shadow est simulée via LinearGradient comme dans Button3D
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../utils/constants';

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
                'rgba(255,255,255,0.6)',
                'rgba(255,255,255,0.0)',
                'rgba(0,0,0,0.0)',
                'rgba(30,30,30,0.15)',
              ]}
              locations={[0, 0.3, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <LinearGradient
              colors={[
                'rgba(30,30,30,0.15)',
                'rgba(0,0,0,0.0)',
                'rgba(255,255,255,0.0)',
                'rgba(255,255,255,0.6)',
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
          <Ionicons name="notifications-outline" size={24} color={colors.dark900} />
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strokeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  // La pastille rouge en haut à droite du bouton
  badge: {
    position: 'absolute',
    top: 5,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
