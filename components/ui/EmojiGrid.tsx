/**
 * EmojiGrid — le sélecteur complet d'emojis, par familles, la liste à la mode
 * en tête (`EMOJI_SECTIONS`).
 *
 * Un seul sélecteur pour toute l'app : réagir à une note (/reactions) et
 * annoter la page d'un emoji (/emoji-note). Les emojis déjà choisis sont
 * entourés : on voit tout de suite ce qu'un nouveau toucher retirera.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, fonts, spacing } from '../../utils/constants';
import { EMOJI_SECTIONS } from '../../utils/emojis';
import PressableScale from './PressableScale';

interface EmojiGridProps {
  onPick: (emoji: string) => void;
  /** Les emojis déjà choisis, entourés */
  selected?: Set<string>;
  /** Ce que VoiceOver annonce pour un emoji déjà choisi */
  selectedHint?: string;
}

export default function EmojiGrid({ onPick, selected, selectedHint }: EmojiGridProps) {
  return (
    <>
      {EMOJI_SECTIONS.map((section) => (
        <View key={section.title}>
          <Text style={styles.title}>{section.title}</Text>
          <View style={styles.grid}>
            {section.emojis.map((emoji) => {
              const on = selected?.has(emoji) ?? false;
              return (
                <PressableScale
                  key={`${section.title}-${emoji}`}
                  style={[styles.cell, on && styles.cellOn]}
                  pressedScale={0.88}
                  onPress={() => onPick(emoji)}
                  accessibilityRole="button"
                  accessibilityLabel={emoji}
                  accessibilityState={{ selected: on }}
                  accessibilityHint={on ? selectedHint : undefined}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      ))}
    </>
  );
}

const CELL = 46;

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellOn: {
    borderColor: colors.accent,
    backgroundColor: colors.bgLight,
  },
  emoji: {
    fontSize: 28,
  },
});
