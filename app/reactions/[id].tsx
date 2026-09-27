/**
 * Route /reactions/[id] — le sélecteur complet des réactions d'une note.
 *
 * Sheet iOS natif, ouvert par « … » sous une note quand les six emojis rapides
 * ne suffisent pas. Un toucher réagit (ou retire ma réaction) et ferme.
 *
 * Mes réactions déjà posées sont entourées : on voit tout de suite ce qu'un
 * nouveau toucher retirera. Mise en page : `SheetPage`, commune à tous les sheets.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from '../../components/ui/PressableScale';
import SheetPage from '../../components/ui/SheetPage';
import { useAnnotationStore } from '../../stores/annotationStore';
import { useAuthStore } from '../../stores/authStore';
import { borderRadius, colors, fonts, spacing } from '../../utils/constants';
import { EMOJI_SECTIONS } from '../../utils/emojis';

export default function ReactionsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const note = useAnnotationStore((s) => s.notes.find((n) => n.id === id));
  const toggleReaction = useAnnotationStore((s) => s.toggleReaction);
  const markRead = useAnnotationStore((s) => s.markRead);

  const mine = new Set(
    (note?.reactions ?? []).filter((r) => r.user_id === user?.id).map((r) => r.emoji),
  );

  const react = useCallback(
    (emoji: string) => {
      if (!note || !user?.id) return;
      toggleReaction(note.id, user.id, emoji);
      if (note.user_id !== user.id) markRead(note.id, user.id);
      router.back();
    },
    [note, user?.id, toggleReaction, markRead, router],
  );

  return (
    <SheetPage title="Réagir" fit={false} contentContainerStyle={styles.content}>
      {EMOJI_SECTIONS.map((section) => (
        <View key={section.title}>
          <Text style={styles.title}>{section.title}</Text>
          <View style={styles.grid}>
            {section.emojis.map((emoji) => {
              const selected = mine.has(emoji);
              return (
                <PressableScale
                  key={emoji}
                  style={[styles.cell, selected && styles.cellOn]}
                  pressedScale={0.88}
                  onPress={() => react(emoji)}
                  accessibilityRole="button"
                  accessibilityLabel={emoji}
                  accessibilityState={{ selected }}
                  accessibilityHint={selected ? 'Retire ma réaction' : undefined}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      ))}
    </SheetPage>
  );
}

const CELL = 46;

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['4xl'],
  },
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
