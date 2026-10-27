/**
 * WriteNoteButton — le ✎ qui annote ma page : un rond en verre qui ouvre la
 * feuille d'écriture (`NoteComposer`), où tout se fait : écrire, dire (🎙),
 * citer (❝), choisir le thème et la page.
 *
 * Le bouton de l'en-tête du carnet ; sur l'accueil, la même feuille s'ouvre
 * par l'intercalaire ✎ du carré Carnet (`NoteTabs`). Un brouillon laissé met un
 * point rouge sur le crayon.
 *
 * `useWriteNote` : la même feuille, ouverte par autre chose qu'un rond (le
 * carré Carnet vide de l'accueil, qui invite à la première note).
 *
 * `useEditNote` : la même feuille encore, pour modifier une de mes notes
 * (toucher ma note dans le carnet). Un seul endroit où écrire une note.
 */

import { PlusIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useQuickNote } from '../../hooks/useQuickNote';
import { useAnnotationStore } from '../../stores/annotationStore';
import type { Annotation } from '../../types/supabase';
import { positionFromPage } from '../../utils/annotations';
import NoteComposer, { EMPTY_DRAFT, type ComposerDraft } from './NoteComposer';
import GlassButton from './GlassButton';

interface WriteNoteButtonProps {
  /** Juste avant d'ouvrir la feuille (fermer ce qui est ouvert à côté) */
  onOpen?: () => void;
}

/** La feuille d'écriture et son brouillon : `open()` l'ouvre, `sheet` est à rendre */
export function useWriteNote() {
  const { add, page, myPages } = useQuickNote();
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState<ComposerDraft>(EMPTY_DRAFT);

  const sheet = (
    <NoteComposer
      visible={writing}
      page={page}
      maxPage={myPages}
      draft={draft}
      onClose={(left) => {
        setDraft(left);
        setWriting(false);
      }}
      onPost={(note) => add(note)}
    />
  );
  return { open: () => setWriting(true), draft, page, sheet };
}

/** La feuille d'écriture, remplie avec une de mes notes : `edit(note)` l'ouvre, `sheet` est à rendre */
export function useEditNote() {
  const { page, myPages } = useQuickNote();
  const editNote = useAnnotationStore((s) => s.editNote);
  const removeNote = useAnnotationStore((s) => s.removeNote);
  const [note, setNote] = useState<Annotation | null>(null);

  const sheet = (
    <NoteComposer
      visible={!!note}
      page={page}
      maxPage={myPages}
      draft={EMPTY_DRAFT}
      note={note}
      onClose={() => setNote(null)}
      onPost={async (next) => {
        if (!note) return false;
        try {
          await editNote(
            note.id,
            {
              page: next.page,
              edition_total_pages: myPages,
              position: Number(positionFromPage(next.page, myPages).toFixed(5)),
              body: next.body || null,
              emoji: next.emoji,
              quote: next.quote,
              category: next.category,
            },
            // Le vocal : remplacé, supprimé, ou laissé tel quel
            next.voiceChanged ? next.voice : undefined,
          );
          return true;
        } catch (error) {
          console.error('[Carnet] modification impossible', error);
          Alert.alert('Erreur', "La note n'a pas pu être enregistrée. Réessaie.");
          return false;
        }
      }}
      onDelete={() =>
        new Promise<boolean>((resolve) => {
          if (!note) return resolve(false);
          Alert.alert('Supprimer la note', 'Elle disparaîtra pour tout le club.', [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: async () => {
                try {
                  await removeNote(note.id);
                  resolve(true);
                } catch (error) {
                  console.error('[Carnet] suppression impossible', error);
                  Alert.alert('Erreur', "La note n'a pas pu être supprimée. Réessaie.");
                  resolve(false);
                }
              },
            },
          ]);
        })
      }
    />
  );
  return { edit: (target: Annotation) => setNote(target), sheet };
}

export default function WriteNoteButton({ onOpen }: WriteNoteButtonProps) {
  const { open, draft, page, sheet } = useWriteNote();

  return (
    <>
      <GlassButton
        icon={PlusIcon}
        badge={!!(draft.body || draft.quote)}
        onPress={() => {
          onOpen?.();
          open();
        }}
        accessibilityLabel={
          draft.body ? `Reprendre ma note sur la page ${page} : ${draft.body}` : `Écrire une note sur la page ${page}`
        }
      />
      {sheet}
    </>
  );
}
