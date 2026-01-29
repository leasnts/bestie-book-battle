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

import { create } from 'zustand';
import { User as SupabaseUser } from '../types/supabase';
import {
  signInWithApple,
  signOut,
  getCurrentUser,
  subscribeToAuthChanges,
  updateUserProfile,
} from '../services/supabase/auth';

/**
 * Interface du store d'authentification
 */
interface AuthStore {
  // État
  user: SupabaseUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: () => Promise<SupabaseUser>;
  logout: () => Promise<void>;
  setUser: (user: SupabaseUser | null) => void;
  setError: (error: string | null) => void;
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
export const useAuthStore = create<AuthStore>((set, get) => ({
  // ===== État initial =====
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  // ===== Action : Connexion =====
  /**
   * Connecter l'utilisateur avec Apple Sign In
   * 
   * Process :
   * 1. Demande les credentials Apple
   * 2. Authentifie avec Supabase
   * 3. Récupère ou crée le profil utilisateur
   * 4. Met à jour le store
   * 
   * @returns Le profil utilisateur complet
   * @throws Erreur si la connexion échoue
   */
  login: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithApple();
      set({ user, isLoading: false, isInitialized: true });
      return user;
    } catch (error: any) {
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
   * Supprime la session Supabase et nettoie le store.
   * L'utilisateur devra se reconnecter pour accéder à l'app.
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut();
      set({ user: null, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ error: error.message, isLoading: false });
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
    // Vérifier la session actuelle
    const checkSession = async () => {
      set({ isLoading: true });
      try {
        const user = await getCurrentUser();
        set({ user, isInitialized: true, isLoading: false });
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
}));
