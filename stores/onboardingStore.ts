/**
 * Store temporaire pour l'onboarding (flows "Créer un bbb" et "Rejoindre")
 *
 * Pourquoi ce store ?
 * Le coverUri (chemin fichier local, ex: file:///var/mobile/.../ImagePicker/xxx.jpg)
 * peut faire 100+ caractères. En le passant via les params de route (Expo Router),
 * on risque une troncature ou une perte de données (limites des URLs).
 *
 * Solution : on stocke le coverUri ici pendant le flow, et on le lit dans complete.tsx.
 * Le store est réinitialisé après la création du projet.
 */

import { create } from 'zustand';

export interface MyEditionDraft {
  /** Photo locale (file://…) ou URL trouvée par la recherche */
  cover: string | null;
  totalPages: number;
  publisher: string | null;
}

interface OnboardingStore {
  /** URI locale de la cover importée (cover.tsx → complete.tsx) */
  coverUri: string | null;
  /** Nombre de pages récupéré via l'API Google Books (create.tsx → pages.tsx) */
  apiPageCount: number | null;
  /** URL de la cover récupérée via l'API Google Books (create.tsx → cover.tsx) */
  apiCoverUrl: string | null;
  /** Rejoindre : mon édition, choisie sur edition.tsx, enregistrée par welcome.tsx */
  myEdition: MyEditionDraft | null;

  setCoverUri: (uri: string | null) => void;
  setApiPageCount: (count: number | null) => void;
  setApiCoverUrl: (url: string | null) => void;
  setMyEdition: (edition: MyEditionDraft | null) => void;
  /** Réinitialiser après la création du projet (complete.tsx) */
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  coverUri: null,
  apiPageCount: null,
  apiCoverUrl: null,
  myEdition: null,

  setCoverUri: (uri) => set({ coverUri: uri }),
  setApiPageCount: (count) => set({ apiPageCount: count }),
  setApiCoverUrl: (url) => set({ apiCoverUrl: url }),
  setMyEdition: (edition) => set({ myEdition: edition }),
  reset: () => set({ coverUri: null, apiPageCount: null, apiCoverUrl: null, myEdition: null }),
}));
