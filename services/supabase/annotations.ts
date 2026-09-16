/**
 * Service du carnet : les notes, leurs réactions, et ce qui reste verrouillé.
 *
 * L'anti-spoil n'est pas ici : il est en base (RLS). Ce service ne filtre rien —
 * une note posée plus loin que ma progression n'arrive tout simplement pas.
 * Voir `scripts/add-annotations.sql`.
 */

import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../supabaseConfig';
import type {
  Annotation,
  AnnotationInsert,
  AnnotationReaction,
  AnnotationUpdate,
} from '../../types/supabase';

/** Une note, avec de quoi afficher son autrice et ses réactions */
export interface AnnotationWithAuthor extends Annotation {
  author: {
    id: string;
    first_name: string | null;
    profile_photo_url: string | null;
    updated_at: string | null;
  };
  reactions: AnnotationReaction[];
}

/** Une note encore verrouillée : qui l'a écrite et où, jamais son contenu */
export interface AnnotationAhead {
  id: string;
  user_id: string;
  first_name: string | null;
  profile_photo_url: string | null;
  book_position: number;
  /** La page correspondante dans MON édition */
  my_page: number;
}

const WITH_AUTHOR = `
  *,
  author:users!annotations_user_id_fkey (id, first_name, profile_photo_url, updated_at),
  reactions:annotation_reactions (annotation_id, user_id, emoji, created_at)
`;

/** Les notes que j'ai le droit de lire, dans l'ordre du livre */
export async function getAnnotations(challengeId: string): Promise<AnnotationWithAuthor[]> {
  const { data, error } = await supabase
    .from('annotations')
    .select(WITH_AUTHOR)
    .eq('challenge_id', challengeId)
    .order('position', { ascending: true });

  if (error) throw error;
  return (data as unknown as AnnotationWithAuthor[]) ?? [];
}

/**
 * Ce qui m'attend plus loin : « Inès · ≈ p. 230 », « 3 plus loin ».
 * Passe par une RPC qui ne renvoie ni texte, ni emoji, ni catégorie — la
 * couleur d'un post-it en dirait déjà trop.
 */
export async function getAnnotationsAhead(challengeId: string): Promise<AnnotationAhead[]> {
  const { data, error } = await supabase.rpc('annotations_ahead', {
    p_challenge_id: challengeId,
  });

  if (error) throw error;
  return (data as AnnotationAhead[]) ?? [];
}

export async function createAnnotation(note: AnnotationInsert): Promise<Annotation> {
  const { data, error } = await supabase.from('annotations').insert(note).select().single();
  if (error) throw error;
  return data;
}

export async function updateAnnotation(id: string, patch: AnnotationUpdate): Promise<Annotation> {
  const { data, error } = await supabase
    .from('annotations')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAnnotation(id: string): Promise<void> {
  const { error } = await supabase.from('annotations').delete().eq('id', id);
  if (error) throw error;
}

// ─── Réactions ──────────────────────────────────────────────────────

export async function addReaction(
  annotationId: string,
  userId: string,
  emoji: string,
): Promise<void> {
  const { error } = await supabase
    .from('annotation_reactions')
    .insert({ annotation_id: annotationId, user_id: userId, emoji });
  if (error) throw error;
}

export async function removeReaction(
  annotationId: string,
  userId: string,
  emoji: string,
): Promise<void> {
  const { error } = await supabase
    .from('annotation_reactions')
    .delete()
    .eq('annotation_id', annotationId)
    .eq('user_id', userId)
    .eq('emoji', emoji);
  if (error) throw error;
}

// ─── Notes lues ─────────────────────────────────────────────────────

/** Marque une note comme lue (post-it révélés sur l'accueil, « notes à lire ») */
export async function markAnnotationRead(annotationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('annotation_reads')
    .upsert({ annotation_id: annotationId, user_id: userId }, { onConflict: 'annotation_id,user_id' });
  if (error) throw error;
}

/** Les notes que j'ai déjà ouvertes */
export async function getReadAnnotationIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('annotation_reads')
    .select('annotation_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.annotation_id);
}

// ─── Vocaux ─────────────────────────────────────────────────────────

const AUDIO_BUCKET = 'annotation-audio';

/**
 * Où ranger le vocal d'une note : `{challenge_id}/{annotation_id}-{horodatage}.m4a`.
 *
 * L'horodatage donne un nouveau nom à chaque vocal refait : le bucket n'autorise
 * pas le remplacement d'un fichier, seulement l'ajout et la suppression.
 */
export function voicePath(challengeId: string, annotationId: string): string {
  return `${challengeId}/${annotationId}-${Date.now()}.m4a`;
}

/** Envoie un vocal enregistré sur le téléphone (AAC mono, .m4a) */
export async function uploadVoice(localUri: string, path: string): Promise<void> {
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' as any });
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, decode(base64), { contentType: 'audio/mp4' });
  if (error) throw error;
}

/** Supprime un vocal. Sans conséquence s'il n'existe plus. */
export async function deleteVoice(path: string): Promise<void> {
  const { error } = await supabase.storage.from(AUDIO_BUCKET).remove([path]);
  if (error) console.warn('[Carnet] vocal non supprimé', error);
}

/** URL signée par chemin, gardée un peu moins longtemps qu'elle ne vaut */
const signedUrls = new Map<string, { url: string; expiresAt: number }>();
const SIGNED_URL_SECONDS = 3600;

/**
 * Le bucket des vocaux est PRIVÉ : on ne peut pas en donner l'URL publique.
 * Une URL signée vaut une heure, ce qui suffit largement à écouter une note ;
 * elle n'est demandée qu'au premier ▶, pas pour chaque note de la liste.
 */
export async function getAudioUrl(audioPath: string): Promise<string | null> {
  const cached = signedUrls.get(audioPath);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(audioPath, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) {
    console.warn('[Carnet] vocal illisible', error);
    return null;
  }
  signedUrls.set(audioPath, {
    url: data.signedUrl,
    expiresAt: Date.now() + (SIGNED_URL_SECONDS - 300) * 1000,
  });
  return data.signedUrl;
}
