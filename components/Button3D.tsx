/**
 * Composant Button3D - Bouton avec effet 3D pixel-perfect
 * 
 * Reproduit fidèlement le design Figma "Button / Primary"
 * L'effet 3D est créé par des gradients concentrés aux bords :
 * - Bord supérieur : reflet lumineux blanc bien visible
 * - Bord inférieur : ombre sombre bien marquée
 * - Centre : couleur unie #181d27
 * 
 * Au press, les effets s'inversent → le bouton semble "enfoncé".
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
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
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
  iconPosition = 'left',
  style,
  textStyle,
}: Button3DProps) {
  const isPrimary = variant === 'primary';
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      style={[
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {/* Shadow container - porte le drop shadow iOS */}
      <View style={[
        styles.shadowContainer,
        isPrimary ? styles.primaryShadow : styles.secondaryShadow,
      ]}>
        
        {/* Bouton avec overflow hidden pour clipper les gradients */}
        <View style={[
          styles.button,
          isPrimary ? styles.primaryFill : styles.secondaryFill,
        ]}>

          {/* ====== INNER SHADOWS simulées via LinearGradient ====== */}

          {isPrimary && !pressed && (
            <>
              {/* DEFAULT : reflet blanc en HAUT (concentré sur les premiers ~30%) */}
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.22)',
                  'rgba(255,255,255,0.08)',
                  'rgba(255,255,255,0.0)',
                  'rgba(255,255,255,0.0)',
                ]}
                locations={[0, 0.25, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientOverlay}
              />
              {/* DEFAULT : ombre noire en BAS (concentrée sur les derniers ~30%) */}
              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.0)',
                  'rgba(0,0,0,0.0)',
                  'rgba(0,0,0,0.25)',
                  'rgba(0,0,0,0.55)',
                ]}
                locations={[0, 0.5, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientOverlay}
              />
            </>
          )}

          {isPrimary && pressed && (
            <>
              {/* PRESSED : ombre noire en HAUT (inversé) */}
              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.55)',
                  'rgba(0,0,0,0.25)',
                  'rgba(0,0,0,0.0)',
                  'rgba(0,0,0,0.0)',
                ]}
                locations={[0, 0.25, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientOverlay}
              />
              {/* PRESSED : reflet blanc en BAS (inversé) */}
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.0)',
                  'rgba(255,255,255,0.0)',
                  'rgba(255,255,255,0.08)',
                  'rgba(255,255,255,0.22)',
                ]}
                locations={[0, 0.5, 0.75, 1]}
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
            isPrimary ? styles.primaryStroke : styles.secondaryStroke,
          ]} />

          {/* ====== CONTENU ====== */}
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#181d27'} size="small" />
            ) : (
              <>
                {icon && iconPosition === 'left' && (
                  <Ionicons 
                    name={icon} 
                    size={24} 
                    color={isPrimary ? '#FFFFFF' : '#181d27'} 
                    style={styles.iconLeft}
                  />
                )}
                <Text style={[
                  styles.text,
                  isPrimary ? styles.primaryText : styles.secondaryText,
                  textStyle,
                ]}>
                  {children}
                </Text>
                {icon && iconPosition === 'right' && (
                  <Ionicons 
                    name={icon} 
                    size={24} 
                    color={isPrimary ? '#FFFFFF' : '#181d27'} 
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
  
  // Container qui porte le drop shadow (x=0, y=4, blur=6, #000 25%)
  shadowContainer: {
    borderRadius: 24,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
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
