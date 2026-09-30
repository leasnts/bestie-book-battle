/**
 * OpenBookPicker — ma page, en livre ouvert.
 *
 * Remplace le chiffre qui défilait seul au milieu du cadre (retour de Lea,
 * 2026-09-30 : « des chiffres solo au milieu de rien, le / 624 pas beau »).
 * Maquette : https://claude.ai/artifact/LHcESZK1418eDJSUatpYP1 (★ A).
 *
 * - Page de droite = ma page, en gros folio ; gauche = la précédente, en petit.
 *   Le total n'est plus un « / 624 » : c'est le titre courant « sur 624 ».
 * - Toucher la page de droite (gauche) : une page tourne en avant (en arrière),
 *   en 3D autour de la reliure, avec les ombres qui passent.
 * - Appuyer puis glisser : on feuillette sous le doigt. Petit geste = page à
 *   page, grand geste = loin (courbe), doigt au bord = ça continue tout seul.
 *   Une pastille ‹ 172 +15 › suit, le livre se soulève, un tic par page.
 * - Pour le faire comprendre sans texte : le coin corné se soulève de temps en
 *   temps, et une démonstration (doigt fantôme) se joue une seule fois.
 *
 * « Réduire les animations » : les pages changent sans tourner, rien ne bouge
 * seul. VoiceOver : réglable (glisser vers le haut / bas = page suivante /
 * précédente).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { accentGradient, colors, creamAlpha, fonts, inkAlpha } from '../../utils/constants';

interface OpenBookPickerProps {
  /** Page affichée (celle de droite) */
  currentPage: number;
  /** Dernière page enregistrée : la démonstration y revient */
  savedPage: number;
  /** Nombre de pages de MON édition */
  totalPages: number;
  onPageChange: (page: number) => void;
}

type Turn = { dir: 1 | -1; leafNum: number; lag: number } | null;

const COACH_KEY = 'bbb.openBookCoach.v1';
/** Tourner une page : le glissé old school de Lea, sans rebond */
const TURN_MS = 620;
const TURN_EASING = Easing.bezier(0.45, 0.05, 0.2, 1);
/** Une feuille pendant qu'on feuillette */
const FLUTTER_MS = 300;
/** Appui avant de pouvoir feuilleter */
const LONG_PRESS_MS = 260;

const LINE = '#e2dbd2';
const PAPER_LEFT = ['#fbf9f6', '#f3eee7', '#d9cfc3'] as const;
const PAPER_RIGHT = ['#d9cfc3', '#f3eee7', '#fbf9f6'] as const;

