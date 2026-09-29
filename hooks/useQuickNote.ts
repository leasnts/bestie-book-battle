/**
 * useQuickNote — poser une note sur ma page enregistrée, sans passer par
 * l'éditeur : la barre d'actions rapides de « Ma page » (vocal, emoji, et
 * bientôt texte et citation écrits sur place).
 *
 * Mêmes règles que l'éditeur `note/[id]` : la note s'écrit dans les pages de MON
 * édition et voyage en position (0 → 1), visible par le club, catégorie par
 * défaut (les catégories seront revues, retour de Lea le 2026-09-29).
 */

import { useCallback, useMemo, useState } from 'react';
import { useAnnotationStore, type VoiceClip } from '../stores/annotationStore';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import { DEFAULT_CATEGORY, positionFromPage } from '../utils/annotations';

export interface QuickNote {
  body?: string | null;
  emoji?: string | null;
  quote?: string | null;
  voice?: VoiceClip | null;
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
    async ({ body = null, emoji = null, quote = null, voice = null }: QuickNote) => {
      if (!activeChallenge || !user?.id || myPages <= 0) return false;
      setPosting(true);
      try {
        await addNote(
          {
            challenge_id: activeChallenge.id,
            user_id: user.id,
            page,
            edition_total_pages: myPages,
            position: Number(positionFromPage(page, myPages).toFixed(5)),
            body: body?.trim() || null,
            emoji,
            quote: quote?.trim() || null,
            category: DEFAULT_CATEGORY,
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

  return { post, posting, page };
}
