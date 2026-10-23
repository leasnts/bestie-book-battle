/**
 * Composant Button3D - Boutons avec effet 3D pixel-perfect
 * 
 * Deux variants sémantiques :
 * - **primary** (bouton principal) : chocolat en relief (Bevel `ink` : cerne, liseré, fond en dégradé), pour l'action principale
 * - **secondary** (bouton secondaire) : papier en relief (Bevel `paper`), pour actions secondaires ou retour
 * 
 * Le bouton back est un Button3D variant="secondary" en mode icon-only.
 * Il peut aussi contenir du texte comme le primary (ex: "Retour", "Annuler").
 * 
 * Effet 3D : liseré clair en haut, inversé au press.
 */

import { feel } from '../utils/feel';
import { colors, fonts } from '../utils/constants';
import Bevel from './ui/Bevel';
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
      onPress={() => {
        feel('appui');
        onPress();
      }}
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
        
        {/* Bouton avec overflow hidden pour clipper le relief */}
        <View style={[
          styles.button,
          isCompact && styles.buttonCompact,
          isPrimary ? styles.primaryFill : styles.secondaryFill,
        ]}>

          {/* Cerne, liseré et fond en dégradé : chocolat ou papier (Bevel) */}
          <Bevel tone={isPrimary ? 'ink' : 'paper'} radius={isCompact ? 12 : 24} pressed={pressed} />

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
  // Ombre douce de la maquette : 0 2px 4px à 10 % (blur Figma 4 = rayon iOS 2)
  primaryShadow: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  secondaryShadow: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    backgroundColor: colors.dark950,
  },
  secondaryFill: {
    backgroundColor: colors.bgLight,
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
