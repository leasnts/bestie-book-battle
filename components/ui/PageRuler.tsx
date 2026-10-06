/**
 * PageRuler — ma page : le gros chiffre, et la règle des pages dessous.
 *
 * Retours de Lea (2026-09-30 → 10-01) ; maquette ★ G sur
 * https://claude.ai/artifact/LHcESZK1418eDJSUatpYP1.
 *
 * - Le chiffre garde notre écriture (Fraunces, « / 624 » pâle et flouté
 *   derrière, un peu plus petit que le chiffre). On le fait glisser à gauche /
 *   à droite : il se dissout comme de l'encre pendant que le suivant s'imprime.
 *   La transition suit le doigt : à mi-geste, on est à mi-chemin.
 * - Dessous, la règle est une couture : une page = un point de couture (un
 *   petit trait), fil chocolat si lue, fil sable si à lire, un peu plus épais
 *   toutes les dix. C'est le même point avant que la couture des autocollants
 *   brodés (NoteSticker) : une seule matière, le fil, dans toute l'app. Défilement natif libre avec son élan,
 *   puis arrêt en douceur sur la page la plus proche ; un tic par page.
 * - Au centre, une goutte de verre : elle grossit les pages qu'elle couvre (ma
 *   page y est une perle lie de vin), les tasse et les arrondit vers le bord
 *   comme une bille, s'étire avec la vitesse et se reforme quand on lâche.
 *
 * - Au-dessus de la couture, les autres membres du club en épingles de verre
 *   avec leur photo, là où elles en sont : leur % rapporté à MON édition (on ne
 *   compare jamais des pages d'éditions différentes). Elles défilent avec la
 *   règle ; deux épingles trop proches se décalent en hauteur. Hors de vue,
 *   elles restent amarrées au bord de leur côté (devant à droite, derrière à
 *   gauche), un peu plus petites et sans pointe, puis glissent en place quand
 *   on s'en approche. Chaque épingle est une goutte de verre, pointe en bas.
 *
 * Fluidité (retour de Lea sur iPhone : « lent et saccadé ») : tout ce qui bouge
 * pendant le geste tourne sur le fil d'animation, sans React. Le chiffre est un
 * texte animé (pas de rendu React par page) et la page n'est remontée à
 * l'accueil qu'une fois la règle arrêtée, comme l'ancien sélecteur.
 *
 * VoiceOver : réglable (glisser vers le haut / bas = page suivante / précédente).
 */

import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  scrollTo,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { accentGradient, colors, fonts } from '../../utils/constants';
import { FOOTPRINT_EM, GhostTotal, INK, figureBox, figureWidth } from './InkFigure';

/** Un membre du club épinglé sur la règle */
export interface ClubPin {
  id: string;
  name: string;
  photoUrl: string | null;
  /** Sa progression en %, dans SON édition */
  percentage: number;
}

interface PageRulerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Taille du chiffre, selon la place */
  fontSize?: number;
  /** Les autres membres du club */
  club?: ClubPin[];
}

/** Un point de couture par page, tous les 11 pt */
const STEP = 11;
/** Une dizaine = un élément de la liste (la règle reste légère sur 1 000 pages) */
const DECADE = STEP * 10;
const RULER_HEIGHT = 74;
/** L'air au-dessus du chiffre : aucun, il est posé en bas, contre la couture */
const NUMBER_TOP = 0;
/** Le chiffre ne descend jamais sous cette taille, même sur le plus petit écran */
const MIN_FONT_SIZE = 36;
/** La ligne des points, depuis le haut de la règle (place au-dessus pour les épingles) */
const LINE_Y = 50;
/** L'épingle : une bulle de verre avec la photo, et sa pointe sur la couture */
const PIN = 24;
/** Ce que la pointe de la goutte dépasse sous le rond (carré tourné de 45°) */
const PIN_TIP = PIN * (Math.SQRT2 - 1) / 2 + 1;
/** Épingles amarrées : marge au bord, et écart entre deux */
const EDGE = 22;
const DOCK_GAP = 14;
/** Ce que la règle déborde du cadre, de chaque côté (sa marge intérieure) */
const BLEED = 16;
/** Glisser le chiffre : 40 pt de doigt = une page */
const NUMBER_PX = 40;
/** La goutte de verre : rayon et grossissement */
const LENS_R = 19;
const ZOOM = 2.2;
/** Pages dessinées de part et d'autre dans la goutte */
const LENS_SPAN = 4;

