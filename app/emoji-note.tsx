/**
 * Route /emoji-note — annoter ma page d'un emoji, parmi tous.
 *
 * Ouvert par « + » au bout de la rangée d'emojis de la barre de Ma page, quand
 * la liste à la mode ne suffit pas. Même sélecteur que les réactions
 * (`EmojiGrid`) ; un toucher ajoute la note au carnet de notes et ferme.
 */

import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import EmojiGrid from '../components/ui/EmojiGrid';
import SheetPage from '../components/ui/SheetPage';
import { useQuickNote } from '../hooks/useQuickNote';
import { spacing } from '../utils/constants';
import { oops } from '../utils/notice';

export default function EmojiNoteRoute() {
  const router = useRouter();
  const { post, posting, page } = useQuickNote();

  const pick = useCallback(
    async (emoji: string) => {
      if (posting) return;
      try {
        await post({ emoji });
        router.back();
      } catch (error) {
        console.error('[Carnet] note emoji impossible', error);
        oops('Note pas postée', error, { hint: 'Retouche ton emoji dans un instant' });
      }
    },
    [post, posting, router],
  );

  return (
    <SheetPage title={`Annoter la page ${page}`} fit={false} contentContainerStyle={styles.content}>
      <EmojiGrid onPick={pick} />
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['4xl'],
  },
});
