/**
 * Store des réglages sensoriels : sons et vibrations de l'app (#160).
 *
 * Tous deux activés par défaut. Gardés sur le téléphone (AsyncStorage) : c'est
 * une préférence de l'appareil, pas du compte. Lus par `utils/feel.ts` au
 * moment de jouer, réglés dans le profil.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FeelStore {
  sounds: boolean;
  haptics: boolean;
  setSounds: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
}

export const useFeelStore = create<FeelStore>()(
  persist(
    (set) => ({
      sounds: true,
      haptics: true,
      setSounds: (sounds) => set({ sounds }),
      setHaptics: (haptics) => set({ haptics }),
    }),
    {
      name: 'bbb-feel',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
