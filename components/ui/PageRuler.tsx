/**
 * PageRuler — ma page, en grand chiffre sur une règle.
 *
 * Remplace le chiffre qui défilait seul (retour de Lea, 2026-09-30 : « des
 * chiffres solo au milieu de rien, le / 624 pas beau »). Maquette :
 * https://claude.ai/artifact/LHcESZK1418eDJSUatpYP1 (★ B).
 *
 * - En haut, ma page en grand. Le total (pages de MON édition) est un « / 624 »
 *   en arrière-plan : plus gros, décalé en bas à droite, pâle et flouté (Lea).
 * - En bas, une règle graduée qu'on fait glisser : un trait par page, un grand
 *   trait et un repère toutes les dix. Le curseur lie de vin marque ma page.
 *   Défilement natif (élan, arrêt net sur une page), un tic par page.
 * - Les bords de la règle s'effacent.
 *
 * VoiceOver : réglable (glisser vers le haut / bas = page suivante / précédente).
 */

import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, FeGaussianBlur, Filter, Text as SvgText } from 'react-native-svg';
import { accentGradient, colors, fonts } from '../../utils/constants';

interface PageRulerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Taille du chiffre, selon la place */
  fontSize?: number;
}

/** Un trait par page, tous les 8 pt */
const STEP = 8;
/** Une dizaine = un élément de la liste (la règle reste légère sur 1 000 pages) */
const DECADE = STEP * 10;
const RULER_HEIGHT = 64;
/** Ce que la règle déborde du cadre, de chaque côté (sa marge intérieure) */
const BLEED = 16;

export default function PageRuler({ currentPage, totalPages, onPageChange, fontSize = 88 }: PageRulerProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // Le « / 624 » se cale sur la largeur du chiffre
  const [numberWidth, setNumberWidth] = useState(0);
  const listRef = useRef<FlatList<number>>(null);
  // La page que la règle montre ; sert à ne pas re-défiler quand c'est elle qui l'a changée
  const shownPage = useRef(currentPage);
  const lastTick = useRef(0);

  const decades = useMemo(() => Array.from({ length: Math.floor(totalPages / 10) + 1 }, (_, i) => i), [totalPages]);
  const pad = width / 2;
  // Assez de place après la dernière dizaine pour centrer la dernière page
  const tail = Math.max(0, pad + totalPages * STEP - decades.length * DECADE);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.max(0, Math.min(totalPages, Math.round(e.nativeEvent.contentOffset.x / STEP)));
      if (page === shownPage.current) return;
      shownPage.current = page;
      onPageChange(page);
      const now = Date.now();
      if (now - lastTick.current > 30) {
        lastTick.current = now;
        Haptics.selectionAsync().catch(() => {});
      }
    },
    [onPageChange, totalPages],
  );

  // Changement venu d'ailleurs (↺ annuler, chargement) : la règle suit
  useEffect(() => {
    if (width === 0 || currentPage === shownPage.current) return;
    shownPage.current = currentPage;
    listRef.current?.scrollToOffset({ offset: currentPage * STEP, animated: true });
  }, [currentPage, width]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const page = Math.max(0, Math.min(totalPages, currentPage + dir));
      if (page !== currentPage) onPageChange(page);
    },
    [currentPage, onPageChange, totalPages],
  );

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Ma page"
      accessibilityValue={{ text: `page ${currentPage} sur ${totalPages}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <View style={styles.numberBlock}>
        <View>
          {numberWidth > 0 && <GhostTotal total={totalPages} size={Math.round(fontSize * 0.95)} left={numberWidth * 0.62} />}
          <Text
            onLayout={(e) => setNumberWidth(e.nativeEvent.layout.width)}
            style={[styles.number, { fontSize, lineHeight: Math.round(fontSize * 1.05) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {currentPage}
          </Text>
        </View>
      </View>

      <View style={styles.ruler} onLayout={onLayout}>
        {width > 0 && (
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={['transparent', 'black', 'black', 'transparent']}
                locations={[0, 0.22, 0.78, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <FlatList
              ref={listRef}
              horizontal
              data={decades}
              keyExtractor={String}
              renderItem={({ item }) => <Decade index={item} totalPages={totalPages} />}
              getItemLayout={(_, index) => ({ length: DECADE, offset: pad + DECADE * index, index })}
              ListHeaderComponent={<View style={{ width: pad }} />}
              ListFooterComponent={<View style={{ width: tail }} />}
              contentOffset={{ x: currentPage * STEP, y: 0 }}
              showsHorizontalScrollIndicator={false}
              snapToInterval={STEP}
              decelerationRate="fast"
              onScroll={onScroll}
              scrollEventThrottle={16}
              initialNumToRender={12}
              windowSize={7}
            />
          </MaskedView>
        )}
        {/* Le curseur : ma page */}
        <LinearGradient colors={accentGradient} style={[styles.cursor, { left: width / 2 - 2 }]} pointerEvents="none" />
      </View>
    </View>
  );
}

/** « / 624 » derrière le chiffre : plus gros, décalé, pâle et flouté */
function GhostTotal({ total, size, left }: { total: number; size: number; left: number }) {
  const label = `/${total}`;
  const blur = 3;
  const margin = blur * 4;
  const width = Math.round(label.length * size * 0.58) + margin * 2;
  const height = Math.round(size * 1.25) + margin * 2;
  return (
    <View pointerEvents="none" style={[styles.ghost, { left: left - margin, top: size * 0.08 - margin }]}>
      <Svg width={width} height={height}>
        <Defs>
          <Filter id="ghostBlur" x="-20%" y="-20%" width="140%" height="140%">
            <FeGaussianBlur stdDeviation={blur} />
          </Filter>
        </Defs>
        <SvgText
          x={margin}
          y={margin + size}
          fontFamily={fonts.displayHero}
          fontSize={size}
          fill={colors.textPrimary}
          fillOpacity={0.16}
          filter="url(#ghostBlur)"
        >
          {label}
        </SvgText>
      </Svg>
    </View>
  );
}

/** Dix pages de règle : le grand trait et son repère, puis neuf petits */
const Decade = React.memo(function Decade({ index, totalPages }: { index: number; totalPages: number }) {
  const first = index * 10;
  const count = Math.min(10, totalPages - first + 1);
  return (
    <View style={styles.decade}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.tick, i === 0 && styles.tickMajor, { left: i * STEP }]} />
      ))}
      <Text style={styles.label} numberOfLines={1}>
        {first}
      </Text>
    </View>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────

const TICK_BOTTOM = 26;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  numberBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: fonts.displayHero,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  ghost: {
    position: 'absolute',
  },
  ruler: {
    height: RULER_HEIGHT,
    marginHorizontal: -BLEED,
  },
  decade: {
    width: DECADE,
    height: RULER_HEIGHT,
  },
  tick: {
    position: 'absolute',
    bottom: TICK_BOTTOM,
    width: 1,
    height: 14,
    marginLeft: -0.5,
    backgroundColor: '#c9bfb4',
  },
  tickMajor: {
    width: 1.5,
    height: 28,
    marginLeft: -0.75,
    backgroundColor: colors.textTertiary,
  },
  label: {
    position: 'absolute',
    bottom: 4,
    left: -20,
    width: 40,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textPlaceholder,
    fontVariant: ['tabular-nums'],
  },
  cursor: {
    position: 'absolute',
    bottom: TICK_BOTTOM - 4,
    width: 4,
    height: 40,
    borderRadius: 2,
  },
});
