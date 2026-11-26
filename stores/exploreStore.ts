/**
 * Store de l'onglet Explorer
 *
 * - `favorites` : mes envies, les livres gardés pour plus tard. Elles sont sur
 *   le compte (table `wishes`, scripts/add-wishes.sql) : on change de
 *   téléphone, on se reconnecte, elles sont là. Le téléphone en garde une copie
 *   (AsyncStorage) pour les afficher tout de suite, sans loader ; le compte la
 *   remplace dès qu'il répond.
 * - `selectedBook` : le livre dont la fiche est ouverte (route /explore-book).
 *   Passé par le store plutôt que par l'URL : une URL de couverture est longue
 *   (cf. onboardingStore).
 *
 * Avant, les envies ne vivaient que sur le téléphone. Au premier chargement
 * après la mise à jour, celles du téléphone montent sur le compte (une seule
 * fois, `ownerId` encore vide) : personne ne perd les siennes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../supabaseConfig';
import type { BookSearchResult } from '../types/bookSearch';

interface ExploreStore {
  favorites: BookSearchResult[];
  /**
   * Le compte à qui appartient la copie du téléphone. `null` : des envies
   * d'avant la synchro, pas encore montées sur le compte.
   */
  ownerId: string | null;
  selectedBook: BookSearchResult | null;

  /** Charge mes envies depuis le compte (et y monte celles d'avant la synchro) */
  loadWishes: (userId: string) => Promise<void>;
  toggleFavorite: (book: BookSearchResult) => void;
  openBook: (book: BookSearchResult) => void;
  /** Déconnexion : la copie du téléphone part avec le compte */
  reset: () => void;
}

const currentUserId = async () => (await supabase.auth.getSession()).data.session?.user.id ?? null;

export const useExploreStore = create<ExploreStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      ownerId: null,
      selectedBook: null,

      loadWishes: async (userId) => {
        // La copie du téléphone d'abord : sans elle, les envies d'avant la synchro passeraient à la trappe
        if (!useExploreStore.persist.hasHydrated()) {
          await new Promise<void>((resolve) => {
            const unsub = useExploreStore.persist.onFinishHydration(() => {
              unsub();
              resolve();
            });
          });
        }
        const { favorites, ownerId } = get();
        // Une copie d'un autre compte (autre personne sur ce téléphone) : on l'oublie
        const local = ownerId === null || ownerId === userId ? favorites : [];

        // Première fois : les envies d'avant la synchro montent sur le compte.
        // Les plus récentes en premier dans la liste : on garde cet ordre en dates.
        if (ownerId === null && local.length > 0) {
          const now = Date.now();
          const { error } = await supabase.from('wishes').upsert(
            local.map((book, i) => ({
              user_id: userId,
              book_id: book.id,
              book,
              created_at: new Date(now - i * 1000).toISOString(),
            })),
            { onConflict: 'user_id,book_id', ignoreDuplicates: true },
          );
          // Échec (réseau) : on réessaiera au prochain chargement, rien n'est perdu
          if (error) return;
        }

        const { data, error } = await supabase
          .from('wishes')
          .select('book')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) return; // on garde la copie du téléphone
        set({ favorites: (data ?? []).map((row) => row.book as BookSearchResult), ownerId: userId });
      },

      // Optimiste : l'écran change tout de suite, le compte suit
      toggleFavorite: (book) => {
        const had = get().favorites.some((f) => f.id === book.id);
        set((state) => ({
          favorites: had ? state.favorites.filter((f) => f.id !== book.id) : [book, ...state.favorites],
        }));
        void (async () => {
          const userId = await currentUserId();
          if (!userId) return;
          const { error } = had
            ? await supabase.from('wishes').delete().eq('user_id', userId).eq('book_id', book.id)
            : await supabase
                .from('wishes')
                .upsert({ user_id: userId, book_id: book.id, book }, { onConflict: 'user_id,book_id' });
          // Le compte a refusé : on remet l'écran comme le compte
          if (error) {
            set((state) => ({
              favorites: had
                ? state.favorites.some((f) => f.id === book.id)
                  ? state.favorites
                  : [book, ...state.favorites]
                : state.favorites.filter((f) => f.id !== book.id),
            }));
          }
        })();
      },
      openBook: (book) => set({ selectedBook: book }),
      reset: () => set({ favorites: [], ownerId: null, selectedBook: null }),
    }),
    {
      name: 'bbb-explore',
      storage: createJSONStorage(() => AsyncStorage),
      // Seules les envies (et à qui elles sont) survivent à un redémarrage
      partialize: (state) => ({ favorites: state.favorites, ownerId: state.ownerId }),
    },
  ),
);
