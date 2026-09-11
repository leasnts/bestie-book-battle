/**
 * Constantes de l'application Bestie Book Battle
 * 
 * Ce fichier centralise toutes les valeurs constantes :
 * - Couleurs du thème (design system Figma)
 * - Espacements alignés avec Figma
 * - Tailles de police et polices personnalisées
 * - Styles de boutons réutilisables
 */

// Palette de couleurs depuis le design system Figma
export const colors = {
  // Dark colors (onboarding, boutons principaux)
  dark950: '#0a0d12',          // Fond splash screen
  dark900: '#181d27',          // Boutons principaux, texte principal
  dark800: '#13161b',          // Fond carte livre
  
  // Light colors (backgrounds)
  white: '#ffffff',            // Background inputs, cartes
  black: '#000000',            // Uniquement pour les ombres portées, jamais pour du texte ni un fond
  bgSecondary: '#fafafa',      // Background cartes non-sélectionnées
  bgLight: '#f5f5f5',          // Bouton back, bouton secondaire
  
  // Text colors
  textPrimary: '#181d27',      // Texte principal (900)
  textSecondary: '#414651',    // Texte secondaire (700)
  textTertiary: '#535862',     // Texte tertiaire (600)
  textPlaceholder: '#696e78',  // Placeholders (500)
  // Assombri depuis #717680 : cette valeur tombait à 4,18:1 sur le fond d'app
  // (#f5f5f5), sous le seuil AA de 4,5. Même teinte exactement — mêmes écarts
  // entre les canaux — huit crans plus sombre. Passe désormais partout :
  // 4,70 sur #f5f5f5, 4,90 sur #fafafa, 5,12 sur #ffffff.
  textSubtle: '#d5d7da',       // Texte subtle (300)
  
  // Border colors
  border: '#d5d7da',           // Bordure inputs (gray-300)
  borderLight: '#e9eaeb',      // Bordure secondaire
  
  // Alpha colors (pour les ombres et overlays)
  alphaBlack10: 'rgba(0,0,0,0.1)',
  alphaBlack02: 'rgba(0,0,0,0.02)',
  alphaWhite10: 'rgba(255,255,255,0.1)',
  alphaWhite20: 'rgba(255,255,255,0.2)',
  alphaWhite30: 'rgba(255,255,255,0.3)',
  alphaWhite90: 'rgba(255,255,255,0.9)',
  
  // Couleurs sémantiques (conservées de l'ancien)
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  
  // Couleurs spéciales
  crown: '#FCD34D',
  crownDark: '#F59E0B',
  streak: '#F97316',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Espacements alignés avec Figma (tokens spacing-*)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '6xl': 64,   // Pour les paddings top
};

// Rayons de bordure alignés avec Figma (tokens radius-*)
export const borderRadius = {
  xs: 2,       // Radius pour cover image
  sm: 8,
  md: 12,      // Bouton back, bouton upload
  lg: 20,      // Inputs
  xl: 24,      // Boutons principaux, cartes
  full: 9999,
};

// Polices personnalisées (Google Fonts)
export const fonts = {
  display: 'Rokkitt',   // Pour les titres et le texte impactant
  body: 'WorkSans',     // Pour le texte courant
};

// Tailles de police Figma
export const fontSize = {
  xs: 12,        // text-xs
  sm: 14,        // text-sm
  md: 16,        // text-md
  lg: 18,        
  xl: 20,
  '2xl': 24,     // display-xs
  '3xl': 36,     // display-md
  '4xl': 48,     // display-lg
  '5xl': 60,     // display-xl
  '6xl': 72,     // display-2xl (splash)
};

// Poids de police
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Ombres Figma
export const shadows = {
  // Shadow-xs (inputs)
  xs: {
    shadowColor: 'rgba(10,13,18,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  // Ombre bouton principal
  button: {
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  // Ombre bouton secondaire
  buttonLight: {
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  // Ombre carte sélectionnée
  cardSelected: {
    shadowColor: 'rgba(0,0,0,0.09)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
};

// Styles de boutons réutilisables (depuis Figma)
// Convention : primary = bouton principal (sombre), secondary = bouton secondaire (blanc/clair)
// Le bouton "retour" est un Button3D variant="secondary" en mode icon-only (size="compact")
export const buttonStyles = {
  // Bouton primaire (bouton "nir" / principal) - dark avec inner shadows
  primary: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.alphaWhite30,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    ...shadows.button,
  },
  // Bouton secondaire (blanc/clair) - utilisé pour Retour, Annuler, actions secondaires
  secondary: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.alphaBlack10,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    ...shadows.buttonLight,
  },
};

// Durées d'animation (en ms)
export const animationDuration = {
  fast: 150,
  normal: 300,
  slow: 500,
};

/**
 * Tokens de motion (design system Santos Studio).
 *
 * Les courbes sont stockées en points de contrôle bruts plutôt qu'en objets
 * Easing : ça évite d'importer Reanimated dans ce fichier de constantes, qui est
 * chargé absolument partout. Côté composant : `Easing.bezier(...motion.easeOutQuart)`.
 *
 * Règle : jamais de bounce ni d'elastic. Un objet réel ne rebondit pas quand il
 * s'arrête, il décélère.
 */
export const motion = {
  duration: {
    /** Feedback immédiat : appui bouton, toggle, changement de couleur */
    instant: 150,
    /** Changement d'état : ouverture de menu, hover, tooltip */
    standard: 200,
    /** Changement de layout : accordéon, modal, tiroir */
    slow: 300,
    /** Animation d'entrée : apparition d'écran, révélation de contenu */
    entrance: 400,
  },
  /** Décalage entre deux éléments d'une même entrée en cascade */
  stagger: 60,
  easing: {
    /** Doux et raffiné — la courbe par défaut */
    easeOutQuart: [0.25, 1, 0.5, 1] as const,
    /** Légèrement plus vif */
    easeOutQuint: [0.22, 1, 0.36, 1] as const,
    /** Affirmé, décidé */
    easeOutExpo: [0.16, 1, 0.3, 1] as const,
    /** Pour les éléments qui sortent */
    easeInQuart: [0.5, 0, 0.75, 0] as const,
  },
};

// Milestones pour les célébrations
export const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500];

// Messages de célébration
export const celebrationMessages = [
  '🎉 Bravo ! Continue comme ça !',
  '📚 Tu avances bien !',
  '🌟 Excellent travail !',
  '🔥 Tu es en feu !',
  '💪 Impressionnant !',
  '🚀 Inarrêtable !',
];

// Clés AsyncStorage
export const storageKeys = {
  USER: '@bestie_book_battle/user',
  PROJECTS: '@bestie_book_battle/projects',
  PROGRESS: '@bestie_book_battle/progress',
  NOTIFICATIONS: '@bestie_book_battle/notifications',
};

// Préférences de notifications par défaut (cohérent avec la DB)
// Format aligné avec notification_preferences JSONB dans users
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  enabled: true,
  daily_reminder: true,
  daily_reminder_time: '20:00',
  competitive_alerts: true,
  milestone_alerts: true,
  streak_alerts: true,
  goal_reminders: true,
  friend_activity: true,
  inactivity_alerts: true,
  other_finished_book: true,
} as const;

