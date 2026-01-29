/**
 * Couleurs pour le thème de l'application
 * 
 * Ce fichier est utilisé par le système de thème de React Navigation
 * et certains composants qui utilisent l'ancien système.
 * 
 * Les couleurs principales sont définies dans utils/constants.ts
 */

const primaryColor = '#6366F1';
const secondaryColor = '#EC4899';

export default {
  light: {
    text: '#111827',
    background: '#F9FAFB',
    tint: primaryColor,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryColor,
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    tint: primaryColor,
    tabIconDefault: '#6B7280',
    tabIconSelected: primaryColor,
  },
};
