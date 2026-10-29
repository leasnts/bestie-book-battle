/**
 * OptionList — les choix de l'onboarding, une ligne pleine largeur par option :
 *
 *    ┌───────────────────────────────────────┐
 *    │ [☀]  Matin                            │   papier clair, cerne fin
 *    └───────────────────────────────────────┘
 *    ┌───────────────────────────────────────┐
 *    │ [☾]  Soir                             │   choisie : dégradé rouge, texte
 *    └───────────────────────────────────────┘   crème, pastille ton sur ton
 *
 * Remplace les petites capsules (FilterChips) dans l'onboarding. Choisie, la
 * ligne se remplit du dégradé rouge avec un léger rebond, le texte passe en
 * crème et la pastille d'icône en rouge plus profond (ton sur ton).
 *
 * - `OptionList` : un seul choix, toujours un sélectionné ; les autres lignes
 *   s'estompent (on les touche encore pour changer d'avis) ;
 * - `ToggleOptionList` : plusieurs choix, aucun obligatoire, rien ne s'estompe.
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  accentGradient,
  borderRadius,
  colors,
  creamAlpha,
  fonts,
  inkAlpha,
  lowki,
  motion,
  shadowAlpha,
  spacing,
} from '../../utils/constants';
import { feel } from '../../utils/feel';
import PressableScale from '../ui/PressableScale';

interface Option<K extends string> {
  key: K;
  label: string;
  icon?: LucideIcon;
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
const TILE = 36;
const RADIUS = borderRadius.lg;

/** Le papier d'une ligne au repos : un cran plus clair que le fond grené */
const PAPER = ['#fdfbf7', '#f3eee6'] as const;
/** La pastille d'icône au repos : le papier un cran plus sombre */
const TILE_IDLE = ['#efe9df', '#e3dbcd'] as const;
/** La pastille sur la ligne choisie : le rouge un cran plus profond (ton sur ton) */
const TILE_ON = [lowki.red.dark, lowki.red.deep] as const;
/** Le liseré clair en haut de la ligne choisie, qui lui donne du relief */
const SHINE = [creamAlpha(0.22), creamAlpha(0)] as const;
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
    shadowOpacity: interpolate(on.value, [0, 1], [0.05, 0.22]),
    shadowRadius: interpolate(on.value, [0, 1], [2, 12]),
    shadowOffset: { width: 0, height: interpolate(on.value, [0, 1], [1, 6]) },
  }));
  const fade = useAnimatedStyle(() => ({ opacity: on.value }));
  const idleFade = useAnimatedStyle(() => ({ opacity: 1 - on.value }));
  const label = useAnimatedStyle(() => ({
    color: interpolateColor(on.value, [0, 1], [colors.textPrimary, colors.white]),
  }));

  const Icon = option.icon;

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
          <View style={[styles.ring, styles.ringIdle]} />
          <Animated.View style={[StyleSheet.absoluteFill, fade]}>
            <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={SHINE} style={styles.shine} />
            <View style={[styles.ring, styles.ringOn]} />
          </Animated.View>
        </View>

        {Icon && (
          <View style={styles.tile}>
            <LinearGradient colors={TILE_IDLE} style={StyleSheet.absoluteFill} />
            <Animated.View style={[StyleSheet.absoluteFill, fade]}>
              <LinearGradient colors={TILE_ON} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View style={[styles.center, idleFade]}>
              <Icon size={19} color={colors.textSecondary} strokeWidth={2} />
            </Animated.View>
            <Animated.View style={[styles.center, fade]}>
              <Icon size={19} color={colors.white} strokeWidth={2} />
            </Animated.View>
          </View>
        )}

        <Animated.Text style={[styles.label, label]} numberOfLines={1}>
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
    borderColor: lowki.red.deep,
  },
  shine: {
    ...StyleSheet.absoluteFill,
    bottom: '50%',
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: borderRadius.md - 2,
    overflow: 'hidden',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
});
