/**
 * PageRuler — ma page, en grand chiffre sur une règle.
 *
 * Remplace le chiffre qui défilait seul (retour de Lea, 2026-09-30 : « des
 * chiffres solo au milieu de rien, le / 624 pas beau »). Maquette :
 * https://claude.ai/artifact/LHcESZK1418eDJSUatpYP1 (★ B).
 *
 * - En haut, ma page en grand. Le total (pages de MON édition) est un « / 624 »
 *   en arrière-plan : plus gros, décalé en bas à droite, pâle et flouté (Lea).
 * - En bas, une règle de points qu'on fait glisser (2026-10-01, Lea a choisi
 *   « les points de suspension » + « l'éventail ») : une page = un point, plein
 *   si lu, évidé sinon, un repère toutes les dix. Les points grossissent autour
 *   de ma page, comme une loupe sous le doigt ; ma page est la perle lie de vin.
 *   Défilement natif (élan, arrêt net sur une page), un tic par page.
 * - Les bords de la règle s'effacent.
 *
 * VoiceOver : réglable (glisser vers le haut / bas = page suivante / précédente).
 */

import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, FeGaussianBlur, Filter, Text as SvgText } from 'react-native-svg';
import { accentGradient, colors, fonts } from '../../utils/constants';

interface PageRulerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Taille du chiffre, selon la place */
  fontSize?: number;
}

/** Un point par page, tous les 10 pt */
const STEP = 10;
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
  const listRef = useRef<Animated.FlatList<number>>(null);
  // Où en est la règle, en points, lu par chaque point pour sa loupe
  const scrollX = useSharedValue(currentPage * STEP);
  // La page que la règle montre ; sert à ne pas re-défiler quand c'est elle qui l'a changée
  const shownPage = useRef(currentPage);
  const lastTick = useRef(0);

  const decades = useMemo(() => Array.from({ length: Math.floor(totalPages / 10) + 1 }, (_, i) => i), [totalPages]);
  const pad = width / 2;
  // Assez de place après la dernière dizaine pour centrer la dernière page
  const tail = Math.max(0, pad + totalPages * STEP - decades.length * DECADE);

  const onPageScrolled = useCallback(
    (page: number) => {
      if (page === shownPage.current) return;
      shownPage.current = page;
      onPageChange(page);
      const now = Date.now();
      if (now - lastTick.current > 30) {
        lastTick.current = now;
        Haptics.selectionAsync().catch(() => {});
      }
    },
    [onPageChange],
  );

  const lastPage = useSharedValue(currentPage);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
    const page = Math.max(0, Math.min(totalPages, Math.round(e.contentOffset.x / STEP)));
    if (page !== lastPage.value) {
      lastPage.value = page;
      runOnJS(onPageScrolled)(page);
    }
  });

  // Changement venu d'ailleurs (↺ annuler, chargement) : la règle suit
  useEffect(() => {
    // Un décalage posé sans défilement (au chargement) ne passe pas par onScroll : la loupe se recale ici
    if (Math.round(scrollX.value / STEP) !== currentPage) scrollX.value = currentPage * STEP;
    if (width === 0 || currentPage === shownPage.current) return;
    shownPage.current = currentPage;
    lastPage.value = currentPage;
    listRef.current?.scrollToOffset({ offset: currentPage * STEP, animated: true });
  }, [currentPage, width, scrollX]);

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
            <Animated.FlatList
              ref={listRef}
              horizontal
              data={decades}
              keyExtractor={String}
              renderItem={({ item }) => <Decade index={item} totalPages={totalPages} scrollX={scrollX} />}
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
        {/* Ma page : la perle lie de vin, posée sur la ligne des points */}
        <LinearGradient colors={accentGradient} style={[styles.pearl, { left: width / 2 - PEARL / 2 }]} pointerEvents="none" />
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

/** Dix pages de règle : dix points, et le numéro de la dizaine sous le premier */
const Decade = React.memo(function Decade({
  index,
  totalPages,
  scrollX,
}: {
  index: number;
  totalPages: number;
  scrollX: SharedValue<number>;
}) {
  const first = index * 10;
  const count = Math.min(10, totalPages - first + 1);
  return (
    <View style={styles.decade}>
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} page={first + i} left={i * STEP} scrollX={scrollX} />
      ))}
      <Text style={styles.label} numberOfLines={1}>
        {first}
      </Text>
    </View>
  );
});

/** Un point = une page. Plein quand elle est lue ; plus gros près de ma page. */
function Dot({ page, left, scrollX }: { page: number; left: number; scrollX: SharedValue<number> }) {
  const major = page % 10 === 0;
  const zoom = useAnimatedStyle(() => {
    const d = (page * STEP - scrollX.value) / STEP;
    // La loupe : 1 loin de ma page, jusqu'à 2,2 tout près
    return { transform: [{ scale: 1 + 1.2 * Math.exp(-(d * d) / 10) }] };
  });
  const ink = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [page * STEP - STEP / 2, page * STEP - STEP / 2 + 1], [0, 1], Extrapolation.CLAMP),
  }));
  const size = major ? 6 : 4;
  return (
    <Animated.View style={[styles.dot, { left: left - size / 2, width: size, height: size, borderRadius: size / 2 }, zoom]}>
      <View style={[styles.dotRing, { borderRadius: size / 2 }]} />
      <Animated.View style={[StyleSheet.absoluteFill, ink]}>
        <LinearGradient colors={['#6b5546', colors.dark950]} style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]} />
      </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

/** La ligne des points, depuis le haut de la règle */
const LINE_Y = 24;
const PEARL = 14;

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
  dot: {
    position: 'absolute',
    top: LINE_Y,
    marginTop: -2,
    overflow: 'hidden',
  },
  dotRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: '#c9bfb4',
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
  pearl: {
    position: 'absolute',
    top: LINE_Y - PEARL / 2,
    width: PEARL,
    height: PEARL,
    borderRadius: PEARL / 2,
    shadowColor: '#5e1f2e',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
});
