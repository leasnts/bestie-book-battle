/**
 * PageRuler — ma page : le gros chiffre, et la règle des pages dessous.
 *
 * Retours de Lea (2026-09-30 → 10-01) ; maquette ★ G sur
 * https://claude.ai/artifact/LHcESZK1418eDJSUatpYP1.
 *
 * - Le chiffre garde notre écriture (Fraunces, « / 624 » pâle et flouté
 *   derrière, un peu plus petit que le chiffre). On le fait glisser à gauche / à droite : il se dissout comme de
 *   l'encre pendant que le suivant s'imprime (« M4 »). La transition suit le
 *   doigt : à mi-geste, on est à mi-chemin.
 * - Dessous, la règle : une page = un point, chocolat si lue, sable si à lire
 *   (un peu plus gros toutes les dix). Défilement natif (élan, arrêt net sur une
 *   page), un tic par page.
 * - Au centre, une goutte de verre posée sur la ligne : elle grossit les pages
 *   qu'elle couvre (ma page y est une perle lie de vin), s'étire avec la vitesse
 *   et se reforme en tremblant un peu quand on lâche.
 *
 * Le chiffre et la règle ne font qu'un : glisser le chiffre fait défiler la
 * règle. VoiceOver : réglable (glisser vers le haut / bas = page suivante /
 * précédente).
 */

import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
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

/** Un point par page, tous les 11 pt */
const STEP = 11;
/** Une dizaine = un élément de la liste (la règle reste légère sur 1 000 pages) */
const DECADE = STEP * 10;
const RULER_HEIGHT = 48;
/** La ligne des points, depuis le haut de la règle */
const LINE_Y = 24;
/** Ce que la règle déborde du cadre, de chaque côté (sa marge intérieure) */
const BLEED = 16;
/** Glisser le chiffre : 40 pt de doigt = une page */
const NUMBER_PX = 40;
/** La goutte de verre : rayon et grossissement */
const LENS_R = 19;
const ZOOM = 2.2;

const INK = ['#6b5546', colors.dark950] as const;
const SAND = ['#e6dfd6', '#cfc4b6'] as const;

