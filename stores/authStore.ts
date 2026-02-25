/**
 * Store Zustand pour l'authentification avec Supabase
 * 
 * Fonctionnalités :
 * - Apple Sign In via Supabase Auth
 * - Gestion de session automatique
 * - Persistence via AsyncStorage/localStorage
 * - Synchronisation temps réel de l'état d'authentification
 * 
 * Ce store est la source de vérité pour l'état d'authentification dans toute l'app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User as SupabaseUser } from '../types/supabase';
import {
  signInWithApple,
  signOut,
  getCurrentUser,
  subscribeToAuthChanges,
  updateUserProfile,
  deleteUserAccount,
  AppleSignInResult,
} from '../services/supabase/auth';
import { useProjectStore } from './projectStore';
import { useProgressStore } from './progressStore';

/**
 * Données du nouvel utilisateur en attente d'onboarding
 * 
 * Ces données sont stockées temporairement dans le store après le sign-in Apple.
 * Elles seront utilisées par l'écran d'onboarding pour créer le profil.
 * 
 * Pourquoi stocker ça ? Parce qu'Apple ne donne le email et le nom
 * qu'au TOUT PREMIER sign-in. Si on ne les capture pas maintenant,
 * on les perd pour toujours !
 */
interface PendingUserData {
  authId: string;
  appleUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Interface du store d'authentification
 */
interface AuthStore {
  // État
  user: SupabaseUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  pendingUserData: PendingUserData | null;

  // Actions
  login: () => Promise<AppleSignInResult>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setUser: (user: SupabaseUser | null) => void;
  setError: (error: string | null) => void;
  setPendingUserData: (data: PendingUserData | null) => void;
  updateProfile: (updates: Partial<SupabaseUser>) => Promise<SupabaseUser>;
  initialize: () => () => void;
}

/**
 * Store d'authentification Supabase
 * 
 * Ce store gère tout l'état d'authentification de l'application :
 * - Connexion avec Apple Sign In
 * - Déconnexion
 * - Récupération de la session
 * - Mise à jour du profil
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
  // ===== État initial =====
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,
  pendingUserData: null,

  // ===== Action : Connexion =====
  /**
   * Connecter l'utilisateur avec Apple Sign In
   * 
   * Nouveau flow :
   * 1. Demande les credentials Apple
   * 2. Authentifie avec Supabase
   * 3. Vérifie si un profil existe dans notre table users
   * 4. Retourne le résultat avec isNewUser
   * 
   * Si isNewUser = true :
   *   → On stocke les données dans pendingUserData
   *   → L'écran de login redirige vers l'onboarding
   * 
   * Si isNewUser = false :
   *   → On met à jour le store avec le profil existant
   *   → L'écran de login redirige vers la home
   * 
   * @returns AppleSignInResult avec isNewUser et les données
   * @throws Erreur si la connexion échoue
   */
  login: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await signInWithApple();

      if (result.isNewUser) {
        // Nouveau user : stocker les données Apple pour l'onboarding
        // On ne crée PAS de profil maintenant, l'onboarding s'en charge
        set({
          user: null,
          pendingUserData: {
            authId: result.authId,
            appleUserId: result.appleUserId,
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
          },
          isLoading: false,
          isInitialized: true,
        });
      } else {
        // User existant : mettre à jour le store avec le profil
        set({ user: result.user, isLoading: false, isInitialized: true });
      }

