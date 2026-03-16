/**
 * Service de stockage Supabase
 * 
 * Gère l'upload et la suppression de fichiers dans Supabase Storage :
 * - Photos de profil des utilisateurs
 * - Couvertures de livres pour les challenges
 */

import { supabase, STORAGE_BUCKETS, getProfilePhotoUrl, getBookCoverUrl } from '../../supabaseConfig';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

/**
 * Interface pour le résultat d'upload
 */
interface UploadResult {
  url: string;
  path: string;
}

/**
 * Obtenir les permissions pour accéder à la galerie photos
 * 
 * Cette fonction doit être appelée avant d'utiliser ImagePicker.
 * Elle demande à l'utilisateur l'autorisation d'accéder à ses photos.
 * 
 * @returns true si la permission est accordée, false sinon
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Sélectionner une image depuis la galerie
 * 
 * Ouvre le sélecteur de photos et permet à l'utilisateur de choisir une image.
 * L'image est automatiquement redimensionnée pour optimiser la taille du fichier.
 * 
 * @param allowsEditing - Permettre de recadrer/éditer l'image
 * @param aspect - Ratio de l'image [largeur, hauteur], ex: [1, 1] pour un carré
 * @param quality - Qualité de compression (0 à 1)
 * @returns L'URI de l'image sélectionnée, ou null si annulé
 */
export async function pickImage(
  allowsEditing: boolean = true,
  aspect: [number, number] = [1, 1],
  quality: number = 0.8
): Promise<string | null> {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    
    if (!hasPermission) {
      throw new Error('Permission d\'accès à la galerie refusée');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing,
      aspect,
      quality,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error: any) {
    console.error('Erreur lors de la sélection de l\'image:', error);
    throw error;
  }
}

/**
 * Upload une photo de profil pour un utilisateur
 * 
 * Process :
 * 1. Supprime les anciennes photos (avatar.jpg, avatar.png, etc.) pour éviter les orphelins
 * 2. Lit le fichier depuis l'URI
 * 3. Upload vers Supabase Storage dans le bucket profile-photos
 * 4. Le fichier est stocké sous : {userId}/avatar.{ext}
 * 5. Retourne l'URL publique + paramètre de cache busting (?v=timestamp)
 * 
 * Le paramètre ?v=timestamp force le rechargement de l'image car expo-image
 * et les CDN cachent par URL. Sans cela, l'ancienne photo resterait affichée.
 * 
 * @param userId - L'ID de l'utilisateur
 * @param imageUri - L'URI locale de l'image (depuis ImagePicker)
 * @returns L'URL publique de la photo uploadée (avec cache busting)
 */
export async function uploadProfilePhoto(
  userId: string,
  imageUri: string
): Promise<UploadResult> {
  try {
    // Redimensionner l'image à 400px max (suffisant pour un avatar, même en 3x retina)
    // Réduit drastiquement la taille du fichier et donc le temps d'upload + d'encodage base64
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 400 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    const optimizedUri = manipulated.uri;

    // Lancer suppression des anciennes photos EN PARALLÈLE avec l'encodage + upload
    // Au lieu d'attendre la suppression avant de commencer l'upload
    const deletePromise = deleteProfilePhoto(userId).catch(() => {
      // Ignorer si aucun fichier n'existe (normal pour premier upload)
    });

    // Lire le fichier optimisé en base64
    const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
      encoding: 'base64' as any,
    });

    // Toujours JPEG après manipulation
    const mimeType = 'image/jpeg';
    const fileName = 'avatar.jpg';
    const filePath = `${userId}/${fileName}`;

    // Convertir la chaîne base64 en ArrayBuffer (format binaire)
    const arrayBuffer = decode(base64);

    // Attendre la fin de la suppression avant l'upload pour éviter les conflits
    await deletePromise;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Obtenir l'URL publique avec cache busting (?v=timestamp)
    const baseUrl = getProfilePhotoUrl(userId, fileName);
    const separator = baseUrl.includes('?') ? '&' : '?';
    const url = `${baseUrl}${separator}v=${Date.now()}`;

    return {
      url,
      path: filePath,
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'upload de la photo de profil:', error);
    throw error;
  }
}

