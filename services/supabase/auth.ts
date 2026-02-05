/**
 * Service d'authentification Supabase
 * 
 * Gère toutes les opérations d'authentification :
 * - Apple Sign In
 * - Gestion de session
 * - Création/mise à jour du profil utilisateur
 * - Déconnexion
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../supabaseConfig';
import { User, UserInsert, UserUpdate } from '../../types/supabase';

/**
 * Interface pour les données renvoyées par Apple Sign In
 */
interface AppleAuthResponse {
  identityToken: string;
  email?: string | null;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
  user: string; // Apple User ID
}

/**
 * Connecter un utilisateur avec Apple Sign In
 * 
 * Flow :
 * 1. Obtenir le token d'identité d'Apple
 * 2. Authentifier avec Supabase en utilisant ce token
 * 3. Créer ou mettre à jour le profil utilisateur dans la table users
 * 4. Retourner l'utilisateur authentifié
 * 
 * @returns L'utilisateur authentifié avec son profil complet
 */
export async function signInWithApple(): Promise<User> {
  try {
    // Étape 1 : Demander les credentials Apple
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Aucun token d\'identité reçu d\'Apple');
    }

    // Étape 2 : Authentifier avec Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (authError || !authData.user) {
      throw authError || new Error('Échec de l\'authentification');
    }

    // Étape 3 : Créer ou mettre à jour le profil utilisateur
    const userProfile = await createOrUpdateUserProfile({
      id: authData.user.id,
      apple_user_id: credential.user,
      email: authData.user.email || credential.email || '',
      first_name: credential.fullName?.givenName || 'Utilisateur',
      last_name: credential.fullName?.familyName || null,
    });

    return userProfile;
  } catch (error: any) {
    console.error('Erreur lors du sign in avec Apple:', error);
    throw error;
  }
}

/**
 * Créer ou mettre à jour le profil utilisateur dans la table users
 * 
 * Cette fonction est appelée après l'authentification pour s'assurer que
 * le profil existe dans notre base de données.
 * 
 * Si l'utilisateur existe déjà :
 * - Met à jour last_login_at
 * - Conserve les autres données
 * 
 * Si l'utilisateur n'existe pas :
 * - Crée un nouveau profil avec les données fournies
 * 
 * @param userData - Les données de l'utilisateur à créer ou mettre à jour
 * @returns Le profil utilisateur complet
 */
export async function createOrUpdateUserProfile(
  userData: Partial<UserInsert> & { id: string }
): Promise<User> {
  try {
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.id)
      .single();

    const now = new Date().toISOString();

    if (existingUser) {
      // L'utilisateur existe : mettre à jour last_login_at
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          last_login_at: now,
          // Mettre à jour l'email s'il a changé
          email: userData.email || existingUser.email,
        })
        .eq('id', userData.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedUser;
    } else {
      // L'utilisateur n'existe pas : le créer
      const newUser: UserInsert = {
        id: userData.id,
        apple_user_id: userData.apple_user_id,
        email: userData.email!,
        first_name: userData.first_name!,
        last_name: userData.last_name,
        last_login_at: now,
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (createError) throw createError;
      return createdUser;
    }
  } catch (error: any) {
    console.error('Erreur lors de la création/mise à jour du profil:', error);
    throw error;
  }
}

/**
 * Obtenir l'utilisateur actuellement connecté
 * 
 * Récupère à la fois :
 * - L'utilisateur Supabase Auth (session)
 * - Le profil complet depuis la table users
 * 
 * @returns L'utilisateur avec son profil complet, ou null si non connecté
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Obtenir la session Supabase Auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return null;
    }

    // Récupérer le profil complet depuis la table users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      return null;
    }

    return userProfile;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

/**
 * Mettre à jour le profil utilisateur
 * 
 * Permet de modifier les informations du profil :
 * - Nom et prénom
 * - Photo de profil
 * - Token de notification
 * - Préférences de notification
 * 
 * @param userId - L'ID de l'utilisateur
 * @param updates - Les champs à mettre à jour
 * @returns Le profil mis à jour
 */
export async function updateUserProfile(
  userId: string,
  updates: UserUpdate
): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
}

/**
 * Déconnecter l'utilisateur
 * 
 * Supprime la session Supabase et nettoie le stockage local.
 * L'utilisateur devra se reconnecter pour accéder à l'application.
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    console.error('Erreur lors de la déconnexion:', error);
    throw error;
  }
}

/**
 * Écouter les changements d'état d'authentification
 * 
 * Permet de réagir en temps réel aux événements :
 * - SIGNED_IN : l'utilisateur vient de se connecter
 * - SIGNED_OUT : l'utilisateur vient de se déconnecter
 * - TOKEN_REFRESHED : le token a été renouvelé
 * - USER_UPDATED : le profil a été mis à jour
 * 
 * @param callback - Fonction appelée à chaque changement d'état
 * @returns Une fonction pour annuler l'écoute
 */
