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
  bgSecondary: '#fafafa',      // Background cartes non-sélectionnées
  bgLight: '#f5f5f5',          // Bouton back, bouton secondaire
  
  // Text colors
  textPrimary: '#181d27',      // Texte principal (900)
  textSecondary: '#414651',    // Texte secondaire (700)
  textTertiary: '#535862',     // Texte tertiaire (600)
  textPlaceholder: '#717680',  // Placeholders (500)
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
export const buttonStyles = {
  // Bouton principal dark avec inner shadows
  primary: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.alphaWhite30,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    ...shadows.button,
    // Les inner shadows doivent être ajoutés via un View absolu
  },
  // Bouton secondaire light
  secondary: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.alphaWhite30,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    ...shadows.buttonLight,
  },
  // Bouton back
  back: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.alphaBlack10,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...shadows.xs,
  },
};

// Durées d'animation (en ms)
export const animationDuration = {
  fast: 150,
  normal: 300,
  slow: 500,
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

