/**
 * Composant PageScrollPicker
 *
 * Sélecteur de page horizontal avec scroll fluide :
 * - Largeur fixe par item pour un scroll fiable + snap
 * - Quand le scroll s'arrête, le numéro le plus proche se centre sur l'écran
 * - Numéro central : 108px, encre noyer. Adjacents : 60px, encre transparente
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
import { colors, fonts, inkAlpha, shadowAlpha } from '../../utils/constants';

// Largeur de chaque cellule. 180px suffit pour afficher 1-3 chiffres à pleine
// taille (108px). Pour 3-4 chiffres, adjustsFontSizeToFit réduit légèrement
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
              /*
                Plafond d'agrandissement.
                Ce chiffre fait déjà 108 pt, soit sept fois le corps de texte :
                il est lisible bien au-delà de ce que réclame le réglage
                d'accessibilité. Le laisser tripler le ferait déborder de sa
                cellule de 150 pt sans rien gagner en lisibilité. On garde une
                vraie réponse au réglage, bornée.
              */
              maxFontSizeMultiplier={1.3}
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
        {/*
          Filigrane décoratif posé derrière le chiffre. S'il s'agrandit, il
          chevauche le chiffre au lieu de rester en fond : il est exclu de
          l'échelle système, comme tout élément purement ornemental.
        */}
        <Text style={styles.pageLabel} allowFontScaling={false}>PAGE</Text>
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
    fontFamily: fonts.displayBold,
    fontSize: 30,
    color: inkAlpha(0.08),
    letterSpacing: -0.3,
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
    fontFamily: fonts.displayHero,
    textAlign: 'center',
    // textAlignVertical + includeFontPadding : corrige le centrage vertical
    // sur Android, où le moteur de texte ajoute un padding fantôme par défaut.
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  // Nombre central (sélectionné/en cours) — gros, encre noyer, avec ombre portée.
  // 108px et non 128px : Fraunces a des chiffres plus hauts et plus larges que
  // Rokkitt, 108px garde la même présence. adjustsFontSizeToFit réduit encore
  // la taille pour les nombres à 4 chiffres (1000+).
  //
  // PAS de lineHeight ici : sur le simulateur iOS, un lineHeight fixe combiné
  // avec adjustsFontSizeToFit provoque un bug où le texte disparaît quand la
  // taille est réduite. Sans lineHeight, le texte prend sa hauteur naturelle
  // et le conteneur (justifyContent: 'center') gère l'alignement vertical.
  pageNumberCenter: {
    fontSize: 108,
    color: colors.dark900,
    letterSpacing: -1.6,
    textShadowColor: shadowAlpha(0.25),
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
  // Nombres adjacents (non sélectionnés) — plus petits, encre transparente.
  // Pas de lineHeight non plus, pour la même raison (compatibilité simulateur).
  // L'alignement vertical est assuré par le conteneur flexbox (150px de haut,
  // justifyContent: 'center'), qui centre chaque texte au même point vertical.
  pageNumberSide: {
    fontSize: 60,
    color: inkAlpha(0.2),
    letterSpacing: -0.9,
  },
});
