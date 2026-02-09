/**
 * Utilitaires pour le partage et les invitations
 * 
 * Ce fichier contient les fonctions pour :
 * - Générer des liens d'invitation
 * - Partager via l'API native
 * - Copier dans le presse-papier
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Project } from '../types';

// URL de base pour les deep links
// À remplacer par ton URL de production ou scheme personnalisé
const APP_SCHEME = 'bestie-book-battle';
const WEB_URL = 'https://bestie-book-battle.app'; // URL fictive pour le moment

/**
 * Génère un lien d'invitation pour un projet
 * 
 * Le lien utilise le deep linking pour ouvrir directement
 * l'écran de join dans l'app.
 * 
 * @param project - Le projet à partager
 * @returns L'URL de partage
 */
export function generateInviteLink(project: Project): string {
  // Sur mobile, on utilise le scheme de l'app
  // Sur web, on utilise l'URL web
  if (Platform.OS === 'web') {
    return `${WEB_URL}/join/${project.inviteCode}`;
  }
  
  return `${APP_SCHEME}://join/${project.inviteCode}`;
}

/**
 * Génère un message de partage avec le lien
 * 
 * @param project - Le projet à partager
 * @returns Le message formaté
 */
export function generateShareMessage(project: Project): string {
  return `📚 Rejoins-moi pour lire "${project.bookTitle}" ensemble !\n\n` +
    `Code d'invitation : ${project.inviteCode}\n\n` +
    `Télécharge Bestie Book Battle et utilise ce code pour nous rejoindre !`;
}

/**
 * Partage un projet via l'API native de partage
 * 
 * Cette fonction ouvre le menu de partage natif iOS
 * qui permet de partager par Messages, WhatsApp, email, etc.
 * 
 * @param project - Le projet à partager
 * @returns true si le partage a réussi
 */
export async function shareProject(project: Project): Promise<boolean> {
  try {
    const message = generateShareMessage(project);
    const link = generateInviteLink(project);
    
    const result = await Share.share({
      message: message,
      // iOS permet de spécifier URL séparément
      url: link,
      title: `Invitation à lire "${project.bookTitle}"`,
    });
    
    // Vérifie si l'utilisateur a partagé
    if (result.action === Share.sharedAction) {
      return true;
    } else if (result.action === Share.dismissedAction) {
      // L'utilisateur a annulé (iOS uniquement)
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur de partage:', error);
    return false;
  }
}

/**
 * Copie le code d'invitation dans le presse-papier
 * 
 * @param inviteCode - Le code à copier
 */
export async function copyInviteCode(inviteCode: string): Promise<void> {
  await Clipboard.setStringAsync(inviteCode);
}

/**
 * Copie le lien d'invitation dans le presse-papier
 * 
 * @param project - Le projet
 */
export async function copyInviteLink(project: Project): Promise<void> {
  const link = generateInviteLink(project);
  await Clipboard.setStringAsync(link);
}

/**
 * Parse un lien d'invitation pour extraire le code
 * 
 * Utilisé quand l'utilisateur ouvre l'app via un deep link.
 * 
 * @param url - L'URL complète
 * @returns Le code d'invitation ou null
 */
export function parseInviteLink(url: string): string | null {
  try {
    // Format attendu: bestie-book-battle://join/CODE ou https://bestie-book-battle.app/join/CODE
    const regex = /join\/([A-Z0-9]{6})/i;
    const match = url.match(regex);
    
    return match ? match[1].toUpperCase() : null;
  } catch {
    return null;
  }
}

/**
 * Vérifie si un code d'invitation est valide (format)
 * 
 * @param code - Le code à vérifier
 * @returns true si le format est valide
 */
export function isValidInviteCode(code: string): boolean {
  // Le code doit avoir 6 caractères alphanumériques
  return /^[A-Z0-9]{6}$/i.test(code);
}