const SAND = ['#e6dfd6', '#cfc4b6'] as const;
const DOT_READ = '#3a2a20';
const DOT_UNREAD = '#d9d0c5';
/** Le point d'une page : rond, plus gros tous les dix */
const stitchThick = (page: number) => (page % 10 === 0 ? 3.6 : 2.6);

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function PageRuler({ currentPage, totalPages, onPageChange, fontSize = 88, club = [] }: PageRulerProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  // La place laissée au chiffre : s'il en manque, il rétrécit plutôt que de faire
  // défiler l'accueil (le chiffre occupe FOOTPRINT_EM de sa taille, sous NUMBER_TOP)
  const [numberSpace, setNumberSpace] = useState(0);
  const onNumberLayout = (e: LayoutChangeEvent) => setNumberSpace(e.nativeEvent.layout.height);
  const fittedSize =
    numberSpace > 0
      ? Math.max(MIN_FONT_SIZE, Math.min(fontSize, Math.floor((numberSpace - NUMBER_TOP) / FOOTPRINT_EM)))
      : fontSize;

  const listRef = useAnimatedRef<Animated.FlatList<number>>();
  // Où en est la règle, en points : tout le reste (chiffre, goutte) en découle
  const scrollX = useSharedValue(currentPage * STEP);
  const maxX = totalPages * STEP;

  const shownPage = useRef(currentPage);
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;
  const lastTick = useRef(0);

  const decades = useMemo(() => Array.from({ length: Math.floor(totalPages / 10) + 1 }, (_, i) => i), [totalPages]);
  const pad = width / 2;
  // Assez de place après la dernière dizaine pour centrer la dernière page
  const tail = Math.max(0, pad + totalPages * STEP - decades.length * DECADE);

  const renderDecade = useCallback(
    ({ item }: { item: number }) => <Decade index={item} totalPages={totalPages} scrollX={scrollX} />,
    [totalPages, scrollX],
  );

  /** Un tic par page franchie, sans toucher à l'accueil */
  const tick = useCallback(() => {
    const now = Date.now();
    if (now - lastTick.current > 30) {
      lastTick.current = now;
      Haptics.selectionAsync().catch(() => {});
    }
  }, []);

  /** La règle s'est arrêtée sur une page : seulement là, l'accueil l'apprend */
  const commit = useCallback(
    (page: number) => {
      if (page === shownPage.current) return;
      shownPage.current = page;
      onPageChange(page);
    },
    [onPageChange],
  );

  // La goutte : étirement selon la vitesse, léger retard derrière le geste
  const stretch = useSharedValue(0);
  const lag = useSharedValue(0);
  // Glisser le chiffre pilote la règle (on anime nous-mêmes, sans élan natif)
  const drive = useSharedValue(0);
  const driving = useSharedValue(false);
  // Seul un geste (doigt sur la règle ou sur le chiffre) change la page : nos propres
  // défilements (chargement, ↺) ne doivent jamais la réécrire
  const userActive = useSharedValue(false);
  const lastPage = useSharedValue(currentPage);
  const prevX = useSharedValue(currentPage * STEP);
  // Où la règle est déjà en train de se poser : un `scrollTo` peut renvoyer tout de
  // suite une fin d'élan, qui rappellerait `settle` à l'infini (pile d'appels pleine)
  const settleTarget = useSharedValue(-1);

  const settle = (x: number) => {
    'worklet';
    stretch.value = withSpring(0, { damping: 7, stiffness: 160 });
    lag.value = withSpring(0, { damping: 14, stiffness: 160 });
    const page = Math.max(0, Math.min(totalPages, Math.round(x / STEP)));
    // Arrêt en douceur pile sur la page
    if (Math.abs(page * STEP - x) > 0.5 && settleTarget.value !== page) {
      settleTarget.value = page;
      scrollTo(listRef, page * STEP, 0, true);
    }
    if (userActive.value) runOnJS(commit)(page);
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const x = e.contentOffset.x;
      // Vitesse lue d'une image à l'autre (pt / image), lissée : l'étirement suit sans à-coups
      const v = x - prevX.value;
      prevX.value = x;
      scrollX.value = x;
      stretch.value += (Math.min(0.5, Math.abs(v) * 0.045) - stretch.value) * 0.35;
      lag.value += (Math.max(-9, Math.min(9, -v * 0.8)) - lag.value) * 0.35;
      const page = Math.max(0, Math.min(totalPages, Math.round(x / STEP)));
      if (page !== lastPage.value) {
        lastPage.value = page;
        if (userActive.value) runOnJS(tick)();
      }
    },
    onBeginDrag: () => {
      driving.value = false;
      settleTarget.value = -1;
      userActive.value = true;
    },
    onEndDrag: (e) => {
      // Le chiffre pilote la règle : c'est lui qui la posera, à la fin de son geste
      if (driving.value) return;
      const v = (e as unknown as { velocity?: { x: number } }).velocity?.x ?? 0;
      // Sans élan, pas de fin d'élan à attendre : on se pose tout de suite
      if (Math.abs(v) < 0.05) settle(e.contentOffset.x);
    },
    onMomentumEnd: (e) => {
      if (driving.value) return;
      settle(e.contentOffset.x);
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
      settleTarget.value = -1;
      userActive.value = true;
      drive.value = scrollX.value;
    })
    .onChange((e) => {
      drive.value = Math.max(0, Math.min(maxX, drive.value - (e.changeX * STEP) / NUMBER_PX));
    })
    .onEnd((e) => {
      // Un peu d'élan, puis arrêt net sur une page
      const projected = drive.value - (e.velocityX * 0.18 * STEP) / NUMBER_PX;
      const target = Math.max(0, Math.min(maxX, Math.round(projected / STEP) * STEP));
      drive.value = withTiming(target, { duration: 380, easing: Easing.out(Easing.cubic) }, () => {
        driving.value = false;
        settle(target);
      });
    });

  // Changement venu d'ailleurs (↺ annuler, chargement) : la règle suit
  useEffect(() => {
    if (width === 0 || currentPage === shownPage.current) return;
    shownPage.current = currentPage;
    lastPage.value = currentPage;
    userActive.value = false;
    listRef.current?.scrollToOffset({ offset: currentPage * STEP, animated: true });
  }, [currentPage, width, lastPage, listRef, userActive]);

  // Au premier affichage, on se cale vraiment sur ma page (la liste dessine alors
  // les dizaines autour d'elle, et la loupe part du bon endroit)
  useEffect(() => {
    if (width === 0) return;
    const id = requestAnimationFrame(() => {
      userActive.value = false;
      scrollX.value = pageRef.current * STEP;
      prevX.value = pageRef.current * STEP;
      listRef.current?.scrollToOffset({ offset: pageRef.current * STEP, animated: false });
    });
    return () => cancelAnimationFrame(id);
  }, [width, listRef, userActive, scrollX, prevX]);

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
        <View style={styles.numberBlock} onLayout={onNumberLayout}>
          <InkNumber page={currentPage} total={totalPages} fontSize={fittedSize} scrollX={scrollX} />
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
              renderItem={renderDecade}
              getItemLayout={(_, index) => ({ length: DECADE, offset: pad + DECADE * index, index })}
              ListHeaderComponent={<View style={{ width: pad }} />}
              ListFooterComponent={<View style={{ width: tail }} />}
              // La liste dessine d'abord les dizaines autour de ma page, puis on se cale pile dessus
              initialScrollIndex={Math.max(0, Math.floor(currentPage / 10) - 1)}
              showsHorizontalScrollIndicator={false}
              decelerationRate={0.994}
              onScroll={onScroll}
              scrollEventThrottle={16}
              initialNumToRender={6}
              windowSize={9}
            />
          </MaskedView>
        )}
        {width > 0 && <ClubPins club={club} totalPages={totalPages} width={width} scrollX={scrollX} />}
        {width > 0 && <GlassDrop center={width / 2} totalPages={totalPages} scrollX={scrollX} stretch={stretch} lag={lag} />}
      </View>
    </View>
  );
}

