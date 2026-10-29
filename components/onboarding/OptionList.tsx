/**
 * OptionList — les choix de l'onboarding, une ligne pleine largeur par option :
 *
 *    ┌───────────────────────────────────────┐
 *    │  ☀  Matin                             │   papier clair, cerne fin
 *    └───────────────────────────────────────┘
 *    ┌───────────────────────────────────────┐
 *    │ ·☾··Soir······························│   choisie : soulevée, couture
 *    └───────────────────────────────────────┘   rouge tout le tour
 *
 * Remplace les petites capsules (FilterChips) dans l'onboarding. Choisie, la
 * ligne se prend un voile rosé et se brode : une couture rouge à points ronds, collée au
 * bord, avec un léger rebond. À gauche, l'illustration du choix,
 * qui ne change pas.
 *
 * - `OptionList` : un seul choix, toujours un sélectionné ; les autres lignes
 *   s'estompent (on les touche encore pour changer d'avis) ;
 * - `ToggleOptionList` : plusieurs choix, aucun obligatoire, rien ne s'estompe.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  borderRadius,
  colors,
  fonts,
  inkAlpha,
  motion,
  shadowAlpha,
  spacing,
} from '../../utils/constants';
import { feel } from '../../utils/feel';
import PressableScale from '../ui/PressableScale';
import { StitchBorder } from '../ui/Stitch';

interface Option<K extends string> {
  key: K;
  label: string;
  /** L'illustration de gauche (aquarelle, assets/images/onboarding) */
  illustration?: number;
}

interface OptionListProps<K extends string> {
  options: Option<K>[];
  value: K;
  onChange: (key: K) => void;
}

interface ToggleOptionListProps<K extends string> {
  options: Option<K>[];
  values: K[];
  onChange: (keys: K[]) => void;
}

export const OPTION_H = 60;
const ILLUSTRATION = 40;
const RADIUS = borderRadius.lg;

/** Le papier d'une ligne au repos : un cran plus clair que le fond grené */
const PAPER = ['#fdfbf7', '#f3eee6'] as const;
/** La ligne choisie : un voile rouge très léger, rosé (piste C1) */
const PAPER_ON = ['#f9ecea', '#f1dcdb'] as const;
/** La couture de la ligne choisie : rouge Lowki, collée au bord */
const STITCH_ON = colors.accent;
const STITCH_WEIGHT = 2;
const STITCH_INSET = 3;
/** L'opacité d'une ligne non choisie quand un seul choix est possible */
const DIMMED = 0.45;

export default function OptionList<K extends string>({ options, value, onChange }: OptionListProps<K>) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {options.map((option) => (
        <OptionRow
          key={option.key}
          option={option}
          selected={option.key === value}
          dimmed={option.key !== value}
          single
          onPress={() => onChange(option.key)}
        />
      ))}
    </View>
  );
}

export function ToggleOptionList<K extends string>({ options, values, onChange }: ToggleOptionListProps<K>) {
  return (
    <View style={styles.list}>
      {options.map((option) => {
        const selected = values.includes(option.key);
        return (
          <OptionRow
            key={option.key}
            option={option}
            selected={selected}
            onPress={() => onChange(selected ? values.filter((k) => k !== option.key) : [...values, option.key])}
          />
        );
      })}
    </View>
  );
}

function OptionRow<K extends string>({
  option,
  selected,
  dimmed = false,
  single = false,
  onPress,
}: {
  option: Option<K>;
  selected: boolean;
  dimmed?: boolean;
  single?: boolean;
  onPress: () => void;
}) {
  const reduced = useReducedMotion();
  const on = useSharedValue(selected ? 1 : 0);
  const dim = useSharedValue(dimmed ? 1 : 0);
  const bump = useSharedValue(1);

  useEffect(() => {
    const target = selected ? 1 : 0;
    if (reduced) {
      on.value = target;
      return;
    }
    on.value = withTiming(target, { duration: motion.duration.standard });
    if (selected) {
      bump.value = withSequence(
        withTiming(1.025, { duration: motion.duration.instant }),
        withSpring(1, { damping: 11, stiffness: 260 }),
      );
    }
  }, [selected, reduced, on, bump]);

  useEffect(() => {
    dim.value = reduced ? (dimmed ? 1 : 0) : withTiming(dimmed ? 1 : 0, { duration: motion.duration.standard });
  }, [dimmed, reduced, dim]);

  const row = useAnimatedStyle(() => ({
    opacity: interpolate(dim.value, [0, 1], [1, DIMMED]),
    transform: [{ scale: bump.value }],
    shadowOpacity: interpolate(on.value, [0, 1], [0.05, 0.14]),
    shadowRadius: interpolate(on.value, [0, 1], [2, 10]),
    shadowOffset: { width: 0, height: interpolate(on.value, [0, 1], [1, 4]) },
  }));
  const fade = useAnimatedStyle(() => ({ opacity: on.value }));
  const idleFade = useAnimatedStyle(() => ({ opacity: 1 - on.value }));

  return (
    <PressableScale
      pressedScale={0.97}
      onPress={() => {
        feel('tic');
        onPress();
      }}
      accessibilityRole={single ? 'radio' : 'checkbox'}
      accessibilityState={single ? { selected } : { checked: selected }}
      accessibilityLabel={option.label}
    >
      <Animated.View style={[styles.row, row]}>
        <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
          <LinearGradient colors={PAPER} style={StyleSheet.absoluteFill} />
          <Animated.View style={[StyleSheet.absoluteFill, fade]}>
            <LinearGradient colors={PAPER_ON} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.View style={[styles.ring, styles.ringIdle, idleFade]} />
          <Animated.View style={[styles.ring, styles.ringOn, fade]} />
          <Animated.View style={[StyleSheet.absoluteFill, fade]}>
            <StitchBorder radius={RADIUS} inset={STITCH_INSET} color={STITCH_ON} weight={STITCH_WEIGHT} />
          </Animated.View>
        </View>

        {option.illustration && <Image source={option.illustration} style={styles.illustration} contentFit="contain" />}

        <Animated.Text style={styles.label} numberOfLines={1}>
          {option.label}
        </Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: OPTION_H,
    paddingHorizontal: spacing.md,
    borderRadius: RADIUS,
    shadowColor: shadowAlpha(1),
  },
  clip: {
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADIUS,
  },
  ringIdle: {
    borderWidth: 1,
    borderColor: inkAlpha(0.09),
  },
  ringOn: {
    borderWidth: 1,
    borderColor: 'rgba(166,47,67,0.3)',
  },
  illustration: {
    width: ILLUSTRATION,
    height: ILLUSTRATION,
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