export default function PageRuler({ currentPage, totalPages, onPageChange, fontSize = 88 }: PageRulerProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const listRef = useAnimatedRef<Animated.FlatList<number>>();
  // Où en est la règle, en points : tout le reste (chiffre, goutte) en découle
  const scrollX = useSharedValue(currentPage * STEP);
  // La page entière sous la goutte, et la suivante : ce que le chiffre affiche
  const [base, setBase] = useState(currentPage);
  const baseSV = useSharedValue(currentPage);

  const shownPage = useRef(currentPage);
  const lastTick = useRef(0);

  const decades = useMemo(() => Array.from({ length: Math.floor(totalPages / 10) + 1 }, (_, i) => i), [totalPages]);
  const pad = width / 2;
  // Assez de place après la dernière dizaine pour centrer la dernière page
  const tail = Math.max(0, pad + totalPages * STEP - decades.length * DECADE);
  const maxX = totalPages * STEP;

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

  // La goutte : étirement selon la vitesse, léger retard derrière le geste
  const stretch = useSharedValue(0);
  const lag = useSharedValue(0);
  // Glisser le chiffre pilote la règle (sans élan natif : on anime nous-mêmes)
  const drive = useSharedValue(0);
  const driving = useSharedValue(false);

  const lastPage = useSharedValue(currentPage);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
      const v = (e as unknown as { velocity?: { x: number } }).velocity?.x ?? 0;
      stretch.value = withSpring(Math.min(0.5, Math.abs(v) * 0.12), { damping: 9, stiffness: 170 });
      lag.value = withSpring(Math.max(-9, Math.min(9, -v * 5)), { damping: 14, stiffness: 160 });
      const b = Math.max(0, Math.min(totalPages, Math.floor(e.contentOffset.x / STEP + 1e-3)));
      if (b !== baseSV.value) {
        baseSV.value = b;
        runOnJS(setBase)(b);
      }
      const page = Math.max(0, Math.min(totalPages, Math.round(e.contentOffset.x / STEP)));
      if (page !== lastPage.value) {
        lastPage.value = page;
        runOnJS(onPageScrolled)(page);
      }
    },
    onBeginDrag: () => {
      driving.value = false;
    },
    onMomentumEnd: () => {
      stretch.value = withSpring(0, { damping: 7, stiffness: 160 });
      lag.value = withSpring(0, { damping: 14, stiffness: 160 });
    },
  });

  useAnimatedReaction(
    () => drive.value,
    (x) => {
      if (driving.value) scrollTo(listRef, x, 0, false);
    },
  );

  const numberPan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onStart(() => {
      driving.value = true;
      drive.value = scrollX.value;
    })
    .onChange((e) => {
      drive.value = Math.max(0, Math.min(maxX, drive.value - (e.changeX * STEP) / NUMBER_PX));
    })
    .onEnd((e) => {
      // Un peu d'élan, puis arrêt net sur une page
      const projected = drive.value - (e.velocityX * 0.18 * STEP) / NUMBER_PX;
      const target = Math.max(0, Math.min(maxX, Math.round(projected / STEP) * STEP));
      drive.value = withTiming(target, { duration: 420, easing: Easing.out(Easing.cubic) }, () => {
        driving.value = false;
        stretch.value = withSpring(0, { damping: 7, stiffness: 160 });
        lag.value = withSpring(0, { damping: 14, stiffness: 160 });
      });
    });

  // Changement venu d'ailleurs (↺ annuler, chargement) : la règle suit
  useEffect(() => {
    // Un décalage posé sans défilement (au chargement) ne passe pas par onScroll : on recale ici
    if (Math.round(scrollX.value / STEP) !== currentPage) {
      scrollX.value = currentPage * STEP;
      baseSV.value = currentPage;
      setBase(currentPage);
    }
    if (width === 0 || currentPage === shownPage.current) return;
    shownPage.current = currentPage;
    lastPage.value = currentPage;
    listRef.current?.scrollToOffset({ offset: currentPage * STEP, animated: true });
  }, [currentPage, width, scrollX, baseSV, lastPage, listRef]);

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
      <GestureDetector gesture={numberPan}>
        <View style={styles.numberBlock}>
          <InkNumber
            base={base}
            next={Math.min(totalPages, base + 1)}
            total={totalPages}
            fontSize={fontSize}
            scrollX={scrollX}
            baseSV={baseSV}
          />
        </View>
      </GestureDetector>

      <View style={styles.ruler} onLayout={onLayout}>
        {width > 0 && (
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={['transparent', 'black', 'black', 'transparent']}
                locations={[0, 0.2, 0.8, 1]}
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
        {width > 0 && (
          <GlassDrop
            center={width / 2}
            base={base}
            currentPage={currentPage}
            totalPages={totalPages}
            scrollX={scrollX}
            stretch={stretch}
            lag={lag}
          />
        )}
      </View>
    </View>
  );
}

// ─── Le chiffre à l'encre ────────────────────────────────────────────

/**
 * Deux chiffres superposés, la page et la suivante. Entre les deux, celui qui
 * part se dissout et celui qui arrive s'imprime. Le flou vient d'un double
 * flouté de chaque chiffre, fondu avec le net : RN ne sait pas flouter un texte.
 */
