/**
 * Composant PageScrollPicker
 *
 * Sélecteur de page horizontal avec scroll fluide :
 * - Largeur fixe par item pour un scroll fiable + snap
 * - Quand le scroll s'arrête, le numéro le plus proche se centre sur l'écran
 * - Numéro central : 128px, noir. Adjacents : 72px, gris transparent
 * - adjustsFontSizeToFit adapte la taille aux gros numéros (3-4 chiffres)
 *   sans jamais tronquer ni couper le nombre
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../../utils/constants';

// Largeur de chaque cellule. 180px suffit pour afficher 1-2 chiffres à pleine
// taille (128px). Pour 3-4 chiffres, adjustsFontSizeToFit réduit légèrement
// la taille pour que le nombre entier soit toujours visible.
// Pas de gap entre les cellules → les nombres adjacents restent bien visibles.
const ITEM_WIDTH = 180;
const STEP = ITEM_WIDTH;

interface PageScrollPickerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  savedPage: number;
}

export default function PageScrollPicker({
  currentPage,
  totalPages,
  onPageChange,
  savedPage,
}: PageScrollPickerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const currentCenterRef = useRef(currentPage);
  const [displayPage, setDisplayPage] = useState(currentPage);
  const isUserScrolling = useRef(false);
  // Quand le changement vient du scroll user, on évite que le useEffect re-scrolle (conflit de gestes)
  const skipNextScrollFromEffect = useRef(false);
  // Ref pour toujours lire la dernière valeur de savedPage dans le timeout du montage
  const savedPageRef = useRef(savedPage);
  savedPageRef.current = savedPage;

  const pages = Array.from({ length: totalPages + 1 }, (_, i) => i);
  // Pour que le centre de chaque cellule soit à screenWidth/2 quand on a scrollé vers elle
  const horizontalPadding = (screenWidth - STEP) / 2;

  // Montage : scroll vers la page sauvegardée.
  // On utilise savedPageRef.current (et non savedPage directement) pour éviter
  // la race condition : si les données chargent depuis Supabase en < 100 ms,
  // le timeout lit la valeur à jour et ne remet pas le scroll à 0.
  useEffect(() => {
    const t = setTimeout(() => {
      const latestSavedPage = savedPageRef.current;
      flatListRef.current?.scrollToOffset({
        offset: latestSavedPage * STEP,
        animated: false,
      });
      setDisplayPage(latestSavedPage);
      currentCenterRef.current = latestSavedPage;
    }, 100);
    return () => clearTimeout(t);
  }, []);

  // Undo / changement programmatique (ex. bouton undo). Ne pas scroller si le changement
  // vient du scroll user (sinon conflit avec les gestes = scroll bloqué).
  useEffect(() => {
    if (skipNextScrollFromEffect.current) {
      skipNextScrollFromEffect.current = false;
      return;
    }
    if (!isUserScrolling.current) {
      flatListRef.current?.scrollToOffset({
        offset: currentPage * STEP,
        animated: true,
      });
      setDisplayPage(currentPage);
      currentCenterRef.current = currentPage;
    }
  }, [currentPage]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / STEP);
      const clamped = Math.max(0, Math.min(page, totalPages));
      if (clamped !== currentCenterRef.current) {
        currentCenterRef.current = clamped;
        setDisplayPage(clamped);
      }
    },
    [totalPages]
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / STEP);
      const clamped = Math.max(0, Math.min(page, totalPages));
      isUserScrolling.current = false;
      skipNextScrollFromEffect.current = true; // évite que le useEffect re-scrolle
      onPageChange(clamped);
      // On laisse snapToInterval gérer le snap — plus de scrollToOffset manuel
      // pour éviter de bloquer les gestes suivants.
    },
    [totalPages, onPageChange]
  );

  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / STEP);
      const clamped = Math.max(0, Math.min(page, totalPages));
      isUserScrolling.current = false; // toujours réinitialiser pour la prochaine fois
      skipNextScrollFromEffect.current = true;
      onPageChange(clamped);
      // snapToInterval fait le snap ; scrollToOffset manuel bloquait les gestes
    },
    [totalPages, onPageChange]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: number }) => {
      const isCenter = item === displayPage;
      return (
        <View style={[styles.itemCell, { width: STEP }]}>
          <View style={[styles.itemContainer, { width: ITEM_WIDTH }]}>
            <Text
              style={[
                styles.pageNumber,
                isCenter ? styles.pageNumberCenter : styles.pageNumberSide,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {item}
            </Text>
          </View>
        </View>
      );
    },
    [displayPage]
  );

  const keyExtractor = useCallback((item: number) => item.toString(), []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: STEP,
      offset: horizontalPadding + STEP * index,
      index,
    }),
    [horizontalPadding]
  );

  return (
    <View style={styles.container}>
      <View style={styles.pageLabelContainer}>
        <Text style={styles.pageLabel}>PAGE</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        onScrollBeginDrag={handleScrollBeginDrag}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding }}
        style={{ width: screenWidth }}
        getItemLayout={getItemLayout}
        windowSize={9}
        maxToRenderPerBatch={15}
        initialNumToRender={15}
        removeClippedSubviews={false}
        initialScrollIndex={Math.min(Math.max(0, savedPage), totalPages)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
  pageLabelContainer: {
    marginBottom: -12,
    zIndex: 1,
  },
  pageLabel: {
    fontFamily: 'Rokkitt_Bold',
    fontSize: 36,
    color: 'rgba(0,0,0,0.08)',
    letterSpacing: -0.72,
    textAlign: 'center',
  },
  itemCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
  },
  pageNumber: {
    fontFamily: 'Rokkitt_Bold',
    fontWeight: '700',
    textAlign: 'center',
    // textAlignVertical + includeFontPadding : corrige le centrage vertical
    // sur Android, où le moteur de texte ajoute un padding fantôme par défaut.
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  // Nombre central (sélectionné/en cours) — gros, noir, avec ombre portée.
  // Pour 1-2 chiffres (0-99) : s'affiche à pleine taille 128px.
  // Pour 3 chiffres (100-999) : adjustsFontSizeToFit réduit légèrement (~104px).
  // Pour 4 chiffres (1000+) : réduit à ~78px, mais toujours lisible et complet.
  //
  // PAS de lineHeight ici : sur le simulateur iOS, un lineHeight fixe combiné
  // avec adjustsFontSizeToFit provoque un bug où le texte disparaît quand la
  // taille est réduite. Sans lineHeight, le texte prend sa hauteur naturelle
  // et le conteneur (justifyContent: 'center') gère l'alignement vertical.
  pageNumberCenter: {
    fontSize: 128,
    color: colors.dark900,
    letterSpacing: -2.56,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
  // Nombres adjacents (non sélectionnés) — plus petits, gris transparent.
  // Pas de lineHeight non plus, pour la même raison (compatibilité simulateur).
  // L'alignement vertical est assuré par le conteneur flexbox (150px de haut,
  // justifyContent: 'center'), qui centre chaque texte au même point vertical.
  pageNumberSide: {
    fontSize: 72,
    color: 'rgba(0,0,0,0.2)',
    letterSpacing: -1.44,
  },
});
