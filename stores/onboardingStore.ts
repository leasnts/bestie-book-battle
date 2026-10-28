/**
 * Le brouillon de l'onboarding : ce que la personne a répondu, écran après
 * écran, jusqu'à la préparation (prepa.tsx) qui enregistre tout.
 *
 * Deux temps :
 * - toi, en général (moments, formats habituels) → le profil ;
 * - ce livre-là (livre, format, position, rythme) → sa lecture.
 *
 * Seul `introSeen` est gardé d'un lancement à l'autre : l'ouverture ne se
 * montre qu'une fois. Le reste vit le temps du parcours.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BookSearchResult } from '../types/bookSearch';
import type { BookFormat, ReadingMoment } from '../types/supabase';
import type { OnboardingFlow } from '../utils/onboardingFlow';

/** L'écran qui attend un livre de la recherche */
export type BookPickTarget = 'livre' | 'edition';

/** Le livre choisi (recherche ou à la main), dans SON édition */
export interface BookDraft {
  title: string;
  author: string;
  /** Pages de l'édition papier */
  pages: number;
  /** URL trouvée par la recherche, ou photo locale (file://…) */
  cover: string | null;
  publisher: string | null;
}

/** La lecture rejointe par un lien ou un code */
export interface InvitationDraft {
  challengeId: string;
  code: string;
  title: string;
  author: string;
  pages: number;
  cover: string | null;
  adminFirstName: string;
  /** Où en est le groupe, en % */
  groupPercent: number;
}

interface OnboardingStore {
  /** L'ouverture a été vue : on n'y revient plus */
  introSeen: boolean;
  /** Le parcours en cours (voir utils/onboardingFlow) */
  flow: OnboardingFlow;

  // Toi, en général
  moments: ReadingMoment[];
  usualFormats: BookFormat[];

  // Ce livre-là
  book: BookDraft | null;
  invitation: InvitationDraft | null;
  /** null = pas encore choisi : prérempli d'après les formats habituels */
  format: BookFormat | null;
  /** Ma position de départ : en pages (papier) ou en % (liseuse, audio) */
  start: number;
  /** Mon rythme visé, dans la même unité ; null = libre */
  perDay: number | null;
  /** La lecture créée à l'écran « Avec qui ? » (parcours créer) */
  createdChallengeId: string | null;
  /** Le lien d'invitation a été envoyé */
  invited: boolean;

  /**
   * Le livre choisi dans le sheet de recherche (/book-search), repris par
   * l'écran qui l'attend : « Quel livre ? » ou l'édition de « Tu en es où ? »
   * (les deux sont montés dans la pile, chacun ne prend que le sien).
   */
  bookPick: { book: BookSearchResult; target: BookPickTarget } | null;

  setIntroSeen: () => void;
  /** Commence un parcours, brouillon vierge */
  begin: (flow: OnboardingFlow) => void;
  patch: (values: Partial<Omit<OnboardingStore, 'introSeen' | 'setIntroSeen' | 'begin' | 'patch' | 'setBookPick' | 'reset'>>) => void;
  setBookPick: (pick: { book: BookSearchResult; target: BookPickTarget } | null) => void;
  /** Vide le brouillon (après la carte de lecture, ou à l'abandon) */
  reset: () => void;
}

const EMPTY = {
  moments: [] as ReadingMoment[],
  usualFormats: ['papier'] as BookFormat[],
  book: null,
  invitation: null,
  format: null,
  start: 0,
  perDay: 20,
  createdChallengeId: null,
  invited: false,
  bookPick: null,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      introSeen: false,
      flow: 'create',
      ...EMPTY,

      setIntroSeen: () => set({ introSeen: true }),
      begin: (flow) => set({ ...EMPTY, flow }),
      patch: (values) => set(values),
      setBookPick: (pick) => set({ bookPick: pick }),
      reset: () => set({ ...EMPTY, flow: 'create' }),
    }),
    {
      name: 'onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ introSeen: state.introSeen }),
    },
  ),
);

/** Le format de ce livre : choisi, sinon déduit des habitudes (papier d'abord) */
export function bookFormat(state: Pick<OnboardingStore, 'format' | 'usualFormats'>): BookFormat {
  if (state.format) return state.format;
  const usual = state.usualFormats;
  return usual.length === 0 || usual.includes('papier') ? 'papier' : usual[0];
}