// ─── Le chiffre à l'encre ────────────────────────────────────────────

/**
 * Le chiffre et le suivant, superposés, écrits par le fil d'animation (des
 * TextInput non modifiables : leur texte change sans passer par React). Celui
 * qui part se dissout, celui qui arrive s'imprime ; le flou est fait de deux
 * doubles décalés et pâles, RN ne sachant pas flouter un texte.
 */
function InkNumber({
  page,
  total,
  fontSize,
  scrollX,
}: {
  page: number;
  total: number;
  fontSize: number;
  scrollX: SharedValue<number>;
}) {
  const { lineHeight, frame, baseline } = figureBox(fontSize);
  // La largeur du chiffre, pour caler le « / 624 » (le nombre de chiffres change rarement)
  const numberWidth = figureWidth(String(page), fontSize);

  const outText = useAnimatedProps(() => {
    const b = Math.max(0, Math.min(total, Math.floor(scrollX.value / STEP + 1e-3)));
    return { text: String(b), defaultValue: String(b) } as never;
  });
  const inText = useAnimatedProps(() => {
    const b = Math.max(0, Math.min(total, Math.floor(scrollX.value / STEP + 1e-3) + 1));
    return { text: String(b), defaultValue: String(b) } as never;
  });

  const ease = (x: number) => {
    'worklet';
    const f = Math.max(0, Math.min(1, x / STEP - Math.floor(x / STEP + 1e-3)));
    return f * f * (3 - 2 * f);
  };
  const out = (dx: number, dy: number, k: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => {
      const e = ease(scrollX.value);
      const blur = Math.sin(Math.PI * e);
      return {
        opacity: k === 0 ? 1 - e : 0.35 * blur * (1 - e * 0.5),
        transform: [{ translateX: -e * 18 + dx * blur }, { translateY: dy * blur }, { scale: 1 + e * 0.08 }],
      };
    });
  const inn = (dx: number, dy: number, k: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => {
      const e = ease(scrollX.value);
      const blur = Math.sin(Math.PI * e);
      return {
        opacity: k === 0 ? interpolate(e, [0.25, 1], [0, 1], Extrapolation.CLAMP) : 0.35 * blur * (0.5 + 0.5 * e),
        transform: [{ translateX: (1 - e) * 18 + dx * blur }, { translateY: dy * blur }, { scale: 0.94 + e * 0.06 }],
      };
    });
  // Le net, puis ses deux doubles flous (décalés de part et d'autre)
  const outStyles = [out(0, 0, 0), out(-3, 1.5, 1), out(3, -1.5, 1)];
  const inStyles = [inn(0, 0, 0), inn(-3, 1.5, 1), inn(3, -1.5, 1)];

  const textStyle = [styles.number, { fontSize, height: lineHeight }];
  const layer = (style: object, props: object, key: string) => (
    <AnimatedTextInput
      key={key}
      editable={false}
      // Sa taille vient de la place à l'écran (fittedSize), pas du réglage de texte
      allowFontScaling={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      defaultValue={String(page)}
      animatedProps={props}
      style={[textStyle, styles.layer, style]}
      importantForAccessibility="no"
      accessible={false}
    />
  );

  return (
    <View style={[frame, { width: numberWidth + 80 }]}>
      {/* Le total, nettement en contrebas de ma page */}
      <GhostTotal total={total} size={Math.round(fontSize * 0.72)} left={40 + numberWidth * 0.7} baseline={baseline} drop={0.4} />
      {/* Le chiffre est le masque d'un dégradé d'encre : jamais d'aplat (DA) */}
      <MaskedView
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        maskElement={
          <View style={StyleSheet.absoluteFill}>
            {outStyles.map((s, i) => layer(s, outText, `o${i}`))}
            {inStyles.map((s, i) => layer(s, inText, `i${i}`))}
          </View>
        }
      >
        <LinearGradient colors={INK} style={StyleSheet.absoluteFill} />
      </MaskedView>
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

/**
 * Un point = une page : fil sable tant qu'elle est à lire, chocolat
 * une fois lue. Une seule vue par point, teinte unie : à cette taille un dégradé
 * ne se voit pas, et la règle en affiche des centaines (la goutte garde les siens).
 */
const Dot = React.memo(function Dot({ page, left, scrollX }: { page: number; left: number; scrollX: SharedValue<number> }) {
  const t = stitchThick(page);
  const ink = useAnimatedStyle(() => ({
    backgroundColor: scrollX.value >= page * STEP - STEP / 2 ? DOT_READ : DOT_UNREAD,
  }));
  return (
    <Animated.View
      style={[styles.dot, { left: left - t / 2, width: t, height: t, marginTop: -t / 2, borderRadius: t / 2 }, ink]}
    />
  );
});

// ─── Le club, en épingles ────────────────────────────────────────────

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');
const avatarSource = (url: string | null) =>
  url && (url.startsWith('http://') || url.startsWith('https://')) ? { uri: url } : DEFAULT_AVATAR;

function ClubPins({
  club,
  totalPages,
  width,
  scrollX,
}: {
  club: ClubPin[];
  totalPages: number;
  width: number;
  scrollX: SharedValue<number>;
}) {
  // Leur % sur mon édition ; trop proches (moins d'une épingle d'écart), on monte d'un cran
  const placed = useMemo(() => {
    const sorted = club
      .map((m) => ({ ...m, page: Math.round((Math.max(0, Math.min(100, m.percentage)) / 100) * totalPages) }))
      .sort((a, b) => a.page - b.page);
    let prev = -Infinity;
    let level = 0;
    return sorted.map((m) => {
      level = (m.page - prev) * STEP < PIN * 0.8 ? level + 1 : 0;
      prev = m.page;
      return { ...m, level: Math.min(level, 2) };
    });
  }, [club, totalPages]);
  return (
    <>
      {placed.map((m, i) => (
        <Pin
          key={m.id}
          member={m}
          page={m.page}
          level={m.level}
          width={width}
          // Amarrées au bord : la plus lointaine tout au bord, les autres en rang vers l'intérieur
          minX={EDGE + i * DOCK_GAP}
          maxX={width - EDGE - PIN - (placed.length - 1 - i) * DOCK_GAP}
          scrollX={scrollX}
        />
      ))}
    </>
  );
}

function Pin({
  member,
  page,
  level,
  width,
  minX,
  maxX,
  scrollX,
}: {
  member: ClubPin;
  page: number;
  level: number;
  width: number;
  minX: number;
  maxX: number;
  scrollX: SharedValue<number>;
}) {
  const move = useAnimatedStyle(() => {
    const raw = width / 2 + page * STEP - scrollX.value - PIN / 2;
    const x = Math.max(minX, Math.min(maxX, raw));
    const docked = Math.min(1, Math.abs(raw - x) / 12);
    return {
      transform: [{ translateX: x }, { translateY: docked * level * 10 }, { scale: 1 - 0.18 * docked }],
      opacity: 1 - 0.2 * docked,
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pin, { top: LINE_Y - PIN - PIN_TIP - 2 - level * 10 }, move]}
      accessible
      accessibilityLabel={`${member.name}, ${Math.round(member.percentage)} %`}
    >
      {/* Une goutte de verre, la pointe en bas sur la couture (retour de Lea : pas de tige) */}
      <View style={styles.pinDrop}>
        <View style={styles.pinUpright}>
          <Image source={avatarSource(member.photoUrl)} style={styles.pinPhoto} contentFit="cover" />
        </View>
        <View style={styles.pinRim} />
      </View>
    </Animated.View>
  );
}

// ─── La goutte de verre ──────────────────────────────────────────────

/**
 * Posée au centre de la règle, elle montre les pages qu'elle couvre, grossies.
 * Dedans, quelques « emplacements » de points qui suivent la règle sur le fil
 * d'animation : chacun affiche la page qui passe à sa place (lue, à lire, ou la
 * mienne en lie de vin), sans rendu React pendant le geste.
 */
function GlassDrop({
  center,
  totalPages,
  scrollX,
  stretch,
  lag,
}: {
  center: number;
  totalPages: number;
  scrollX: SharedValue<number>;
  stretch: SharedValue<number>;
  lag: SharedValue<number>;
}) {
  const drop = useAnimatedStyle(() => {
    const sx = 1 + stretch.value;
    return { transform: [{ translateX: lag.value }, { scaleX: sx }, { scaleY: 1 / Math.sqrt(sx) }] };
  });
  const slots = [];
  for (let k = -LENS_SPAN; k <= LENS_SPAN + 1; k++) slots.push(k);

  return (
    <Animated.View pointerEvents="none" style={[styles.drop, { left: center - LENS_R }, drop]}>
      <View style={styles.dropClip}>
        <LinearGradient colors={['#fdfcfa', '#f3eee7']} style={StyleSheet.absoluteFill} />
        {slots.map((k) => (
          <LensDot key={k} slot={k} totalPages={totalPages} scrollX={scrollX} lag={lag} />
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
 * Un emplacement dans la goutte : il montre la page `base + slot`, où `base` est
 * la page sous le centre. Comme dans une bille : grossie au centre, elle se tasse
 * et s'arrondit en approchant du bord.
 */
function LensDot({
  slot,
  totalPages,
  scrollX,
  lag,
}: {
  slot: number;
  totalPages: number;
  scrollX: SharedValue<number>;
  lag: SharedValue<number>;
}) {
  const W = 3.6 * ZOOM; // le point d'un repère des dizaines, grossi : les autres sont réduits par `thick`
  const H = W;
  const geom = useAnimatedStyle(() => {
    const x = scrollX.value + lag.value;
    const base = Math.floor(x / STEP);
    const p = base + slot;
    const d = (p * STEP - x) * ZOOM; // distance au centre, grossie
    const u = d / LENS_R;
    const bent = (LENS_R * u) / Math.sqrt(1 + 0.9 * u * u);
    const squash = Math.max(0.35, Math.sqrt(Math.max(0, 1 - Math.min(0.9, (bent / LENS_R) ** 2))));
    const thick = p % 10 === 0 ? 1 : 2.6 / 3.6;
    return {
      opacity: p < 0 || p > totalPages ? 0 : 1,
      transform: [{ translateX: LENS_R + bent - W / 2 }, { scaleX: squash * thick }, { scaleY: thick }],
    };
  });
  // Lue (chocolat), à lire (sable) ; ma page — la plus proche du centre — en lie de vin
  const readLayer = useAnimatedStyle(() => {
    const x = scrollX.value + lag.value;
    const p = Math.floor(x / STEP) + slot;
    return { opacity: scrollX.value >= p * STEP - STEP / 2 ? 1 : 0 };
  });
  const mineLayer = useAnimatedStyle(() => {
    const x = scrollX.value + lag.value;
    const p = Math.floor(x / STEP) + slot;
    return { opacity: Math.round(scrollX.value / STEP) === p ? 1 : 0 };
  });
  return (
    <Animated.View style={[styles.bigDot, { top: LENS_R - H / 2, width: W, height: H, borderRadius: H / 2 }, geom]}>
      <LinearGradient colors={SAND} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, readLayer]}>
        <LinearGradient colors={INK} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, mineLayer]}>
        <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
      </Animated.View>
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
    minHeight: 0,
    alignItems: 'center',
    // Le chiffre posé en bas, près de la couture (Lea) : toute la place au-dessus
    // lui revient, il grossit au lieu de laisser du vide
    justifyContent: 'flex-end',
    paddingTop: NUMBER_TOP,
  },
  number: {
    fontFamily: fonts.displayHero,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    padding: 0,
  },
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
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
  },
  pin: {
    position: 'absolute',
    left: 0,
    width: PIN,
    alignItems: 'center',
  },
  // La goutte : un carré aux trois coins ronds, tourné de 45° — le coin vif fait la pointe
  pinDrop: {
    width: PIN,
    height: PIN,
    borderTopLeftRadius: PIN / 2,
    borderTopRightRadius: PIN / 2,
    borderBottomLeftRadius: PIN / 2,
    borderBottomRightRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#f3eee7',
    transform: [{ rotate: '45deg' }],
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  // Le contenu remis droit dans la goutte
  pinUpright: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ rotate: '-45deg' }, { scale: 1.12 }],
  },
  pinPhoto: {
    ...StyleSheet.absoluteFillObject,
  },
  pinRim: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: PIN / 2,
    borderTopRightRadius: PIN / 2,
    borderBottomLeftRadius: PIN / 2,
    borderBottomRightRadius: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    boxShadow: '0 0 0 1px rgba(90,69,54,0.22)',
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
