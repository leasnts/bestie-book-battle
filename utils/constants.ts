/**
 * Constantes de l'application Reading Buddy
 * 
 * Ce fichier centralise toutes les valeurs constantes :
 * - Couleurs du thème
 * - Espacements
 * - Tailles de police
 * - Autres constantes utiles
 */

// Palette de couleurs principale
// Inspirée d'un design moderne avec indigo comme couleur primaire
export const colors = {
  // Couleurs principales
  primary: '#6366F1',           // Indigo - couleur principale de l'app
  primaryDark: '#4F46E5',       // Indigo plus foncé pour les états pressés
  primaryLight: '#A5B4FC',      // Indigo clair pour les backgrounds
  
  // Couleurs secondaires
  secondary: '#EC4899',         // Pink - accent pour les éléments importants
  secondaryDark: '#DB2777',
  secondaryLight: '#F9A8D4',
  
  // Couleurs sémantiques
  success: '#10B981',           // Vert - succès, progression positive
  successLight: '#D1FAE5',
  warning: '#F59E0B',           // Orange - avertissements
  warningLight: '#FEF3C7',
  error: '#EF4444',             // Rouge - erreurs
  errorLight: '#FEE2E2',
  
  // Couleurs spéciales
  crown: '#FCD34D',             // Or - pour la couronne du leader
  crownDark: '#F59E0B',
  streak: '#F97316',            // Orange vif - pour le streak 🔥
  
  // Neutres
  background: '#F9FAFB',        // Fond de l'application
  surface: '#FFFFFF',           // Cartes et surfaces
  surfaceVariant: '#F3F4F6',    // Surfaces alternatives
  
  // Textes
  text: '#111827',              // Texte principal
  textSecondary: '#6B7280',     // Texte secondaire
  textTertiary: '#9CA3AF',      // Texte tertiaire
  textOnPrimary: '#FFFFFF',     // Texte sur fond primaire
  
  // Bordures
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Espacements (basés sur un système de 4px)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Rayons de bordure
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Tailles de police
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Poids de police
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Ombres
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
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
  USER: '@reading_buddy/user',
  PROJECTS: '@reading_buddy/projects',
  PROGRESS: '@reading_buddy/progress',
  NOTIFICATIONS: '@reading_buddy/notifications',
};

