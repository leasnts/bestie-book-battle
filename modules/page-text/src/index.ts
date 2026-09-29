/**
 * page-text — lire le texte d'une photo de page de livre, sur le téléphone
 * (Vision d'Apple, en français). Sert à citer un passage sans le recopier.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';

/** Une ligne lue, et sa place dans l'image (0 → 1, depuis le haut à gauche) */
export interface PageLine {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const PageText = requireOptionalNativeModule<{ recognize(uri: string): Promise<PageLine[]> }>(
  'PageText',
);

/** `false` tant que l'app n'a pas été recompilée avec le module */
export const isAvailable = PageText != null;

/** Les lignes de la photo, dans l'ordre de lecture (de haut en bas) */
export async function recognizePage(uri: string): Promise<PageLine[]> {
  if (!PageText) return [];
  const lines = await PageText.recognize(uri);
  return [...lines].sort((a, b) => a.y - b.y || a.x - b.x);
}
