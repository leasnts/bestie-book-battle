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
import { StyleSheet } from 'react-native';
import EmojiGrid from '../../components/ui/EmojiGrid';
import SheetPage from '../../components/ui/SheetPage';
import { useAnnotationStore } from '../../stores/annotationStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing } from '../../utils/constants';

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
      <EmojiGrid onPick={react} selected={mine} selectedHint="Retire ma réaction" />
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['4xl'],
  },
});
