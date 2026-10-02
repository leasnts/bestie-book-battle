/**
 * Composant Button3D - Boutons avec effet 3D pixel-perfect
 * 
 * Deux variants sémantiques :
 * - **primary** (bouton principal / "nir") : fond noyer foncé (colors.dark900), pour l'action principale
 * - **secondary** (bouton secondaire) : fond crème (colors.bgLight), pour actions secondaires ou retour
 * 
 * Le bouton back est un Button3D variant="secondary" en mode icon-only.
 * Il peut aussi contenir du texte comme le primary (ex: "Retour", "Annuler").
 * 
 * Effet 3D : gradients concentrés aux bords, inversés au press.
 */

import { colors, creamAlpha, fonts, inkAlpha, shadowAlpha } from '../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CirclePlusIcon,
  CopyIcon,
  PlusIcon,
  ShareIcon,
  Trash2Icon,
  XIcon,
  type LucideIcon,
} from 'lucide-react-native';
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
const ICON_LABELS = new Map<LucideIcon, string>([
  [ChevronLeftIcon, 'Retour'],
  [ChevronRightIcon, 'Suivant'],
  [XIcon, 'Fermer'],
  [CheckIcon, 'Valider'],
  [PlusIcon, 'Ajouter'],
  [CirclePlusIcon, 'Ajouter'],
  [Trash2Icon, 'Supprimer'],
  [CopyIcon, 'Copier'],
  [ShareIcon, 'Partager'],
]);

interface Button3DProps {
  onPress: () => void;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  /** Icône Lucide (le composant, pas un nom) : icon={ChevronLeftIcon}. Seule banque d'icônes de l'app. */
  icon?: LucideIcon;
  /** Élément déjà construit, quand taille ou couleur doivent sortir de l'ordinaire — remplace icon */
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
  const Icon = icon;
  const leadingIcon = iconComponent ?? (Icon ? (
    <Icon size={isCompact ? 20 : 24} color={isPrimary ? colors.white : colors.textTertiary} />
  ) : null);
  const [pressed, setPressed] = useState(false);

  // En mode texte, le libellé visible fait office de nom : on ne le duplique pas.
  // En mode icône seule, il n'y a rien à lire sans `accessibilityLabel`.
  const resolvedLabel =
    accessibilityLabel ??
    (typeof children === 'string' ? children : undefined) ??
    (icon ? ICON_LABELS.get(icon) : undefined);

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
              {/* DEFAULT : reflet crème en HAUT (bord dur, transition rapide) */}
              <LinearGradient
                colors={[
                  creamAlpha(0.22),
                  creamAlpha(0.06),
                  creamAlpha(0),
                  creamAlpha(0),
                ]}
                locations={[0, 0.1, 0.2, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientOverlay}
              />
              {/* DEFAULT : ombre marron en BAS (bord dur, transition rapide) */}
              <LinearGradient
                colors={[
                  shadowAlpha(0),
                  shadowAlpha(0),
                  shadowAlpha(0.25),
                  shadowAlpha(0.55),
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
              {/* PRESSED : ombre marron en HAUT (inversé, bord dur) */}
              <LinearGradient
                colors={[
                  shadowAlpha(0.55),
                  shadowAlpha(0.25),
                  shadowAlpha(0),
                  shadowAlpha(0),
                ]}
                locations={[0, 0.1, 0.2, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientOverlay}
              />
              {/* PRESSED : reflet crème en BAS (inversé, bord dur) */}
              <LinearGradient
                colors={[
                  creamAlpha(0),
                  creamAlpha(0),
                  creamAlpha(0.08),
                  creamAlpha(0.22),
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
                creamAlpha(0.6),
                creamAlpha(0),
                shadowAlpha(0),
                shadowAlpha(0.15),
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
                shadowAlpha(0.15),
                shadowAlpha(0),
                creamAlpha(0),
                creamAlpha(0.6),
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
            ) : iconOnly && leadingIcon ? (
              leadingIcon
            ) : (
              <>
                {leadingIcon && iconPosition === 'left' && (
                  <View style={styles.iconLeft}>{leadingIcon}</View>
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
                {leadingIcon && iconPosition === 'right' && (
                  <View style={styles.iconRight}>{leadingIcon}</View>
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
  
  // Container qui porte le drop shadow (x=0, y=4, blur=6, ombre marron 25%)
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
    borderColor: creamAlpha(0.2),
  },
  secondaryStroke: {
    borderColor: inkAlpha(0.08),
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
    fontFamily: fonts.bodyBold,
    fontSize: 16,
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