/**
 * Supprimer la photo de profil d'un utilisateur
 * 
 * Supprime le fichier du bucket profile-photos.
 * 
 * @param userId - L'ID de l'utilisateur
 */
export async function deleteProfilePhoto(userId: string): Promise<void> {
  try {
    // Lister tous les fichiers du dossier utilisateur
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
      .list(userId);

    if (listError) throw listError;

    if (files && files.length > 0) {
      // Supprimer tous les fichiers trouvés
      const filePaths = files.map((file) => `${userId}/${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
        .remove(filePaths);

      if (deleteError) throw deleteError;
    }
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la photo de profil:', error);
    throw error;
  }
}

/**
 * Upload une couverture de livre pour un challenge
 * 
 * Process :
 * 1. Lit le fichier depuis l'URI
 * 2. Upload vers Supabase Storage dans le bucket book-covers
 * 3. Le fichier est stocké sous : {challengeId}/cover.jpg
 * 4. Retourne l'URL publique de l'image
 * 
 * Note : Si une couverture existe déjà, elle sera écrasée
 * 
 * @param challengeId - L'ID du challenge
 * @param imageUri - L'URI locale de l'image (depuis ImagePicker)
 * @returns L'URL publique de la couverture uploadée
 */
export async function uploadBookCover(
  challengeId: string,
  imageUri: string
): Promise<UploadResult> {
  try {
    // Lire le fichier en base64 depuis son URI locale
    // C'est la méthode la plus fiable en React Native pour lire un fichier image
    // On utilise 'base64' en string au lieu de FileSystem.EncodingType.Base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64' as any,
    });

    // Toujours uploader en JPEG : c'est 3-5x plus léger que PNG
    // et la qualité est largement suffisante pour une couverture de livre
    const mimeType = 'image/jpeg';
    const fileName = 'cover.jpg';
    const filePath = `${challengeId}/${fileName}`;

    // Convertir la chaîne base64 en ArrayBuffer
    // C'est le format binaire que Supabase Storage attend
    const arrayBuffer = decode(base64);

    // Upload vers Supabase Storage dans le bucket "book-covers"
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.BOOK_COVERS)
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true, // Écraser si le fichier existe déjà
      });

    if (uploadError) {
      console.error('[Cover Upload] Erreur Supabase Storage:', uploadError);
      throw uploadError;
    }

    // Ajoute un timestamp pour invalider le cache expo-image :
    // l'URL est toujours cover.jpg (même chemin Supabase, upsert)
    // donc sans le ?t=... le composant Image afficherait l'ancienne version mise en cache.
    const publicUrl = getBookCoverUrl(challengeId, fileName) + `?t=${Date.now()}`;

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error: any) {
    console.error('[Cover Upload] Échec complet:', error);
    throw error;
  }
}

/**
 * Supprimer la couverture d'un challenge
 * 
 * Supprime le fichier du bucket book-covers.
 * 
 * @param challengeId - L'ID du challenge
 */
export async function deleteBookCover(challengeId: string): Promise<void> {
  try {
    // Lister tous les fichiers du dossier challenge
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKETS.BOOK_COVERS)
      .list(challengeId);

    if (listError) throw listError;

    if (files && files.length > 0) {
      // Supprimer tous les fichiers trouvés
      const filePaths = files.map((file) => `${challengeId}/${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKETS.BOOK_COVERS)
        .remove(filePaths);

      if (deleteError) throw deleteError;
    }
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la couverture:', error);
    throw error;
  }
}

/**
 * Helper pour vérifier si une URL d'image est valide et accessible
 * 
 * @param url - L'URL de l'image à vérifier
 * @returns true si l'image est accessible, false sinon
 */
export async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
