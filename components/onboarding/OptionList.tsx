/**
 * OptionList — les choix de l'onboarding, une ligne pleine largeur par option :
 *
 *    ┌───────────────────────────────────────┐
 *    │ [☀]  Matin                        ( ) │   papier, cerne fin
 *    └───────────────────────────────────────┘
 *    ┌───────────────────────────────────────┐
 *    │ [☾]  Soir                         (●) │   choisie : cerne rouge, voile
 *    └───────────────────────────────────────┘   rouge, pastille d'icône rouge
 *
 * Remplace les petites capsules (FilterChips) dans l'onboarding. Choisie, la
 * ligne prend un voile rouge très léger et un cerne rouge, sa pastille d'icône
 * passe au dégradé rouge, et le rond de droite se remplit avec un petit rebond
 * (point crème pour un choix unique, coche pour un choix multiple).
 *
 * - `OptionList` : un seul choix, toujours un sélectionné (radio) ;
 * - `ToggleOptionList` : plusieurs choix, aucun obligatoire (cases).
 */

import { LinearGradient } from 'expo-linear-gradient';
import { CheckIcon, type LucideIcon } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  accentGradient,
  bevel,
  borderRadius,
  colors,
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
const MARK = 24;
const RADIUS = borderRadius.lg;

/** Le voile rouge de la ligne choisie : à peine teintée, plus dense en bas */
const SELECTED_WASH = ['rgba(166,47,67,0.05)', 'rgba(124,32,49,0.11)'] as const;
/** La pastille d'icône au repos : le papier un cran plus sombre */
const TILE_IDLE = ['#ece5da', '#e0d7c9'] as const;

/** Le point crème du rond choisi */
const DOT = ['#fdfcfa', '#efe7da'] as const;

const SPRING = { damping: 13, stiffness: 240, mass: 0.8 };

export default function OptionList<K extends string>({ options, value, onChange }: OptionListProps<K>) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {options.map((option) => (
        <OptionRow
          key={option.key}
          option={option}
          selected={option.key === value}
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
  single = false,
  onPress,
}: {
  option: Option<K>;
  selected: boolean;
  single?: boolean;
  onPress: () => void;
}) {
  const reduced = useReducedMotion();
  const on = useSharedValue(selected ? 1 : 0);
  const pop = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    if (reduced) {
      on.value = target;
      pop.value = target;
      return;
    }
    on.value = withTiming(target, { duration: motion.duration.standard });
    pop.value = selected ? withSpring(1, SPRING) : withTiming(0, { duration: motion.duration.instant });
  }, [selected, reduced, on, pop]);

  const fade = useAnimatedStyle(() => ({ opacity: on.value }));
  const idleFade = useAnimatedStyle(() => ({ opacity: 1 - on.value }));
  const lift = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(on.value, [0, 1], [0.06, 0.16]),
    shadowRadius: interpolate(on.value, [0, 1], [3, 10]),
    shadowOffset: { width: 0, height: interpolate(on.value, [0, 1], [1, 4]) },
  }));
  const mark = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.5),
    transform: [{ scale: interpolate(pop.value, [0, 1], [0.4, 1]) }],
  }));
  const tile = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pop.value, [0, 0.5, 1], [1, 1.08, 1]) }],
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
      <Animated.View style={[styles.row, lift]}>
        <LinearGradient colors={bevel.paper.fill} style={[StyleSheet.absoluteFill, styles.round]} />
        <Animated.View style={[StyleSheet.absoluteFill, fade]} pointerEvents="none">
          <LinearGradient colors={SELECTED_WASH} style={[StyleSheet.absoluteFill, styles.round]} />
        </Animated.View>
        {/* Le cerne : fin et sombre au repos, rouge une fois choisie */}
        <Animated.View style={[styles.ring, styles.ringIdle, idleFade]} pointerEvents="none" />
        <Animated.View style={[styles.ring, styles.ringOn, fade]} pointerEvents="none" />

        {Icon && (
          <Animated.View style={[styles.tile, tile]}>
            <LinearGradient colors={TILE_IDLE} style={StyleSheet.absoluteFill} />
            <Animated.View style={[StyleSheet.absoluteFill, fade]}>
              <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View style={[styles.center, idleFade]}>
              <Icon size={19} color={colors.textSecondary} strokeWidth={2} />
            </Animated.View>
            <Animated.View style={[styles.center, fade]}>
              <Icon size={19} color={colors.white} strokeWidth={2} />
            </Animated.View>
          </Animated.View>
        )}

        <Text style={styles.label} numberOfLines={1}>
          {option.label}
        </Text>

        <View style={styles.mark}>
          <Animated.View style={[styles.markFill, mark]}>
            <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
            {single ? <LinearGradient colors={DOT} style={styles.dot} /> : <CheckIcon size={14} color={colors.white} strokeWidth={3} />}
          </Animated.View>
        </View>
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
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    borderRadius: RADIUS,
    shadowColor: shadowAlpha(1),
  },
  round: {
    borderRadius: RADIUS,
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADIUS,
  },
  ringIdle: {
    borderWidth: 1,
    borderColor: inkAlpha(0.1),
  },
  ringOn: {
    borderWidth: 1.5,
    borderColor: colors.accent,
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
    color: colors.textPrimary,
  },
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: MARK / 2,
    borderWidth: 1.5,
    borderColor: inkAlpha(0.22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  markFill: {
    position: 'absolute',
    top: -1.5,
    left: -1.5,
    width: MARK,
    height: MARK,
    borderRadius: MARK / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: lowki.red.dark,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
});
