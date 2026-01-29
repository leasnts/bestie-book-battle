/**
 * Store pour gérer les modes de démo
 * Permet de switcher entre différents états pour tester l'app
 */

import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Import conditionnel d'AsyncStorage (seulement sur mobile)
let AsyncStorage: any;
if (Platform.OS !== 'web') {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

export type DemoMode = 'full' | 'with_friend' | 'solo' | 'empty';

interface DemoStore {
  mode: DemoMode;
  setMode: (mode: DemoMode) => void;
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set) => ({
      mode: 'solo', // Par défaut : mode solo pour tester l'onboarding
      
      setMode: (mode: DemoMode) => {
        set({ mode });
      },
    }),
    {
      name: 'demo-mode-storage',
      storage: Platform.OS === 'web' 
        ? createJSONStorage(() => localStorage) // Sur web: utiliser localStorage
        : createJSONStorage(() => AsyncStorage), // Sur mobile: utiliser AsyncStorage
    }
  )
);

// Données de démo selon le mode
export const getDemoData = (mode: DemoMode) => {
  const baseUser = {
    id: 'demo_user_lea',
    name: 'Léa',
    email: 'lea@demo.com',
    profilePhotoUrl: 'lea', // Référence à l'image
    createdAt: new Date(),
  };

  const friendUser = {
    id: 'demo_user_zoe',
    name: 'Zoé',
    email: 'zoe@demo.com',
    profilePhotoUrl: 'zoe', // Référence à l'image
    createdAt: new Date(),
  };

  switch (mode) {
    case 'with_friend':
      // Léa + Zoé lisent ensemble
      return {
        hasProject: true,
        project: {
          id: 'demo_project_1',
          bookTitle: 'Une vie comme les autres',
          bookAuthor: 'Hanya Yanagihara',
          totalPages: 1024,
          coverUri: 'cover', // Référence à l'image
          invitationCode: 'ABC123',
          createdAt: new Date().toISOString(),
        },
        participants: [
          {
            user: baseUser,
            progress: {
              currentPage: 115,
              lastUpdated: new Date(),
              streak: 6,
            },
            isLeader: false,
          },
          {
            user: friendUser,
            progress: {
              currentPage: 143,
              lastUpdated: new Date(),
              streak: 9,
            },
            isLeader: true,
          },
        ],
      };

    case 'solo':
      // Léa seule avec son projet
      return {
        hasProject: true,
        project: {
          id: 'demo_project_2',
          bookTitle: 'Une vie comme les autres',
          bookAuthor: 'Hanya Yanagihara',
          totalPages: 1024,
          coverUri: 'cover', // Référence à l'image
          invitationCode: 'XYZ789',
          createdAt: new Date().toISOString(),
        },
        participants: [
          {
            user: baseUser,
            progress: {
              currentPage: 65,
              lastUpdated: new Date(),
              streak: 3,
            },
            isLeader: true,
          },
        ],
      };

    case 'empty':
      // Léa sans projet
      return {
        hasProject: false,
        project: null,
        participants: [],
      };

    default:
      return {
        hasProject: false,
        project: null,
        participants: [],
      };
  }
};
