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

import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

/**
 * Noms par défaut des boutons icône seule.
 *
 * Un bouton sans texte ne dit rien au lecteur d'écran : il annonce « bouton »,
 * point. Plutôt que de répéter un `accessibilityLabel` sur chacun des vingt et
 * quelques boutons de l'app, on déduit le nom de l'icône. Un libellé explicite
 * passé en prop l'emporte toujours, et toute icône absente de cette table
 * demande le sien.
 */
const ICON_LABELS: Partial<Record<string, string>> = {
  'chevron-back': 'Retour',
  'chevron-forward': 'Suivant',
  close: 'Fermer',
  checkmark: 'Valider',
  add: 'Ajouter',
  'add-circle-outline': 'Ajouter',
  trash: 'Supprimer',
  'trash-outline': 'Supprimer',
  'copy-outline': 'Copier',
  share: 'Partager',
  'share-outline': 'Partager',
};

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
  /**
   * Nom annoncé par VoiceOver.
   *
   * Obligatoire en mode `iconOnly` : sans texte visible, le lecteur d'écran
   * n'a rien à lire et annonce seulement « bouton ». Quand le bouton porte un
   * libellé, celui-ci sert automatiquement de nom et cette prop est inutile.
   */
  accessibilityLabel?: string;
  /** Précision lue après le nom, pour le contexte (ex. « enregistre ta page ») */
  accessibilityHint?: string;
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
  accessibilityLabel,
  accessibilityHint,
}: Button3DProps) {
  const isPrimary = variant === 'primary';
  const isCompact = size === 'compact';
  const showText = !iconOnly && (children !== undefined && children !== null && children !== '');
  const [pressed, setPressed] = useState(false);

  // En mode texte, le libellé visible fait office de nom : on ne le duplique pas.
  // En mode icône seule, il n'y a rien à lire sans `accessibilityLabel`.
  const resolvedLabel =
    accessibilityLabel ??
    (typeof children === 'string' ? children : undefined) ??
    (icon ? ICON_LABELS[icon] : undefined);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      accessibilityHint={accessibilityHint}
      // Annonce « estompé » quand le bouton est inactif, et « en cours » pendant
      // une action asynchrone — sinon rien ne signale que l'appui n'a rien fait.
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      /*
        Le format compact mesure 40 pt, valeur venue du Figma, alors que la HIG
        demande 44 pt minimum. On garde les 40 pt visuels — les changer
        décalerait toutes les maquettes — et on étend la zone tactile de 2 pt
        tout autour. Le bouton se voit pareil et s'attrape mieux.
      */
      hitSlop={isCompact ? 2 : undefined}
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
              <ActivityIndicator color={isPrimary ? colors.white : colors.textTertiary} size="small" />
            ) : iconOnly && iconComponent ? (
              iconComponent
            ) : iconOnly && icon ? (
              <Ionicons 
                name={icon} 
                size={isCompact ? 20 : 24} 
                color={isPrimary ? colors.white : colors.textTertiary} 
              />
            ) : (
              <>
                {icon && iconPosition === 'left' && (
                  <Ionicons 
                    name={icon} 
                    size={isCompact ? 20 : 24} 
                    color={isPrimary ? colors.white : colors.textTertiary} 
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
                    color={isPrimary ? colors.white : colors.textTertiary} 
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  secondaryShadow: {
    shadowColor: colors.black,
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
    backgroundColor: colors.dark900,
  },
  secondaryFill: {
    backgroundColor: colors.bgLight,
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
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 16,
    fontWeight: '600' as any,
    lineHeight: 24,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
});
