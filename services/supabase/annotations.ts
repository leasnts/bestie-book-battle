/**
 * Service du carnet : les notes, leurs réactions, et ce qui reste verrouillé.
 *
 * L'anti-spoil n'est pas ici : il est en base (RLS). Ce service ne filtre rien —
 * une note posée plus loin que ma progression n'arrive tout simplement pas.
 * Voir `scripts/add-annotations.sql`.
 */

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

/**
 * Le bucket des vocaux est PRIVÉ : on ne peut pas en donner l'URL publique.
 * Une URL signée vaut une heure, ce qui suffit largement à écouter une note.
 */
export async function getAudioUrl(audioPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('annotation-audio')
    .createSignedUrl(audioPath, 3600);
  if (error) {
    console.warn('[Carnet] vocal illisible', error);
    return null;
  }
  return data?.signedUrl ?? null;
}
