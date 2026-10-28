/**
 * Ouverture : les problèmes, avant la solution (idée reprise de Basta).
 *
 * Trois problèmes de lectrice défilent seuls, en plein écran aux couleurs
 * Lowki : rouge (dans la continuité du splash), chocolat, beige. Derrière,
 * une pile de livres couchés, ton sur ton, tombe à l'arrivée. « Passer » reste
 * là ; toucher l'écran passe au suivant. Ne se montre qu'une fois.
 *
 * Ensuite : la promesse.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccentWord from '../../components/ui/AccentWord';
import { ONBOARDING_TITLE } from '../../components/onboarding/OnboardingScreen';
import Spine from '../../components/onboarding/Spine';
import { colors, fonts, lowki, motion, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';

/** Un cran sous le beige foncé : les livres ton sur ton sur le fond beige */
const BEIGE_DEEP = '#86664a';

const PROBLEMS = [
  { text: 'Lire à deux, et décrocher au chapitre 3 ?', accent: 'décrocher', pair: lowki.red, spine: [lowki.red.dark, lowki.red.deep], ink: lowki.butter.light },
  { text: 'Un livre génial, et personne à qui en parler ?', accent: 'parler', pair: lowki.chocolate, spine: [lowki.chocolate.dark, colors.dark950], ink: lowki.butter.light },
  { text: 'Toujours « je m’y remets demain » ?', accent: 'demain', pair: lowki.beige, spine: [lowki.beige.dark, BEIGE_DEEP], ink: colors.dark900 },
] as const;

/** La place prise par la pile, en bas : la phrase reste au-dessus */
const PILE_TOP = 120 + 7 * 29;
/** Sur un grand écran (iPhone Duo déplié), la phrase garde une largeur de téléphone */
const MAX_TEXT = 460;

/** Le temps de lire une phrase */
const DWELL = 2600;

/** Les livres couchés de la pile : largeur, inclinaison */
const SPINES = [
  [220, -1],
  [186, 2],
  [204, -2],
  [170, 1],
  [212, -1],
  [178, 3],
  [196, -2],
] as const;

export default function IntroScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    router.replace('/onboarding/promesse');
  }, [router]);

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i >= PROBLEMS.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [finish]);

  useEffect(() => {
    const timer = setTimeout(advance, DWELL);
    return () => clearTimeout(timer);
  }, [index, advance]);

  const problem = PROBLEMS[index];

  return (
    <Pressable style={styles.root} onPress={advance} accessibilityRole="button" accessibilityHint="Passe à la suite">
      {PROBLEMS.map((p, i) => (
        <Backdrop key={i} colors={[p.pair.light, p.pair.dark]} visible={i === index} />
      ))}

      <SafeAreaView style={styles.fill}>
        <View style={styles.top}>
          <Pressable
            onPress={() => {
              feel('tic');
              finish();
            }}
            hitSlop={12}
            accessibilityRole="button"
          >
            <Text style={[styles.skip, { color: problem.ink }]}>Passer</Text>
          </Pressable>
        </View>

        <View style={styles.textZone}>
          <Animated.Text
            key={index}
            entering={FadeInDown.duration(450).delay(150).easing(Easing.bezier(...motion.easing.easeOutQuart))}
            exiting={FadeOutUp.duration(300)}
            style={[styles.problem, { color: problem.ink }]}
            accessibilityLiveRegion="polite"
          >
            <AccentWord text={problem.text} accent={problem.accent} size={ONBOARDING_TITLE} />
          </Animated.Text>
        </View>

        <View style={styles.pile} pointerEvents="none">
          {SPINES.map(([width, angle], i) => (
            <Animated.View
              key={i}
              entering={reducedMotion ? undefined : FadeInDown.duration(500).delay(100 + i * 100).springify().damping(16)}
              style={[styles.spine, { transform: [{ rotate: `${angle}deg` }] }]}
            >
              <Spine width={width} colors={problem.spine} />
            </Animated.View>
          ))}
        </View>

        <View style={styles.dots}>
          {PROBLEMS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: problem.ink, opacity: i === index ? 1 : 0.35 }, i === index && styles.dotOn]}
            />
          ))}
        </View>
      </SafeAreaView>
    </Pressable>
  );
}

/** Un fond en dégradé qui se fond dans le suivant (600 ms) */
function Backdrop({ colors: pair, visible }: { colors: readonly [string, string]; visible: boolean }) {
  const opacity = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 600, easing: Easing.bezier(...motion.easing.easeOutQuart) });
  }, [visible, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} entering={FadeIn}>
      <LinearGradient colors={pair} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: lowki.red.dark,
  },
  fill: {
    flex: 1,
  },
  top: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    minHeight: 44,
  },
  skip: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    textDecorationLine: 'underline',
    paddingVertical: spacing.sm,
  },
  // Au-dessus de la pile : le reste de la hauteur, la phrase centrée dedans
  textZone: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: PILE_TOP,
    paddingHorizontal: spacing['3xl'],
    maxWidth: MAX_TEXT,
    width: '100%',
    alignSelf: 'center',
  },
  problem: {
    fontFamily: fonts.display,
    fontSize: ONBOARDING_TITLE,
    lineHeight: 36,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  pile: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 120,
    alignItems: 'center',
    flexDirection: 'column-reverse',
    gap: 3,
  },
  spine: {
    opacity: 0.85,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOn: {
    width: 16,
  },
});
