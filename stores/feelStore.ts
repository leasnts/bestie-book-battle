/**
 * Store des réglages de l'appareil : sons et vibrations de l'app (#160).
 * (Le rappel, lui, est un réglage du compte, lu par le serveur : #178.)
 *
 * Tous activés par défaut. Gardés sur le téléphone (AsyncStorage) : ce sont
 * des préférences de l'appareil, pas du compte. Sons et vibrations sont lus par
 * `utils/feel.ts` au moment de jouer. Réglés dans le sheet Réglages (app/settings.tsx).
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