      return result;
    } catch (error: any) {
      // ERR_CANCELED = l'utilisateur a annulé la modale Apple
      // On remet juste isLoading à false, pas d'état d'erreur dans le store
      if (error.code === 'ERR_CANCELED') {
        set({ isLoading: false });
        throw error;
      }
      console.error('Login error:', error);
      const errorMessage = error.message || 'Erreur lors de la connexion';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // ===== Action : Déconnexion =====
  /**
   * Déconnecter l'utilisateur
   *
   * Supabase signOut() peut rester bloqué indéfiniment sur React Native (problème connu).
   * On utilise un timeout de 3s : si signOut ne répond pas, on déconnecte quand même
   * côté UI pour ne pas laisser l'utilisateur en chargement infini.
   */
  logout: async () => {
    set({ isLoading: true });
    const clearStateAndStores = () => {
      useProjectStore.getState().reset();
      useProgressStore.getState().clearProgress();
      set({ user: null, pendingUserData: null, isLoading: false, error: null });
    };

    try {
      // Timeout 3s : signOut peut hang sur RN, on ne bloque pas l'UX
      const timeoutMs = 3000;
      await Promise.race([
        signOut(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutMs)
        ),
      ]);
      clearStateAndStores();
    } catch (error: any) {
      if (error?.message === 'timeout') {
        // Timeout = signOut a hang, on déconnecte quand même côté UI
        clearStateAndStores();
      } else {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    }
  },

  // ===== Action : Suppression du compte =====
  deleteAccount: async () => {
    const { user } = get();
    if (!user) throw new Error('Aucun utilisateur connecté');
    set({ isLoading: true });
    try {
      await deleteUserAccount(user.id);
      useProjectStore.getState().reset();
      useProgressStore.getState().clearProgress();
      set({ user: null, pendingUserData: null, isLoading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ===== Action : Définir l'utilisateur =====
  /**
   * Définir manuellement l'utilisateur
   * 
   * Utilisé par le listener d'authentification pour mettre à jour
   * le store quand la session change.
   * 
   * @param user - L'utilisateur à définir, ou null si déconnecté
   */
  setUser: (user: SupabaseUser | null) => {
    set({ user, isInitialized: true, isLoading: false });
  },

  // ===== Action : Définir une erreur =====
  /**
   * Définir une erreur d'authentification
   * 
   * @param error - Le message d'erreur, ou null pour effacer
   */
  setError: (error: string | null) => {
    set({ error });
  },

  // ===== Action : Stocker les données en attente d'onboarding =====
  /**
   * Sauvegarder ou effacer les données du nouvel utilisateur
   * 
   * Utilisé par l'onboarding une fois le profil créé :
   * setPendingUserData(null) pour nettoyer
   * 
   * @param data - Les données Apple, ou null pour effacer
   */
  setPendingUserData: (data: PendingUserData | null) => {
    set({ pendingUserData: data });
  },

  // ===== Action : Mettre à jour le profil =====
  /**
   * Mettre à jour le profil utilisateur
   * 
   * Permet de modifier :
   * - Le nom et prénom
   * - La photo de profil
   * - Les préférences de notification
   * 
   * @param updates - Les champs à mettre à jour
   * @returns Le profil mis à jour
   */
  updateProfile: async (updates: Partial<SupabaseUser>) => {
    const { user } = get();
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }

    set({ isLoading: true });
    try {
      const updatedUser = await updateUserProfile(user.id, updates);
      set({ user: updatedUser, isLoading: false });
      return updatedUser;
    } catch (error: any) {
      console.error('Update profile error:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ===== Action : Initialiser =====
  /**
   * Initialiser le store d'authentification
   * 
   * Cette fonction doit être appelée au démarrage de l'application.
   * 
   * Elle :
   * 1. Vérifie s'il existe une session Supabase active
   * 2. Récupère le profil utilisateur si connecté
   * 3. S'abonne aux changements d'authentification en temps réel
   * 
   * @returns Une fonction pour se désabonner des changements d'auth
   */
  initialize: () => {
    const checkSession = async () => {
      set({ isLoading: true });
      try {
        const user = await getCurrentUser();

        set({ user, isInitialized: true, isLoading: false });

        if (user?.id) {
          useProjectStore.getState().loadUserChallenges(user.id);
        }
      } catch (error) {
        console.error('Session check error:', error);
        set({ user: null, isInitialized: true, isLoading: false });
      }
    };

    // Lancer la vérification
    checkSession();

    // S'abonner aux changements d'authentification
    const unsubscribe = subscribeToAuthChanges((user) => {
      set({ user, isInitialized: true, isLoading: false });
    });

    // Retourner la fonction de nettoyage
    return unsubscribe;
  },
    }),
    {
      name: 'bbb-auth-pending',
      storage: createJSONStorage(() => AsyncStorage),
      // On ne persiste QUE pendingUserData — les autres états sont éphémères
      // (user est géré par Supabase, isLoading/error ne doivent pas survivre au redémarrage)
      partialize: (state) => ({ pendingUserData: state.pendingUserData }),
    }
  )
);