function InkNumber({
  base,
  next,
  total,
  fontSize,
  scrollX,
  baseSV,
}: {
  base: number;
  next: number;
  total: number;
  fontSize: number;
  scrollX: SharedValue<number>;
  baseSV: SharedValue<number>;
}) {
  // Le « / 624 » se cale sur la largeur du chiffre
  const [numberWidth, setNumberWidth] = useState(0);
  const lineHeight = Math.round(fontSize * 1.05);

  const progress = (x: number, b: number) => {
    'worklet';
    const f = Math.max(0, Math.min(1, x / STEP - b));
    return f * f * (3 - 2 * f);
  };
  const outSharp = useAnimatedStyle(() => {
    const e = progress(scrollX.value, baseSV.value);
    return {
      opacity: 1 - e,
      transform: [{ translateX: -e * 18 }, { scale: 1 + e * 0.08 }],
    };
  });
  const outBlur = useAnimatedStyle(() => {
    const e = progress(scrollX.value, baseSV.value);
    return { opacity: Math.sin(Math.PI * e) * 0.8 * (1 - e * 0.4), transform: [{ translateX: -e * 18 }, { scale: 1 + e * 0.08 }] };
  });
  const inSharp = useAnimatedStyle(() => {
    const e = progress(scrollX.value, baseSV.value);
    return {
      opacity: interpolate(e, [0.25, 1], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateX: (1 - e) * 18 }, { scale: 0.94 + e * 0.06 }],
    };
  });
  const inBlur = useAnimatedStyle(() => {
    const e = progress(scrollX.value, baseSV.value);
    return { opacity: Math.sin(Math.PI * e) * 0.8 * (0.6 + 0.4 * e), transform: [{ translateX: (1 - e) * 18 }, { scale: 0.94 + e * 0.06 }] };
  });

  const textStyle = [styles.number, { fontSize, lineHeight }];
  return (
    <View>
      {numberWidth > 0 && <GhostTotal total={total} size={Math.round(fontSize * 0.72)} left={numberWidth * 0.7} />}
      {/* La place du chiffre (invisible) : donne sa largeur au « / 624 » */}
      <Text onLayout={(e) => setNumberWidth(e.nativeEvent.layout.width)} style={[textStyle, styles.hidden]}>
        {base}
      </Text>
      <Animated.View style={[styles.layer, outBlur]} pointerEvents="none">
        <BlurredNumber value={base} size={fontSize} />
      </Animated.View>
      <Animated.Text style={[textStyle, styles.layer, outSharp]}>{base}</Animated.Text>
      {next !== base && (
        <>
          <Animated.View style={[styles.layer, inBlur]} pointerEvents="none">
            <BlurredNumber value={next} size={fontSize} />
          </Animated.View>
          <Animated.Text style={[textStyle, styles.layer, inSharp]}>{next}</Animated.Text>
        </>
      )}
    </View>
  );
}

/** Le chiffre, flouté comme une tache d'encre */
function BlurredNumber({ value, size }: { value: number; size: number }) {
  const label = String(value);
  const blur = 5;
  const margin = blur * 3;
  const w = Math.round(label.length * size * 0.6) + margin * 2;
  const h = Math.round(size * 1.05) + margin * 2;
  return (
    <View style={styles.blurBox}>
      <Svg width={w} height={h} style={{ marginHorizontal: -margin, marginVertical: -margin }}>
        <Defs>
          <Filter id={`ink${value}`} x="-30%" y="-30%" width="160%" height="160%">
            <FeGaussianBlur stdDeviation={blur} />
          </Filter>
        </Defs>
        <SvgText
          x={w / 2}
          y={margin + size * 0.86}
          textAnchor="middle"
          fontFamily={fonts.displayHero}
          fontSize={size}
          fill={colors.textPrimary}
          filter={`url(#ink${value})`}
        >
          {label}
        </SvgText>
      </Svg>
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

// ─── La règle ────────────────────────────────────────────────────────

/** Dix pages de règle : dix points */
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
    </View>
  );
});

