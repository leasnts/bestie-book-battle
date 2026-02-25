/**
 * widget.ts
 *
 * Ce fichier gère la communication entre l'app React Native et le widget iOS.
 *
 * Comment ça marche :
 * - iOS permet à une app et son widget de partager un espace de stockage appelé
 *   "App Group". C'est comme un petit fichier de notes que les deux peuvent lire.
 * - On utilise la librairie `react-native-shared-group-preferences` pour écrire
 *   dans cet espace depuis React Native.
 * - Le widget Swift lira ces données pour les afficher sur l'écran d'accueil.
 *
 * À chaque fois qu'une donnée importante change (nouvelle page sauvegardée,
 * nouveau challenge actif), on appelle `updateWidgetData()`.
 */

import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { Platform } from 'react-native';

// L'identifiant de ton App Group — doit correspondre exactement à ce que tu as
// configuré dans Xcode (Signing & Capabilities → App Groups)
const APP_GROUP = 'group.com.leasantos.bestiebookbattle';

// La clé sous laquelle on stocke les données du widget
const WIDGET_KEY = 'widgetData';

/**
 * Les données que le widget va afficher.
 * Tu peux modifier ces champs selon ce que tu veux montrer sur le widget.
 */
export interface WidgetData {
  // Le livre en cours
  bookTitle: string;
  bookAuthor: string;
  // Ma progression
  myCurrentPage: number;
  myTotalPages: number;
  myStreak: number;
  // La progression de l'ami·e (optionnel, peut ne pas exister)
  friendName: string | null;
  friendCurrentPage: number | null;
  // Date de la dernière mise à jour (pour que le widget sache si c'est frais)
  lastUpdated: string;
}

/**
 * Écrit les données dans l'App Group partagé pour que le widget iOS puisse les lire.
 *
 * On ne fait rien sur Android car les widgets iOS n'existent pas là-bas.
 * Si l'App Group n'est pas encore configuré, on gère l'erreur silencieusement
 * pour ne pas bloquer l'application.
 */
export async function updateWidgetData(data: WidgetData): Promise<void> {
  // Les widgets iOS n'existent que sur iOS — inutile d'écrire sur Android
  if (Platform.OS !== 'ios') return;

  try {
    // On convertit l'objet en texte JSON car l'App Group ne stocke que des strings
    await SharedGroupPreferences.setItem(
      WIDGET_KEY,
      JSON.stringify(data),
      APP_GROUP
    );
  } catch (error) {
    // Si l'App Group n'est pas encore configuré dans Xcode, on reçoit une erreur ici.
    // On l'affiche en console mais on ne bloque pas l'app.
    console.warn('[Widget] Impossible d\'écrire dans l\'App Group :', error);
    console.warn('[Widget] Vérifie que l\'App Group "' + APP_GROUP + '" est configuré dans Xcode.');
  }
}
