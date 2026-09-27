const DEFAULT_PROFILE_IMAGE = require('../assets/images/profile_picture_default.png');

/**
 * La photo de profil, avec cache-busting (?v=timestamp) : force expo-image à
 * recharger après un changement de photo. Sans photo : l'image par défaut.
 */
export function resolvePhotoSource(url?: string | null, updatedAt?: string | null) {
  if (!url) return DEFAULT_PROFILE_IMAGE;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const sep = url.includes('?') ? '&' : '?';
    const v = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return { uri: `${url}${sep}v=${v}` };
  }
  return DEFAULT_PROFILE_IMAGE;
}
