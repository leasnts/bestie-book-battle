/**
 * WriteNoteButton — le ✎ qui annote ma page : un rond chocolat qui ouvre la
 * feuille d'écriture (`NoteComposer`), où tout se fait : écrire, dire (🎙),
 * citer (❝), choisir le thème et la page.
 *
 * Le même bouton partout où on écrit une note : la barre de « Ma page » sur
 * l'accueil (`QuickNoteBar`) et l'en-tête du carnet. Un brouillon laissé met un
 * point lie de vin sur le crayon.
 *
 * `useWriteNote` : la même feuille, ouverte par autre chose qu'un rond (le
 * carré Carnet vide de l'accueil, qui invite à la première note).
 */

import { PenLineIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { useQuickNote } from '../../hooks/useQuickNote';
import NoteComposer, { EMPTY_DRAFT, type ComposerDraft } from './NoteComposer';
import RoundButton from './RoundButton';

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
      <RoundButton
        icon={PenLineIcon}
        variant="dark"
        badge={!!(draft.body || draft.quote)}
        onPress={() => {
          onOpen?.();
          open();
        }}
        label={
          draft.body ? `Reprendre ma note sur la page ${page} : ${draft.body}` : `Écrire une note sur la page ${page}`
        }
      />
      {sheet}
    </>
  );
}
