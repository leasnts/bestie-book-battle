import { create } from 'zustand';

/**
 * Le relais entre le splash et l'écran de connexion (voir AnimatedSplash,
 * `handoff`) : l'écran de connexion se monte sous le splash, le signale, et
 * n'anime son arrivée qu'une fois le splash parti.
 */
interface SplashStore {
  /** L'écran de connexion est monté (sous le splash, s'il est encore là). */
  loginMounted: boolean;
  /** Le splash est terminé : plus rien ne recouvre l'app. */
  splashGone: boolean;
  setLoginMounted: (mounted: boolean) => void;
  setSplashGone: () => void;
}

export const useSplashStore = create<SplashStore>((set) => ({
  loginMounted: false,
  splashGone: false,
  setLoginMounted: (mounted) => set({ loginMounted: mounted }),
  setSplashGone: () => set({ splashGone: true }),
}));