/** Un point = une page : sable tant qu'elle est à lire, chocolat une fois lue */
function Dot({ page, left, scrollX }: { page: number; left: number; scrollX: SharedValue<number> }) {
  const size = page % 10 === 0 ? 7 : 5;
  const ink = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [page * STEP - STEP / 2, page * STEP - STEP / 2 + 1], [0, 1], Extrapolation.CLAMP),
  }));
  return (
    <View style={[styles.dot, { left: left - size / 2, width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient colors={SAND} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, ink]}>
        <LinearGradient colors={INK} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

// ─── La goutte de verre ──────────────────────────────────────────────

/**
 * Posée au centre de la règle, elle montre les pages qu'elle couvre, grossies.
 * Dedans, les pages proches à l'échelle ZOOM, qui défilent avec elle.
 */
function GlassDrop({
  center,
  base,
  currentPage,
  totalPages,
  scrollX,
  stretch,
  lag,
}: {
  center: number;
  base: number;
  currentPage: number;
  totalPages: number;
  scrollX: SharedValue<number>;
  stretch: SharedValue<number>;
  lag: SharedValue<number>;
}) {
  const drop = useAnimatedStyle(() => {
    const sx = 1 + stretch.value;
    return { transform: [{ translateX: lag.value }, { scaleX: sx }, { scaleY: 1 / Math.sqrt(sx) }] };
  });
  const pages = [];
  for (let p = Math.max(0, base - 3); p <= Math.min(totalPages, base + 4); p++) pages.push(p);

  return (
    <Animated.View pointerEvents="none" style={[styles.drop, { left: center - LENS_R }, drop]}>
      <View style={styles.dropClip}>
        <LinearGradient colors={['#fdfcfa', '#f3eee7']} style={StyleSheet.absoluteFill} />
        {pages.map((p) => (
          <LensDot
            key={p}
            page={p}
            colorsFor={p === currentPage ? accentGradient : p < currentPage ? INK : SAND}
            scrollX={scrollX}
            lag={lag}
          />
        ))}
        {/* Le verre : reflet en haut, lumière concentrée en bas, bord plus sombre */}
        <View style={styles.glint} />
        <View style={styles.caustic} />
        <View style={styles.rim} />
      </View>
    </Animated.View>
  );
}

/**
 * Une page vue à travers la goutte. Comme dans une bille de verre : grossie au
 * centre, elle se tasse et s'arrondit en approchant du bord.
 */
function LensDot({
  page,
  colorsFor,
  scrollX,
  lag,
}: {
  page: number;
  colorsFor: readonly [string, string, ...string[]];
  scrollX: SharedValue<number>;
  lag: SharedValue<number>;
}) {
  const s = (page % 10 === 0 ? 7 : 5) * ZOOM;
  const style = useAnimatedStyle(() => {
    const d = (page * STEP - scrollX.value - lag.value) * ZOOM; // distance au centre, grossie
    const u = d / LENS_R;
    // la bille : la position se tasse vers le bord, le point s'y aplatit
    const bent = (LENS_R * u) / Math.sqrt(1 + 0.9 * u * u);
    const squash = Math.max(0.35, Math.sqrt(Math.max(0, 1 - Math.min(0.9, (bent / LENS_R) ** 2))));
    return { transform: [{ translateX: LENS_R + bent - s / 2 }, { scaleX: squash }] };
  });
  return (
    <Animated.View style={[styles.bigDot, { top: LENS_R - s / 2, width: s, height: s, borderRadius: s / 2 }, style]}>
      <LinearGradient colors={colorsFor} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

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
    textAlign: 'center',
  },
  hidden: {
    opacity: 0,
  },
  layer: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: 0,
    alignItems: 'center',
  },
  blurBox: {
    alignItems: 'center',
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
    marginTop: -3,
    overflow: 'hidden',
  },
  drop: {
    position: 'absolute',
    top: LINE_Y - LENS_R,
    width: LENS_R * 2,
    height: LENS_R * 2,
    borderRadius: LENS_R,
    shadowColor: colors.black,
    shadowOpacity: 0.16,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 6 },
  },
  dropClip: {
    flex: 1,
    borderRadius: LENS_R,
    overflow: 'hidden',
  },
  bigDot: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
  glint: {
    position: 'absolute',
    left: LENS_R * 0.42,
    top: LENS_R * 0.22,
    width: LENS_R * 0.62,
    height: LENS_R * 0.3,
    borderRadius: LENS_R,
    backgroundColor: 'rgba(255,255,255,0.85)',
    transform: [{ rotate: '-18deg' }],
  },
  caustic: {
    position: 'absolute',
    left: LENS_R * 0.55,
    bottom: LENS_R * 0.12,
    width: LENS_R * 0.9,
    height: LENS_R * 0.16,
    borderRadius: LENS_R,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: LENS_R,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    boxShadow: 'inset 0 -3px 6px rgba(90,69,54,0.16), 0 0 0 1px rgba(90,69,54,0.22)',
  },
});
