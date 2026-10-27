/**
 * Store des réglages de l'appareil : sons et vibrations de l'app (#160), et le
 * rappel du soir.
 *
 * Tous activés par défaut. Gardés sur le téléphone (AsyncStorage) : ce sont
 * des préférences de l'appareil, pas du compte. Sons et vibrations sont lus par
 * `utils/feel.ts` au moment de jouer ; le rappel du soir par app/_layout.tsx
 * avant de le planifier. Réglés dans le sheet Réglages (app/settings.tsx).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FeelStore {
  sounds: boolean;
  haptics: boolean;
  /** Le rappel de 20 h (notification locale, cf. services/notifications.ts) */
  eveningReminder: boolean;
  setSounds: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
  setEveningReminder: (on: boolean) => void;
}

export const useFeelStore = create<FeelStore>()(
  persist(
    (set) => ({
      sounds: true,
      haptics: true,
      eveningReminder: true,
      setSounds: (sounds) => set({ sounds }),
      setHaptics: (haptics) => set({ haptics }),
      setEveningReminder: (eveningReminder) => set({ eveningReminder }),
    }),
    {
      name: 'bbb-feel',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
