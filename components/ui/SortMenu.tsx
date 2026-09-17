/**
 * Composant SortMenu
 *
 * Un bouton texte discret « Trier par Lus récemment ⌄ » qui déroule un menu en
 * verre juste sous lui, à la manière des menus déroulants d'iOS :
 *
 *    Trier par Lus récemment ⌄
 *    ┌──────────────────────┐
 *    │ Lus récemment      ✓ │
 *    │ Plus anciens         │
 *    │ Titre                │
 *    └──────────────────────┘
 *
 * Le menu est posé en absolu sous le bouton, dans le sheet lui-même. Pas de
 * `Modal` : dans un sheet natif, les positions mesurées sont relatives au
 * sheet et non à l'écran, et le menu s'ouvrait ailleurs. Conséquence : le
 * parent doit faire passer ce composant AU-DESSUS de ce qui suit (dans une
 * FlatList, `ListHeaderComponentStyle={{ zIndex: 1 }}`).
 *
 * Un voile invisible, bien plus grand que le composant, attrape le toucher
 * à côté du menu et le referme.
 */

import { CheckIcon, ChevronDownIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe, useReducedMotion } from 'react-native-reanimated';
import { colors, fonts, inkAlpha, motion, spacing } from '../../utils/constants';
import GlassMaterial from './GlassMaterial';

interface SortMenuProps<K extends string> {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}

const MENU_WIDTH = 220;
const MENU_RADIUS = 20;
/** Espace entre le bouton et le haut du menu */
const MENU_GAP = 8;
/** Hauteur de la ligne du bouton (lineHeight du libellé) */
const BUTTON_H = 20;
/** Taille du voile qui referme le menu : déborde largement du sheet */
const SCRIM = 4000;

// Le menu se déplie depuis son coin haut gauche, là où est le bouton
const menuEntering = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.9 }] },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.bezier(...motion.easing.easeOutQuart),
  },
}).duration(motion.duration.standard);

export default function SortMenu<K extends string>({ options, value, onChange }: SortMenuProps<K>) {
  const reducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  const current = options.find((option) => option.key === value) ?? options[0];

  const close = () => setIsOpen(false);

  const choose = (key: K) => {
    close();
    if (key !== value) onChange(key);
  };

  return (
    <View style={styles.anchor}>
      {/* Toucher à côté du menu le referme */}
      {isOpen && (
        <Pressable style={styles.scrim} onPress={close} accessibilityLabel="Fermer le menu" />
      )}

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => setIsOpen((open) => !open)}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Trier par ${current.label}`}
        accessibilityHint="Ouvre les choix de tri"
        accessibilityState={{ expanded: isOpen }}
      >
        <Text style={styles.buttonLabel}>
          Trier par <Text style={styles.buttonValue}>{current.label}</Text>
        </Text>
        <ChevronDownIcon size={16} color={colors.textSecondary} strokeWidth={2.4} />
      </Pressable>

      {isOpen && (
        <Animated.View
          style={styles.menu}
          entering={reducedMotion ? undefined : menuEntering}
          accessibilityRole="menu"
        >
          <GlassMaterial radius={MENU_RADIUS} veil={0.97} edgeColor={inkAlpha(0.08)} />
          {options.map((option, index) => {
            const selected = option.key === value;
            return (
              <React.Fragment key={option.key}>
                {index > 0 && <View style={styles.separator} />}
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => choose(option.key)}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                >
                  <Text style={styles.rowLabel}>{option.label}</Text>
                  {selected && <CheckIcon size={18} color={colors.dark900} strokeWidth={2.6} />}
                </Pressable>
              </React.Fragment>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignSelf: 'flex-start',
  },
  scrim: {
    position: 'absolute',
    top: -SCRIM / 2,
    left: -SCRIM / 2,
    width: SCRIM,
    height: SCRIM,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
  },
  buttonPressed: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  buttonValue: {
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
  },

  menu: {
    position: 'absolute',
    top: BUTTON_H + MENU_GAP,
    left: 0,
    width: MENU_WIDTH,
    borderRadius: MENU_RADIUS,
    paddingVertical: spacing.xs,
    transformOrigin: 'top left',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.xs,
    borderRadius: MENU_RADIUS - spacing.xs,
  },
  rowPressed: {
    backgroundColor: inkAlpha(0.08),
  },
  rowLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
    backgroundColor: inkAlpha(0.12),
  },
});
