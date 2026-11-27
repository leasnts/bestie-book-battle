/**
 * useClubPal — la PAL d'un book club : ses livres, mes cœurs, et le livre que
 * je viens de proposer (#238, étape 2).
 *
 * Proposer passe par la recherche de livres (/book-search?for=club) : le livre
 * touché y est déposé dans le store de l'onboarding (`bookPick`), et l'écran qui
 * revient au premier plan (l'onglet, ou la feuille de la PAL) le propose.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getClubPal, proposeToClub, sortPal, votePal, type ClubPalBook } from '../services/supabase/clubPal';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { feel } from '../utils/feel';
import { oops } from '../utils/notice';

export function useClubPal(clubId: string | null) {
  const userId = useAuthStore((s) => s.user?.id);
  const [pal, setPal] = useState<ClubPalBook[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clubId) return;
    try {
      setPal(await getClubPal(clubId));
      setLoadedFor(clubId);
    } catch (error) {
      console.warn('[Clubs] PAL', error);
    }
  }, [clubId]);

  // Retour de la recherche : le livre choisi part dans la PAL
  useFocusEffect(
    useCallback(() => {
      const pick = useOnboardingStore.getState().bookPick;
      if (!clubId || !userId || pick?.target !== 'club') {
        load();
        return;
      }
      useOnboardingStore.getState().setBookPick(null);
      proposeToClub(clubId, userId, pick.book)
        .then(() => feel('poster'))
        .catch((error) => oops('Livre pas proposé', error))
        .finally(load);
    }, [clubId, userId, load]),
  );

  /** Mon cœur sur un livre : tout de suite à l'écran, puis en base */
  const toggleVote = async (book: ClubPalBook) => {
    if (!userId) return;
    const on = !book.votes.some((v) => v.user_id === userId);
    const swap = (votes: ClubPalBook['votes']) =>
      setPal((prev) => sortPal(prev.map((b) => (b.id === book.id ? { ...b, votes } : b))));
    if (on) feel('reagir');
    swap(on ? [...book.votes, { user_id: userId }] : book.votes.filter((v) => v.user_id !== userId));
    try {
      await votePal(book.id, userId, on);
    } catch (error) {
      swap(book.votes);
      oops('Cœur pas posé', error);
    }
  };

  return { pal: loadedFor === clubId ? pal : [], ready: loadedFor === clubId, load, toggleVote, myUserId: userId };
}
