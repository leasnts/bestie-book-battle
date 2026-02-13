/**
 * Store temporaire pour l'onboarding (flow "Créer un bbb")
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

interface OnboardingStore {
  /** URI locale de la cover importée (cover.tsx → complete.tsx) */
  coverUri: string | null;

  setCoverUri: (uri: string | null) => void;
  /** Réinitialiser après la création du projet (complete.tsx) */
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  coverUri: null,

  setCoverUri: (uri) => set({ coverUri: uri }),
  reset: () => set({ coverUri: null }),
}));
