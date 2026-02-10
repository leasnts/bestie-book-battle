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
 * Résultat de l'authentification Apple
 * 
 * Contient toutes les infos nécessaires pour savoir si c'est un
 * nouvel utilisateur ou un utilisateur existant, et pour créer
 * le profil plus tard (pendant l'onboarding) si besoin.
 * 
 * - isNewUser : true si aucun profil n'existe dans notre table users
 * - user : le profil complet si l'utilisateur existe, null sinon
 * - authId : l'ID Supabase Auth (toujours présent après authentification)
 * - appleUserId : l'ID Apple unique de l'utilisateur
 * - email : l'email (attention : Apple ne le donne qu'au PREMIER sign-in !)
 * - firstName / lastName : idem, uniquement au premier sign-in
 */
export interface AppleSignInResult {
  isNewUser: boolean;
  user: User | null;
  authId: string;
  appleUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Connecter un utilisateur avec Apple Sign In
 * 
 * Flow SÉPARÉ en 2 étapes (auth ≠ création de profil) :
 * 1. Obtenir le token d'identité d'Apple
 * 2. Authentifier avec Supabase (crée un user dans Supabase Auth, PAS dans notre table)
 * 3. Vérifier si un profil existe dans notre table users
 * 4. Retourner le résultat avec isNewUser pour que l'écran de login décide
 *    → utilisateur existant = redirection vers la home
 *    → nouvel utilisateur = redirection vers l'onboarding
 * 
 * @returns Un objet AppleSignInResult avec isNewUser et les données Apple
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  try {
    // Étape 1 : Demander les credentials Apple
    // Apple donne le email et fullName UNIQUEMENT au premier sign-in !
    // C'est pour ça qu'on les capture ici et on les passe à l'onboarding
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
    // Ceci crée un utilisateur dans Supabase Auth (table auth.users)
    // mais PAS dans notre table "users" personnalisée
    const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (authError || !authData.user) {
      throw authError || new Error('Échec de l\'authentification');
    }

    // Étape 3 : Vérifier si un profil existe dans notre table users
    // On utilise .maybeSingle() au lieu de .single() pour éviter l'erreur PGRST116
    // quand il n'y a aucun résultat (nouveau user)
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    // Si le profil existe, mettre à jour last_login_at
    if (existingProfile) {
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', authData.user.id)
        .select()
        .single();

      return {
        isNewUser: false,
        user: updatedUser || existingProfile,
        authId: authData.user.id,
        appleUserId: credential.user,
        email: authData.user.email || credential.email || '',
        firstName: credential.fullName?.givenName || null,
        lastName: credential.fullName?.familyName || null,
      };
    }

    // Nouveau user : pas de profil, on retourne les données pour l'onboarding
    return {
      isNewUser: true,
      user: null,
      authId: authData.user.id,
      appleUserId: credential.user,
      email: authData.user.email || credential.email || '',
      firstName: credential.fullName?.givenName || null,
      lastName: credential.fullName?.familyName || null,
    };
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
    // .maybeSingle() retourne null proprement si aucun résultat,
    // contrairement à .single() qui lève une erreur PGRST116
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.id)
      .maybeSingle();

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
    // On utilise .maybeSingle() au lieu de .single() pour éviter l'erreur PGRST116
    // .single() plante si 0 résultats, .maybeSingle() retourne null proprement
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      return null;
    }

    // Peut retourner null si l'user est authentifié mais n'a pas encore de profil
    // (cas d'un nouvel utilisateur qui n'a pas fini l'onboarding)
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
 * 
 * On utilise scope: 'local' pour React Native/Expo car le scope par défaut (global)
 * peut provoquer AuthSessionMissingError quand la session côté serveur est déjà invalide.
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
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
        // Récupérer le profil complet (peut être null si nouvel utilisateur)
        // On ne crée PAS automatiquement le profil ici
        // C'est l'onboarding qui s'en charge pour les nouveaux utilisateurs
        const userProfile = await getCurrentUser();
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
