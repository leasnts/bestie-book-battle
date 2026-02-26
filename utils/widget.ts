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

import { NativeModules, Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const { WidgetRefreshModule } = NativeModules;

const APP_GROUP = 'group.com.leasantos.bestiebookbattle';
const WIDGET_KEY = 'widgetData';

/**
 * Les données que le widget va afficher.
 *
 * Le widget montre :
 * - Une jauge en arc (ouvert en bas) = progression moyenne de tous les participants
 * - Les 2 premiers du classement (triés par pages lues, décroissant)
 * - Une couronne sur le leader
 */
export interface WidgetData {
  totalPages: number;
  averageProgress: number; // 0.0 → 1.0
  participant1Name: string;
  participant1Page: number;
  participant2Name: string | null;
  participant2Page: number | null;
  lastUpdated: string;
}

/**
 * Écrit les données dans l'App Group partagé pour que le widget iOS puisse les lire.
 */
export async function updateWidgetData(data: WidgetData): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    await SharedGroupPreferences.setItem(
      WIDGET_KEY,
      JSON.stringify(data),
      APP_GROUP
    );

    WidgetRefreshModule?.reloadAllTimelines();
  } catch (error) {
    console.warn('[Widget] Impossible d\'écrire dans l\'App Group :', error);
  }
}
