/**
 * Store des clubs (#238) : mes clubs, par id.
 *
 * Chargé avec mes lectures (app/_layout.tsx, retour au premier plan). Les
 * membres d'un club ne sont chargés qu'à l'ouverture de sa page.
 */

import { create } from 'zustand';
import { getMyClubs } from '../services/supabase/clubs';
import type { Club } from '../types/supabase';

interface ClubStore {
  clubs: Record<string, Club>;
  loadMyClubs: (userId: string) => Promise<void>;
  /** Après une création ou une modification */
  putClub: (club: Club) => void;
  /** Après un départ ou une suppression */
  dropClub: (clubId: string) => void;
  reset: () => void;
}

export const useClubStore = create<ClubStore>((set) => ({
  clubs: {},
  loadMyClubs: async (userId) => {
    try {
      const list = await getMyClubs(userId);
      set({ clubs: Object.fromEntries(list.map((c) => [c.id, c])) });
    } catch (error) {
      // Les clubs sont un plus : sans eux, l'app marche comme avant
      console.warn('[Clubs] chargement impossible', error);
    }
  },
  putClub: (club) => set((state) => ({ clubs: { ...state.clubs, [club.id]: club } })),
  dropClub: (clubId) =>
    set((state) => {
      const { [clubId]: _gone, ...rest } = state.clubs;
      return { clubs: rest };
    }),
  reset: () => set({ clubs: {} }),
}));
