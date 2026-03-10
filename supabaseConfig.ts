/**
 * Configuration Supabase pour Bestie Book Battle
 * 
 * Ce fichier initialise le client Supabase qui sera utilisé dans toute l'application.
 * Le client Supabase gère :
 * - L'authentification (Apple Sign In)
 * - La base de données PostgreSQL
 * - Le stockage de fichiers (photos de profil, couvertures de livres)
 * - Les subscriptions temps réel
 */

import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANT : Ces valeurs doivent être remplies avec tes credentials Supabase
// Tu les trouveras dans ton dashboard Supabase : Settings → API
//
// 1. SUPABASE_URL : l'URL de ton projet (ex: https://xxxxx.supabase.co)
// 2. SUPABASE_ANON_KEY : la clé publique "anon/public" (safe côté client)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

/**
 * Client Supabase configuré pour React Native avec Expo
 * 
 * Configuration :
 * - Auth : utilise AsyncStorage pour persister la session
 * - Auto refresh : renouvelle automatiquement les tokens
 * - Detect session in URL : gère les redirections OAuth
 * - Storage : utilise AsyncStorage au lieu de localStorage (mobile-friendly)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Utiliser AsyncStorage pour persister la session sur mobile
    storage: AsyncStorage,
    // Renouveler automatiquement les tokens d'authentification
    autoRefreshToken: true,
    // Détecter les sessions dans les URLs (pour les deep links)
    detectSessionInUrl: Platform.OS === 'web',
    // Persister la session entre les redémarrages de l'app
    persistSession: true,
  },
});

// Sur React Native, le timer d'auto-refresh des tokens s'arrête quand l'app
// passe en background. Sans ce listener, les tokens expirent et l'utilisateur
// est déconnecté au retour. C'est la recommandation officielle Supabase pour RN.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

/**
 * Helper pour vérifier si Supabase est correctement configuré
 * Utile pour afficher un message d'erreur clair si les credentials manquent
 */
export const isSupabaseConfigured = () => {
  return (
    SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
    SUPABASE_URL.length > 0 &&
    SUPABASE_ANON_KEY.length > 0
  );
};

/**
 * URLs des buckets Storage
 * Ces URLs sont utilisées pour afficher les images depuis Supabase Storage
 */
export const STORAGE_BUCKETS = {
  PROFILE_PHOTOS: 'profile-photos',
  BOOK_COVERS: 'book-covers',
};

/**
 * Helper pour obtenir l'URL publique d'une photo de profil
 * @param userId - L'ID de l'utilisateur
 * @param fileName - Le nom du fichier (ex: "avatar.jpg")
 * @returns L'URL publique de la photo
 */
export const getProfilePhotoUrl = (userId: string, fileName: string = 'avatar.jpg') => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
    .getPublicUrl(`${userId}/${fileName}`);
  return data.publicUrl;
};

/**
 * Helper pour obtenir l'URL publique d'une couverture de livre
 * @param challengeId - L'ID du challenge
 * @param fileName - Le nom du fichier (ex: "cover.jpg")
 * @returns L'URL publique de la couverture
 */
export const getBookCoverUrl = (challengeId: string, fileName: string = 'cover.jpg') => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.BOOK_COVERS)
    .getPublicUrl(`${challengeId}/${fileName}`);
  return data.publicUrl;
};

export default supabase;