export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth state changed:', event);

      if (session?.user) {
        // Récupérer le profil complet
        let userProfile = await getCurrentUser();
        
        // Si le profil n'existe pas (premier login par email), le créer
        if (!userProfile && session.user.email) {
          console.log('Création du profil utilisateur pour', session.user.email);
          userProfile = await createOrUpdateUserProfile({
            id: session.user.id,
            email: session.user.email,
            first_name: session.user.email.split('@')[0], // Utiliser la partie avant @ comme prénom temporaire
          });
        }
        
        callback(userProfile);
      } else {
        callback(null);
      }
    }
  );

  // Retourner une fonction pour se désabonner
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Vérifier si Apple Sign In est disponible sur cet appareil
 * 
 * Apple Sign In nécessite :
 * - iOS 13+ ou macOS 10.15+
 * - Un appareil physique (pas de simulateur pour la production)
 * 
 * @returns true si Apple Sign In est disponible
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Connecter un utilisateur avec Email (Magic Link)
 * 
 * Flow :
 * 1. Supabase envoie un email avec un lien magique
 * 2. L'utilisateur clique sur le lien dans l'email
 * 3. Il est automatiquement connecté
 * 
 * Cette méthode ne crée pas de mot de passe, juste un lien temporaire sécurisé.
 * 
 * @param email - L'adresse email de l'utilisateur
 * @returns Success si l'email a été envoyé
 */
/**
 * S'inscrire avec email et mot de passe
 * 
 * @param email - L'adresse email
 * @param password - Le mot de passe (min 6 caractères)
 * @returns L'utilisateur créé avec son profil
 */
export async function signUpWithPassword(email: string, password: string): Promise<User> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw authError || new Error('Échec de l\'inscription');
    }

    // Créer le profil utilisateur
    const userProfile = await createOrUpdateUserProfile({
      id: authData.user.id,
      email: authData.user.email!,
      first_name: authData.user.email!.split('@')[0],
    });

    return userProfile;
  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', error);
    throw error;
  }
}

/**
 * Se connecter avec email et mot de passe
 * 
 * @param email - L'adresse email
 * @param password - Le mot de passe
 * @returns L'utilisateur connecté avec son profil
 */
export async function signInWithPassword(email: string, password: string): Promise<User> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw authError || new Error('Email ou mot de passe incorrect');
    }

    // Récupérer ou créer le profil utilisateur
    const userProfile = await createOrUpdateUserProfile({
      id: authData.user.id,
      email: authData.user.email!,
      first_name: authData.user.email!.split('@')[0],
    });

    return userProfile;
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error);
    throw error;
  }
}

/**
 * Créer un profil utilisateur depuis un email
 * 
 * Cette fonction est appelée après qu'un utilisateur se connecte via email
 * pour créer son profil dans la table users.
 * 
 * @param userId - L'ID de l'utilisateur Supabase Auth
 * @param email - L'email de l'utilisateur
 * @param firstName - Le prénom (optionnel)
 * @returns Le profil utilisateur créé
 */
export async function createEmailUserProfile(
  userId: string,
  email: string,
  firstName?: string
): Promise<User> {
  return createOrUpdateUserProfile({
    id: userId,
    email,
    first_name: firstName || 'Utilisateur',
  });
}

/**
 * Envoyer un code OTP par email
 * 
 * Flow :
 * 1. L'utilisateur entre son email
 * 2. Supabase envoie un code à 8 chiffres par email (configuré dans Supabase)
 * 3. L'utilisateur entre le code dans l'app pour se connecter
 * 
 * Cette méthode est compatible avec Expo Go car elle ne nécessite pas de deep link.
 * Le code est valide pendant 1 heure (3600 secondes, configuré dans Supabase).
 * 
 * @param email - L'adresse email de l'utilisateur
 * @throws Error si l'envoi échoue
 */
export async function sendOTP(email: string): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Crée automatiquement l'utilisateur s'il n'existe pas
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('Erreur lors de l\'envoi du code OTP:', error);
      throw error;
    }

    console.log('Code OTP envoyé à', email);
  } catch (error: any) {
    console.error('Erreur sendOTP:', error);
    throw error;
  }
}

/**
 * Vérifier le code OTP et connecter l'utilisateur
 * 
 * Flow :
 * 1. L'utilisateur entre le code reçu par email
 * 2. Supabase vérifie le code
 * 3. Si valide, l'utilisateur est connecté et son profil est créé/mis à jour
 * 
 * @param email - L'adresse email de l'utilisateur
 * @param token - Le code à 8 chiffres reçu par email
 * @returns L'utilisateur connecté avec son profil complet
 * @throws Error si le code est invalide ou expiré
 */
export async function verifyOTP(email: string, token: string): Promise<User> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email', // Type 'email' pour les codes OTP envoyés par email
    });

    if (error) {
      console.error('Erreur lors de la vérification du code OTP:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('Aucun utilisateur retourné après vérification');
    }

    // Créer ou mettre à jour le profil utilisateur
    const userProfile = await createOrUpdateUserProfile({
      id: data.user.id,
      email: data.user.email!,
      first_name: data.user.email!.split('@')[0], // Utilise la partie avant @ comme prénom temporaire
    });

    console.log('Utilisateur connecté avec succès:', userProfile.email);
    return userProfile;
  } catch (error: any) {
    console.error('Erreur verifyOTP:', error);
    throw error;
  }
}

