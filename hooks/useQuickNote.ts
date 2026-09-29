/**
 * useQuickNote — poser une note sur ma page enregistrée, sans passer par
 * l'éditeur complet : la barre d'actions rapides de « Ma page » (✎ : texte, vocal,
 * citation ; ☺ : emoji). La page se change dans la feuille.
 *
 * Mêmes règles que l'éditeur `note/[id]` : la note s'écrit dans les pages de MON
 * édition et voyage en position (0 → 1), visible par le club. Sans catégorie
 * choisie (un vocal, un emoji), la catégorie par défaut.
 */

import { useCallback, useMemo, useState } from 'react';
import { useAnnotationStore, type VoiceClip } from '../stores/annotationStore';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import type { AnnotationCategory } from '../types/supabase';
import { DEFAULT_CATEGORY, positionFromPage } from '../utils/annotations';

export interface QuickNote {
  body?: string | null;
  emoji?: string | null;
  quote?: string | null;
  voice?: VoiceClip | null;
  category?: AnnotationCategory;
  /** Une autre page que ma page enregistrée (changée dans la feuille) */
  page?: number;
}

export function useQuickNote() {
  const user = useAuthStore((s) => s.user);
  const activeChallenge = useProjectStore((s) => s.activeChallenge);
  const participants = useProgressStore((s) => s.participants);
  const addNote = useAnnotationStore((s) => s.addNote);
  const [posting, setPosting] = useState(false);

  const mine = useMemo(
    () => participants.find((p) => p.user.id === user?.id),
    [participants, user?.id],
  );
  /** Ma page enregistrée : c'est elle que la note annote */
  const page = mine?.progress.current_page ?? 0;
  const myPages = mine?.progress.total_pages ?? activeChallenge?.total_pages ?? 0;

  const post = useCallback(
    async ({ body = null, emoji = null, quote = null, voice = null, category = DEFAULT_CATEGORY, page: at }: QuickNote) => {
      if (!activeChallenge || !user?.id || myPages <= 0) return false;
      const notePage = Math.min(myPages, Math.max(1, Math.round(at ?? page)));
      setPosting(true);
      try {
        await addNote(
          {
            challenge_id: activeChallenge.id,
            user_id: user.id,
            page: notePage,
            edition_total_pages: myPages,
            position: Number(positionFromPage(notePage, myPages).toFixed(5)),
            body: body?.trim() || null,
            emoji,
            quote: quote?.trim() || null,
            category,
            visibility: 'club',
          },
          voice,
        );
        return true;
      } finally {
        setPosting(false);
      }
    },
    [activeChallenge, user?.id, page, myPages, addNote],
  );

  return { post, posting, page, myPages };
}
