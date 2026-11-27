/**
 * useClubFeed — le fil d'un club (#246) et les réactions qu'on y pose.
 *
 * Partagé par l'onglet Clubs (les 4 dernières actus) et la feuille « Tout
 * voir » (/club-feed). Une réaction s'affiche tout de suite, puis part en base ;
 * si la base refuse, elle revient en arrière.
 */

import { useCallback, useState } from 'react';
import {
  addReaction,
  getAnnotationsByIds,
  removeReaction,
  type AnnotationWithAuthor,
} from '../services/supabase/annotations';
import { addFeedReaction, getClubFeed, removeFeedReaction } from '../services/supabase/clubs';
import { useAuthStore } from '../stores/authStore';
import type { ClubFeedItem } from '../types/supabase';
import { oops } from '../utils/notice';

/** Ajouter ou retirer ma réaction dans une liste */
function toggleIn<T extends { user_id: string; emoji: string }>(list: T[], me: string, emoji: string, make: () => T) {
  const mine = list.some((r) => r.user_id === me && r.emoji === emoji);
  return { mine, next: mine ? list.filter((r) => !(r.user_id === me && r.emoji === emoji)) : [...list, make()] };
}

export function useClubFeed(clubId: string | null) {
  const userId = useAuthStore((s) => s.user?.id);
  const [feed, setFeed] = useState<ClubFeedItem[]>([]);
  const [notes, setNotes] = useState<Record<string, AnnotationWithAuthor>>({});
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clubId) return;
    try {
      const items = await getClubFeed(clubId);
      const open = items.filter((i) => i.kind === 'note' && !i.locked && i.annotation_id).map((i) => i.annotation_id!);
      const list = await getAnnotationsByIds(open);
      setFeed(items);
      setNotes(Object.fromEntries(list.map((n) => [n.id, n])));
      setLoadedFor(clubId);
    } catch (error) {
      console.warn('[Clubs] fil', error);
    }
  }, [clubId]);

  const toggleNoteReaction = async (note: AnnotationWithAuthor, emoji: string) => {
    if (!userId) return;
    const { mine, next } = toggleIn(note.reactions, userId, emoji, () => ({
      annotation_id: note.id,
      user_id: userId,
      emoji,
      created_at: new Date().toISOString(),
    }));
    setNotes((prev) => ({ ...prev, [note.id]: { ...note, reactions: next } }));
    try {
      if (mine) await removeReaction(note.id, userId, emoji);
      else await addReaction(note.id, userId, emoji);
    } catch (error) {
      setNotes((prev) => ({ ...prev, [note.id]: note }));
      oops('Réaction pas posée', error);
    }
  };

  const toggleReaction = async (item: ClubFeedItem, emoji: string) => {
    if (!userId || !clubId) return;
    const { mine, next } = toggleIn(item.reactions ?? [], userId, emoji, () => ({
      user_id: userId,
      emoji,
      created_at: new Date().toISOString(),
    }));
    const swap = (reactions: ClubFeedItem['reactions']) =>
      setFeed((prev) => prev.map((i) => (i.event_key === item.event_key ? { ...i, reactions } : i)));
    swap(next);
    try {
      if (mine) await removeFeedReaction(clubId, item.event_key, userId, emoji);
      else await addFeedReaction(clubId, item.event_key, userId, emoji);
    } catch (error) {
      swap(item.reactions);
      oops('Réaction pas posée', error);
    }
  };

  return {
    /** Vide tant que le fil de CE club n'est pas arrivé (pas celui d'un autre) */
    feed: loadedFor === clubId ? feed : [],
    notes,
    ready: loadedFor === clubId,
    load,
    myUserId: userId,
    toggleNoteReaction,
    toggleReaction,
  };
}
