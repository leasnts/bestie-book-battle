/**
 * Composant Button3D - Boutons avec effet 3D pixel-perfect
 * 
 * Deux variants sémantiques :
 * - **primary** (bouton principal / "nir") : fond sombre #181d27, pour l'action principale
 * - **secondary** (bouton secondaire) : fond clair #f5f5f5, pour actions secondaires ou retour
 * 
 * Le bouton back est un Button3D variant="secondary" en mode icon-only.
 * Il peut aussi contenir du texte comme le primary (ex: "Retour", "Annuler").
 * 
 * Effet 3D : gradients concentrés aux bords, inversés au press.
 */

import React, { useState } from 'react';
import { 
  Pressable, 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Button3DProps {
  onPress: () => void;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icône personnalisée (ex. Lucide) pour mode iconOnly — remplace icon si fourni */
  iconComponent?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  size?: 'default' | 'compact';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button3D({
  onPress,
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconComponent,
  iconPosition = 'left',
  iconOnly = false,
  size = 'default',
  style,
  textStyle,
}: Button3DProps) {
  const isPrimary = variant === 'primary';
  const isCompact = size === 'compact';
  const showText = !iconOnly && (children !== undefined && children !== null && children !== '');
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      style={[
        (disabled || loading) && styles.buttonDisabled,
        isCompact && styles.compactWrapper,
        style,
      ]}
    >
      {/* Shadow container - porte le drop shadow iOS */}
      <View style={[
        styles.shadowContainer,
        isCompact && styles.shadowContainerCompact,
        isPrimary ? styles.primaryShadow : styles.secondaryShadow,
      ]}>
        
        {/* Bouton avec overflow hidden pour clipper les gradients */}
        <View style={[
          styles.button,
          isCompact && styles.buttonCompact,
          isPrimary ? styles.primaryFill : styles.secondaryFill,
        ]}>

          {/* ====== INNER SHADOWS simulées via LinearGradient ====== */}

          {isPrimary && !pressed && (
            <>
              {/* DEFAULT : reflet blanc en HAUT (bord dur, transition rapide) */}
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.22)',
                  'rgba(255,255,255,0.06)',
                  'rgba(255,255,255,0.0)',
                  'rgba(255,255,255,0.0)',
                ]}
                locations={[0, 0.1, 0.2, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientOverlay}
              />
              {/* DEFAULT : ombre noire en BAS (bord dur, transition rapide) */}
              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.0)',
                  'rgba(0,0,0,0.0)',
                  'rgba(0,0,0,0.25)',
                  'rgba(0,0,0,0.55)',
                ]}
                locations={[0, 0.8, 0.9, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientOverlay}
              />
            </>
          )}

          {isPrimary && pressed && (
            <>
              {/* PRESSED : ombre noire en HAUT (inversé, bord dur) */}
              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.55)',
                  'rgba(0,0,0,0.25)',
                  'rgba(0,0,0,0.0)',
                  'rgba(0,0,0,0.0)',
                ]}
                locations={[0, 0.1, 0.2, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientOverlay}
              />
              {/* PRESSED : reflet blanc en BAS (inversé, bord dur) */}
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.0)',
                  'rgba(255,255,255,0.0)',
                  'rgba(255,255,255,0.08)',
                  'rgba(255,255,255,0.22)',
                ]}
                locations={[0, 0.8, 0.9, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientOverlay}
              />
            </>
          )}

          {/* Secondary button inner shadows */}
          {!isPrimary && !pressed && (
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
              style={styles.gradientOverlay}
            />
          )}

          {!isPrimary && pressed && (
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
              style={styles.gradientOverlay}
            />
          )}

          {/* ====== STROKE : bordure gradient ====== */}
          <View style={[
            styles.strokeBorder,
            isCompact && styles.strokeBorderCompact,
            isPrimary ? styles.primaryStroke : styles.secondaryStroke,
          ]} />

          {/* ====== CONTENU ====== */}
          <View style={[styles.content, isCompact && styles.contentCompact]}>
            {loading ? (
              <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#535862'} size="small" />
            ) : iconOnly && iconComponent ? (
              iconComponent
            ) : iconOnly && icon ? (
              <Ionicons 
                name={icon} 
                size={isCompact ? 20 : 24} 
                color={isPrimary ? '#FFFFFF' : '#535862'} 
              />
            ) : (
              <>
                {icon && iconPosition === 'left' && (
                  <Ionicons 
                    name={icon} 
                    size={isCompact ? 20 : 24} 
                    color={isPrimary ? '#FFFFFF' : '#535862'} 
                    style={styles.iconLeft}
                  />
                )}
                {showText && (
                  <Text style={[
                    styles.text,
                    isPrimary ? styles.primaryText : styles.secondaryText,
                    textStyle,
                  ]}>
                    {children}
                  </Text>
                )}
                {icon && iconPosition === 'right' && (
                  <Ionicons 
                    name={icon} 
                    size={isCompact ? 20 : 24} 
                    color={isPrimary ? '#FFFFFF' : '#535862'} 
                    style={styles.iconRight}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.5,
  },
  compactWrapper: {
    width: 40,
    height: 40,
    minHeight: 40,
  },
  buttonCompact: {
    height: 40,
    borderRadius: 12,
  },
  
  // Container qui porte le drop shadow (x=0, y=4, blur=6, #000 25%)
  shadowContainer: {
    borderRadius: 24,
  },
  shadowContainerCompact: {
    borderRadius: 12,
  },
  primaryShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  secondaryShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Le bouton (overflow hidden pour les gradients)
  button: {
    height: 56,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryFill: {
    backgroundColor: '#181d27',
  },
  secondaryFill: {
    backgroundColor: '#f5f5f5',
  },

  // Gradients overlay (absoluteFill)
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Stroke border (1px inside, gradient simulé avec borderColor)
  strokeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
  },
  strokeBorderCompact: {
    borderRadius: 12,
  },
  primaryStroke: {
    borderColor: 'rgba(255,255,255,0.20)',
  },
  secondaryStroke: {
    borderColor: 'rgba(0,0,0,0.08)',
  },
  
  // Contenu
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingHorizontal: 24,
  },
  contentCompact: {
    paddingHorizontal: 0,
  },
  text: {
    fontFamily: 'WorkSans_SemiBold',
    fontSize: 16,
    fontWeight: '600' as any,
    lineHeight: 24,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#181d27',
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
});
