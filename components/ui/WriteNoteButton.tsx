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
 */

import { PlusIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { useQuickNote } from '../../hooks/useQuickNote';
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
