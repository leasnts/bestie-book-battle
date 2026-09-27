/**
 * useFitSheet — un sheet natif à la hauteur de son contenu, plafonné.
 *
 * Règle des sheets à contenu (fiche du livre, classement, journal,
 * bibliothèque) : le sheet s'ouvre **à la hauteur de tout son contenu**, et s'il
 * y en a trop, il monte au plus **jusque sous l'en-tête de l'accueil** (le
 * bouton bibliothèque et la mascotte restent visibles au-dessus) ; au-delà, on
 * fait défiler dedans.
 *
 * Utilisation, avec `sheetScreenOptions()` (déjà fait par `SheetPage`) :
 *
 *    const fit = useFitSheet();
 *    <ScrollView style={[styles.screen, fit.style]} onContentSizeChange={fit.onContentSizeChange} … />
 *
 * La liste reste l'enfant DIRECT de l'écran (cf. app/leaderboard.tsx) : c'est
 * elle qui se donne sa hauteur, et le sheet `fitToContents` la suit.
 */

import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../utils/constants';

/**
 * Hauteur de l'en-tête de l'accueil sous la zone de sécurité : marge du haut,
 * bouton bibliothèque de 44 pt, marge du bas (cf. styles.header de l'accueil).
 */
const HOME_HEADER_HEIGHT = spacing.sm + 44 + spacing.sm;
/** La place de la poignée au-dessus du contenu (mesuré) */
const SHEET_GRABBER_HEIGHT = 20;

export function useFitSheet() {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  // Le sheet monte au plus jusque sous l'en-tête de l'accueil
  const maxHeight = windowHeight - insets.top - HOME_HEADER_HEIGHT - SHEET_GRABBER_HEIGHT;

  const onContentSizeChange = useCallback((_width: number, height: number) => {
    setContentHeight(height);
  }, []);

  return {
    /** À poser sur la liste : sa hauteur, contenu mesuré plafonné */
    style: { height: Math.min(contentHeight ?? maxHeight, maxHeight) },
    onContentSizeChange,
    maxHeight,
  };
}
