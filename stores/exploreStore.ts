/**
 * Store de l'onglet Explorer
 *
 * - `favorites` : mes envies, les livres gardés pour plus tard. Persistées sur
 *   le téléphone (AsyncStorage) ; pas encore partagées avec le club.
 * - `selectedBook` : le livre dont la fiche est ouverte (route /explore-book).
 *   Passé par le store plutôt que par l'URL : une URL de couverture est longue
 *   (cf. onboardingStore).
 * - `pendingQuery` : une recherche demandée depuis la fiche (toucher l'autrice),
 *   que l'onglet lance en revenant au premier plan.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BookSearchResult } from '../types/bookSearch';

interface ExploreStore {
  favorites: BookSearchResult[];
  selectedBook: BookSearchResult | null;
  pendingQuery: string | null;

  toggleFavorite: (book: BookSearchResult) => void;
  openBook: (book: BookSearchResult) => void;
  searchFor: (query: string) => void;
  clearPendingQuery: () => void;
}

export const useExploreStore = create<ExploreStore>()(
  persist(
    (set) => ({
      favorites: [],
      selectedBook: null,
      pendingQuery: null,

      toggleFavorite: (book) =>
        set((state) => ({
          favorites: state.favorites.some((f) => f.id === book.id)
            ? state.favorites.filter((f) => f.id !== book.id)
            : [book, ...state.favorites],
        })),
      openBook: (book) => set({ selectedBook: book }),
      searchFor: (query) => set({ pendingQuery: query }),
      clearPendingQuery: () => set({ pendingQuery: null }),
    }),
    {
      name: 'bbb-explore',
      storage: createJSONStorage(() => AsyncStorage),
      // Seules les envies survivent à un redémarrage
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);
