/**
 * Store Zustand de la vue du carnet : comment les notes sont triées et filtrées.
 *
 * Partagé entre le carnet et ses deux sheets (`/carnet-sort`, `/carnet-filter`) :
 * on choisit dans le sheet, le carnet suit aussitôt. Les choix s'affichent en
 * badges ✕ sous « Trier » et « Filtrer ».
 *
 * Le filtre se combine : plusieurs personnes OU entre elles, plusieurs thèmes OU
 * entre eux, et les deux ensemble (ex. Emma ou Lucas, en Snif). Vide = tout.
 * Le carnet repart de zéro à chaque ouverture (`reset`).
 */

import { create } from 'zustand';
import type { AnnotationWithAuthor } from '../services/supabase/annotations';
import type { AnnotationCategory } from '../types/supabase';

/** Par date d'écriture (plus récentes / plus anciennes d'abord) ou par page (premières / dernières) */
export type CarnetSort = 'newest' | 'oldest' | 'pageAsc' | 'pageDesc';

interface CarnetViewStore {
  sort: CarnetSort;
  /** Les personnes gardées (mon id compris pour « Moi ») */
  people: string[];
  categories: AnnotationCategory[];
  setSort: (sort: CarnetSort) => void;
  togglePerson: (userId: string) => void;
  toggleCategory: (category: AnnotationCategory) => void;
  /** Retire tous les filtres, garde le tri */
  clearFilters: () => void;
  reset: () => void;
}

/**
 * Par défaut, de ma page vers la page 1 : les notes les plus proches de là où
 * j'en suis d'abord (Lea, 2026-10-02) ; les nouvelles se sont lues dans la pile.
 */
export const DEFAULT_CARNET_SORT: CarnetSort = 'pageDesc';

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export const useCarnetViewStore = create<CarnetViewStore>((set) => ({
  sort: DEFAULT_CARNET_SORT,
  people: [],
  categories: [],
  setSort: (sort) => set({ sort }),
  togglePerson: (userId) => set((s) => ({ people: toggle(s.people, userId) })),
  toggleCategory: (category) => set((s) => ({ categories: toggle(s.categories, category) })),
  clearFilters: () => set({ people: [], categories: [] }),
  reset: () => set({ sort: DEFAULT_CARNET_SORT, people: [], categories: [] }),
}));

/** Les notes qui passent le filtre */
export function filterNotes(
  notes: AnnotationWithAuthor[],
  people: string[],
  categories: AnnotationCategory[],
) {
  return notes.filter(
    (note) =>
      (people.length === 0 || people.includes(note.user_id)) &&
      (categories.length === 0 || categories.includes(note.category)),
  );
}