export default function OpenBookPicker({ currentPage, savedPage, totalPages, onPageChange }: OpenBookPickerProps) {
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };
  const pageW = size.w / 2;
  const folioSize = Math.max(40, Math.min(72, Math.round(size.h * 0.24)));

  const clamp = useCallback((n: number) => Math.max(0, Math.min(totalPages, n)), [totalPages]);
  // Toujours la dernière page, même entre deux rendus (glissé rapide)
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;

  // ─── Une page qui tourne ───────────────────────────────────────────
  const [turn, setTurn] = useState<Turn>(null);
  const progress = useSharedValue(0);
  const endTurn = useCallback(() => setTurn(null), []);

  const turnPage = useCallback(
    (dir: 1 | -1) => {
      const p = pageRef.current;
      const target = clamp(p + dir);
      if (target === p) return;
      pageRef.current = target;
      onPageChange(target);
      Haptics.selectionAsync().catch(() => {});
      if (reducedMotion) return;
      setTurn({ dir, leafNum: dir > 0 ? p : p - 1, lag: dir > 0 ? p - 1 : p });
      cancelAnimation(progress);
      progress.value = 0;
      progress.value = withTiming(1, { duration: TURN_MS, easing: TURN_EASING }, (done) => {
        if (done) runOnJS(endTurn)();
      });
    },
    [clamp, onPageChange, reducedMotion, progress, endTurn],
  );

  // ─── Feuilleter : appuyer puis glisser ─────────────────────────────
  const [scrubbing, setScrubbing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const scrub = useRef<{ base: number; dx: number; drift: number } | null>(null);
  const driftTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const movingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTick = useRef(0);
  const lift = useSharedValue(0);
  const flutter = useSharedValue(0);
  const edge = Math.max(110, size.w * 0.4);

  const apply = useCallback(() => {
    const s = scrub.current;
    if (!s) return;
    const a = Math.abs(s.dx);
    // Petit geste = page à page ; plus on s'éloigne, plus ça va loin
    const offset = Math.sign(s.dx) * Math.round(a / 8 + Math.pow(a / 40, 2));
    const target = clamp(s.base + offset + s.drift);
    const prev = pageRef.current;
    if (target === prev) return;
    pageRef.current = target;
    onPageChange(target);
    setDir(target > prev ? 1 : -1);
    setMoving(true);
    const now = Date.now();
    if (now - lastTick.current > 35) {
      lastTick.current = now;
      Haptics.selectionAsync().catch(() => {});
    }
    if (movingTimer.current) clearTimeout(movingTimer.current);
    movingTimer.current = setTimeout(() => setMoving(false), 180);
  }, [clamp, onPageChange]);

  const startScrub = useCallback(() => {
    if (scrub.current) return;
    scrub.current = { base: pageRef.current, dx: 0, drift: 0 };
    setScrubbing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    lift.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.exp) });
    // Doigt au bord : ça continue d'avancer tout seul
    driftTimer.current = setInterval(() => {
      const s = scrub.current;
      if (s && Math.abs(s.dx) > edge) {
        s.drift += Math.sign(s.dx);
        apply();
      }
    }, 70);
  }, [apply, edge, lift]);

  const updateScrub = useCallback(
    (dx: number) => {
      if (!scrub.current) return;
      scrub.current.dx = dx;
      apply();
    },
    [apply],
  );

  const endScrub = useCallback(() => {
    if (!scrub.current) return;
    scrub.current = null;
    if (driftTimer.current) clearInterval(driftTimer.current);
    if (movingTimer.current) clearTimeout(movingTimer.current);
    setScrubbing(false);
    setMoving(false);
    lift.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.exp) });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [lift]);

  // Les feuilles défilent tant que la page change sous le doigt
  useEffect(() => {
    if (moving && !reducedMotion) {
      flutter.value = 0;
      flutter.value = withRepeat(withTiming(1, { duration: FLUTTER_MS, easing: Easing.linear }), -1);
    } else {
      cancelAnimation(flutter);
    }
  }, [moving, reducedMotion, flutter]);

  useEffect(
    () => () => {
      if (driftTimer.current) clearInterval(driftTimer.current);
      if (movingTimer.current) clearTimeout(movingTimer.current);
    },
    [],
  );

  // ─── Démonstration, une seule fois ─────────────────────────────────
  const [finger, setFinger] = useState<null | 'tap' | 'press'>(null);
  const fingerX = useSharedValue(0);
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoRunning = useRef(false);

  const stopDemo = useCallback(() => {
    if (!demoRunning.current) return;
    demoRunning.current = false;
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
    setFinger(null);
    endScrub();
  }, [endScrub]);

  useEffect(() => {
    if (reducedMotion || size.w === 0) return;
    let cancelled = false;
    AsyncStorage.getItem(COACH_KEY)
      .then((seen) => {
        if (seen || cancelled) return;
        AsyncStorage.setItem(COACH_KEY, '1').catch(() => {});
        demoRunning.current = true;
        const at = (ms: number, fn: () => void) => demoTimers.current.push(setTimeout(fn, ms));
        // 1. un toucher = une page
        at(1200, () => {
          fingerX.value = 0;
          setFinger('tap');
        });
        at(1450, () => turnPage(1));
        at(1900, () => setFinger(null));
        // 2. appuyer, puis glisser
        at(2700, () => setFinger('press'));
        at(3000, startScrub);
        const path = [...Array.from({ length: 20 }, (_, i) => (i + 1) * 5), ...Array.from({ length: 12 }, (_, i) => 95 - i * 5)];
        path.forEach((dx, i) =>
          at(3200 + i * 55, () => {
            fingerX.value = dx * 0.55;
            updateScrub(dx);
          }),
        );
        const end = 3200 + path.length * 55;
        at(end + 400, () => {
          endScrub();
          setFinger(null);
        });
        // 3. retour à ma page enregistrée
        at(end + 1000, () => {
          demoRunning.current = false;
          pageRef.current = savedPage;
          onPageChange(savedPage);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      demoTimers.current.forEach(clearTimeout);
    };
    // Une seule fois, quand le livre a sa taille
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w > 0]);

  // ─── Gestes ────────────────────────────────────────────────────────
  const onTap = useCallback(
    (x: number) => {
      if (turn) return;
      turnPage(x >= size.w / 2 ? 1 : -1);
    },
    [turn, turnPage, size.w],
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onBegin(() => {
      runOnJS(stopDemo)();
    })
    .onStart(() => {
      runOnJS(startScrub)();
    })
    .onUpdate((e) => {
      runOnJS(updateScrub)(e.translationX);
    })
    .onFinalize(() => {
      runOnJS(endScrub)();
    });
  const tap = Gesture.Tap()
    .maxDuration(LONG_PRESS_MS)
    .onEnd((e, success) => {
      if (success) runOnJS(onTap)(e.x);
    });
  const gesture = Gesture.Exclusive(pan, tap);

  // ─── Styles animés ─────────────────────────────────────────────────
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 * lift.value }, { scale: 1 + 0.015 * lift.value }],
    shadowOpacity: interpolate(lift.value, [0, 1], [0.14, 0.24]),
    shadowRadius: interpolate(lift.value, [0, 1], [9, 16]),
  }));
  // L'ombre de la feuille qui passe sur la page découverte
  const revealShade = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 1], [0, 1, 0]),
  }));
  const fingerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: fingerX.value }] }));

  // Le coin corné se soulève de temps en temps
  const peek = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion) return;
    peek.value = withRepeat(
      withSequence(
        withDelay(4200, withTiming(1.55, { duration: 280, easing: Easing.out(Easing.quad) })),
        withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    return () => cancelAnimation(peek);
  }, [reducedMotion, peek]);
  const peekStyle = useAnimatedStyle(() => ({ transform: [{ scale: peek.value }] }));

  const leftNum = turn?.dir === 1 ? turn.lag : currentPage - 1;
  const rightNum = turn?.dir === -1 ? turn.lag : currentPage;
  // Même écart que la rangée ↺ +n ✓ : depuis ma page enregistrée
  const delta = currentPage - savedPage;
  const faceProps = { w: pageW, h: size.h, total: totalPages, folioSize };

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.fill}
        onLayout={onLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Ma page"
        accessibilityValue={{ text: `page ${currentPage} sur ${totalPages}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => turnPage(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      >
        {size.w > 0 && (
          <Animated.View style={[styles.book, liftStyle]}>
            <View style={[styles.spread, { width: size.w, height: size.h }]}>
              <View style={{ width: pageW, height: size.h }}>
                <LeftFace num={leftNum} {...faceProps} />
                <View style={styles.cornerLeft} pointerEvents="none">
                  <LinearGradient
                    colors={['#e3d9cc', '#f6f1ea', 'transparent', 'transparent']}
                    locations={[0, 0.5, 0.5, 1]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              </View>
              <View style={{ width: pageW, height: size.h }}>
                <RightFace num={rightNum} {...faceProps} />
                {turn?.dir === 1 && (
                  <Animated.View style={[StyleSheet.absoluteFill, revealShade]} pointerEvents="none">
                    <LinearGradient
                      colors={[inkAlpha(0.28), inkAlpha(0)]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.7, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                )}
                <Animated.View style={[styles.cornerRight, peekStyle]} pointerEvents="none">
                  <LinearGradient
                    colors={['#e3d9cc', '#f6f1ea', 'transparent', 'transparent']}
                    locations={[0, 0.5, 0.5, 1]}
                    start={{ x: 1, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>

              {turn && (
                <Leaf dir={turn.dir} w={pageW} h={size.h} progress={progress}>
                  {turn.dir === 1 ? (
                    <RightFace num={turn.leafNum} {...faceProps} />
                  ) : (
                    <LeftFace num={turn.leafNum} {...faceProps} />
                  )}
                  {turn.dir === 1 ? (
                    <LeftFace num={turn.leafNum} {...faceProps} />
                  ) : (
                    <RightFace num={turn.leafNum} {...faceProps} />
                  )}
                </Leaf>
              )}

              {moving && !reducedMotion && (
                <>
                  <Leaf dir={dir} w={pageW} h={size.h} progress={flutter} phase={0}>
                    <BlankFace side={dir === 1 ? 'right' : 'left'} />
                    <BlankFace side={dir === 1 ? 'left' : 'right'} />
                  </Leaf>
                  <Leaf dir={dir} w={pageW} h={size.h} progress={flutter} phase={0.5}>
                    <BlankFace side={dir === 1 ? 'right' : 'left'} />
                    <BlankFace side={dir === 1 ? 'left' : 'right'} />
                  </Leaf>
                </>
              )}
            </View>

          </Animated.View>
        )}
        {/* Au-dessus du livre, hors de son espace 3D : les feuilles qui tournent ne passent pas devant */}
        {scrubbing && (
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(200)} style={styles.bubbleWrap} pointerEvents="none">
            <LinearGradient colors={accentGradient} style={styles.bubble}>
              <ChevronLeftIcon size={16} strokeWidth={2.6} color={creamAlpha(moving && dir < 0 ? 1 : 0.45)} />
              <View style={styles.bubbleCenter}>
                <Text style={styles.bubblePage}>{currentPage}</Text>
                {delta !== 0 && (
                  <Text style={styles.bubbleDelta}>
                    {delta > 0 ? '+' : '−'}
                    {Math.abs(delta)}
                  </Text>
                )}
              </View>
              <ChevronRightIcon size={16} strokeWidth={2.6} color={creamAlpha(moving && dir > 0 ? 1 : 0.45)} />
            </LinearGradient>
          </Animated.View>
        )}

        {finger && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            pointerEvents="none"
            style={[styles.finger, { left: pageW + pageW / 2 - 23, top: size.h * 0.55 }, fingerStyle]}
          >
            {finger === 'press' && <Animated.View entering={FadeIn.duration(300)} style={styles.fingerRing} />}
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

// ─── Une feuille qui tourne autour de la reliure ─────────────────────

interface LeafProps {
  dir: 1 | -1;
  w: number;
  h: number;
  progress: SharedValue<number>;
  /** Décalage dans la boucle, pour feuilleter à plusieurs feuilles */
  phase?: number;
  /** [recto, verso] */
  children: React.ReactNode[];
}

function Leaf({ dir, w, h, progress, phase = 0, children }: LeafProps) {
  // Chaque face tourne elle-même (le verso a 180° d'avance) : iOS ne cache le
  // dos d'une vue que si c'est elle qui est tournée, pas son parent.
  const front = useAnimatedStyle(() => {
    const p = (progress.value + phase) % 1;
    return { transform: [{ perspective: 1200 }, { rotateY: `${dir === 1 ? -180 * p : 180 * p}deg` }] };
  });
  const back = useAnimatedStyle(() => {
    const p = (progress.value + phase) % 1;
    return { transform: [{ perspective: 1200 }, { rotateY: `${dir === 1 ? 180 - 180 * p : 180 * p - 180}deg` }] };
  });
  // L'ombre sur la feuille, la plus forte à la verticale
  const shade = useAnimatedStyle(() => {
    const p = (progress.value + phase) % 1;
    return { opacity: interpolate(p, [0, 0.45, 1], [0, 1, 0]) };
  });
  const place = {
    width: w,
    height: h,
    left: dir === 1 ? w : 0,
    transformOrigin: dir === 1 ? 'left center' : 'right center',
  } as const;
  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.leaf, place, front]}>
        {children[0]}
        <Animated.View style={[StyleSheet.absoluteFill, shade]}>
          <LinearGradient
            colors={[inkAlpha(0), inkAlpha(0.3)]}
            start={{ x: dir === 1 ? 0 : 1, y: 0 }}
            end={{ x: dir === 1 ? 1 : 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.leaf, place, back]}>
        {children[1]}
        <Animated.View style={[StyleSheet.absoluteFill, shade]}>
          <LinearGradient
            colors={[inkAlpha(0.25), inkAlpha(0)]}
            start={{ x: dir === 1 ? 0 : 1, y: 0 }}
            end={{ x: dir === 1 ? 1 : 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>
    </>
  );
}

// ─── Les pages ───────────────────────────────────────────────────────

interface FaceProps {
  num: number;
  w: number;
  h: number;
  total: number;
  folioSize: number;
}

/** Des lignes de texte, pour que la page se lise comme une page */
function Lines({ height, width = '100%' }: { height: number; width?: `${number}%` }) {
  const rows = Math.max(0, Math.floor(height / 11));
  return (
    <View style={{ height, width }}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={[styles.line, i === rows - 1 && { width: '60%' }]} />
      ))}
    </View>
  );
}

function LeftFace({ num, h }: FaceProps) {
  return (
    <LinearGradient
      colors={PAPER_LEFT}
      locations={[0, 0.8, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[StyleSheet.absoluteFill, styles.pageLeft]}
    >
      <Lines height={h - 58} />
      <Text style={styles.folioSmall} importantForAccessibility="no">
        {num >= 1 ? num : ''}
      </Text>
    </LinearGradient>
  );
}

function RightFace({ num, h, total, folioSize }: FaceProps) {
  return (
    <LinearGradient
      colors={PAPER_RIGHT}
      locations={[0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[StyleSheet.absoluteFill, styles.pageRight]}
    >
      <View style={styles.rightTop}>
        <Text style={styles.runningHead}>sur {total}</Text>
        <Lines height={Math.max(0, h - folioSize - 64)} width="92%" />
      </View>
      <Text
        style={[styles.folioBig, { fontSize: folioSize, lineHeight: Math.round(folioSize * 1.05) }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {num}
      </Text>
    </LinearGradient>
  );
}

function BlankFace({ side }: { side: 'left' | 'right' }) {
  return (
    <LinearGradient
      colors={side === 'left' ? PAPER_LEFT : PAPER_RIGHT}
      locations={side === 'left' ? [0, 0.8, 1] : [0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[StyleSheet.absoluteFill, side === 'left' ? styles.pageLeft : styles.pageRight]}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const RADIUS = 10;
const CORNER = 24;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  book: {
    flex: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
  },
  spread: {
    flexDirection: 'row',
    borderRadius: RADIUS,
  },
  pageLeft: {
    borderTopLeftRadius: RADIUS,
    borderBottomLeftRadius: RADIUS,
    overflow: 'hidden',
    paddingTop: 14,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  pageRight: {
    borderTopRightRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    overflow: 'hidden',
    paddingTop: 14,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 14,
    justifyContent: 'space-between',
  },
  line: {
    height: 3,
    marginBottom: 8,
    borderRadius: 1.5,
    backgroundColor: LINE,
  },
  rightTop: {
    gap: 8,
  },
  runningHead: {
    alignSelf: 'flex-end',
    fontFamily: fonts.displayRegular,
    fontSize: 12,
    color: colors.textPlaceholder,
  },
  folioSmall: {
    marginLeft: 14,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.textPlaceholder,
    fontVariant: ['tabular-nums'],
  },
  folioBig: {
    alignSelf: 'flex-end',
    marginRight: 16,
    fontFamily: fonts.displayHero,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  cornerRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: CORNER,
    height: CORNER,
    borderBottomRightRadius: RADIUS,
    overflow: 'hidden',
    transformOrigin: 'right bottom',
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: -2, height: -2 },
  },
  cornerLeft: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderBottomLeftRadius: RADIUS,
    overflow: 'hidden',
  },
  leaf: {
    position: 'absolute',
    top: 0,
    backfaceVisibility: 'hidden',
  },
  bubbleWrap: {
    position: 'absolute',
    zIndex: 10,
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bubble: {
    height: 40,
    minWidth: 140,
    borderRadius: 20,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    shadowColor: '#5e1f2e',
    shadowOpacity: 0.35,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 6 },
  },
  bubbleCenter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bubblePage: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: creamAlpha(1),
    fontVariant: ['tabular-nums'],
  },
  bubbleDelta: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: creamAlpha(0.85),
    fontVariant: ['tabular-nums'],
  },
  finger: {
    position: 'absolute',
    zIndex: 11,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: inkAlpha(0.2),
    borderWidth: 2,
    borderColor: creamAlpha(0.85),
  },
  fingerRing: {
    position: 'absolute',
    top: -9,
    left: -9,
    right: -9,
    bottom: -9,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.accent,
  },
});
