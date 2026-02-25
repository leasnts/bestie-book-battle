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

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.com.leasantos.bestiebookbattle';
const WIDGET_KEY = 'widgetData';

/**
 * Les données que le widget va afficher.
 *
 * Le widget montre :
 * - Une jauge en arc (ouvert en bas) = progression moyenne de tous les participants
 * - Les 2 premiers du classement (triés par pages lues, décroissant)
 * - Une couronne sur le leader
 * - Les photos de profil encodées en base64 (70×70 JPEG)
 */
export interface WidgetData {
  totalPages: number;
  averageProgress: number; // 0.0 → 1.0
  participant1Name: string;
  participant1Page: number;
  participant1Photo: string | null;
  participant2Name: string | null;
  participant2Page: number | null;
  participant2Photo: string | null;
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
  } catch (error) {
    console.warn('[Widget] Impossible d\'écrire dans l\'App Group :', error);
  }
}

/**
 * Télécharge une photo de profil et la renvoie en base64.
 *
 * Approche simple et fiable : on télécharge l'image telle quelle
 * avec expo-file-system et on lit les octets en base64.
 * Pas de redimensionnement (ImageManipulator posait problème).
 *
 * Un JPEG de profil fait typiquement 20-100 Ko en base64,
 * ce qui reste largement dans les limites d'UserDefaults (~1 Mo).
 */
export async function profilePhotoToBase64(
  url: string | null | undefined
): Promise<string | null> {
  if (!url || Platform.OS !== 'ios') return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;

  try {
    const tempPath = FileSystem.cacheDirectory + `widget_avatar_${Date.now()}.jpg`;
    const download = await FileSystem.downloadAsync(url, tempPath);

    const base64 = await FileSystem.readAsStringAsync(download.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await FileSystem.deleteAsync(download.uri, { idempotent: true });

    return base64;
  } catch (error) {
    console.warn('[Widget] Erreur téléchargement photo profil :', url, error);
    return null;
  }
}
