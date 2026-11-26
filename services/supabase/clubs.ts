/**
 * Clubs de lecture (#238) : un groupe qui dure, lecture après lecture.
 *
 * Tables `clubs` et `club_members`, `challenges.club_id` (scripts/add-clubs.sql).
 * Un groupe devient un club par la fonction `create_club_from_challenge` (seul
 * l'admin de la lecture) ; rejoindre une lecture d'un club fait entrer dans le
 * club (trigger). La photo vit dans le bucket public `club-photos/<club>/`.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../supabaseConfig';
import type { Challenge, Club, ClubMember, ClubPreview } from '../../types/supabase';

const BUCKET = 'club-photos';

/** Le nom d'un club tient en 20 caractères (contrainte de la base) */
export const CLUB_NAME_MAX = 20;

/** Mes clubs (ceux où je suis membre, pas les demandes en attente) */
export async function getMyClubs(userId: string): Promise<Club[]> {
  const { data, error } = await supabase
    .from('club_members')
    .select('clubs(*)')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (error) throw error;
  return (data ?? []).map((row: any) => row.clubs).filter(Boolean);
}

/** Les membres d'un club, l'admin d'abord puis par arrivée */
export async function getClubMembers(clubId: string): Promise<ClubMember[]> {
  const { data, error } = await supabase
    .from('club_members')
    .select('club_id, user_id, role, status, joined_at, user:users(id, first_name, profile_photo_url)')
    .eq('club_id', clubId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  const members = (data ?? []) as unknown as ClubMember[];
  return [...members].sort((a, b) => (a.role === b.role ? 0 : a.role === 'admin' ? -1 : 1));
}

/** Faire un club d'un groupe de lecture ; la photo, si choisie, est envoyée ensuite */
export async function createClubFromChallenge(
  challengeId: string,
  name: string,
  photoUri?: string | null,
): Promise<Club> {
  const { data, error } = await supabase.rpc('create_club_from_challenge', {
    p_challenge_id: challengeId,
    p_name: name.trim(),
  });
  if (error) throw error;
  const club = data as Club;
  if (!photoUri) return club;
  return updateClub(club.id, { photo_url: await uploadClubPhoto(club.id, photoUri) });
}

/** Modifier le nom ou la photo (admins) */
export async function updateClub(
  clubId: string,
  updates: Partial<Pick<Club, 'name' | 'photo_url' | 'join_mode'>>,
): Promise<Club> {
  const { data, error } = await supabase
    .from('clubs')
    .update(updates)
    .eq('id', clubId)
    .select()
    .single();
  if (error) throw error;
  return data as Club;
}

/** La photo du club, carrée et légère ; retourne son URL publique (avec cache busting) */
export async function uploadClubPhoto(clubId: string, imageUri: string): Promise<string> {
  const small = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 400 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  const base64 = await FileSystem.readAsStringAsync(small.uri, { encoding: 'base64' as any });
  const path = `${clubId}/photo.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Retirer quelqu'un du club (admins), ou partir soi-même */
export async function removeClubMember(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Créer un club de zéro, sans lecture ; la photo, si choisie, est envoyée ensuite */
export async function createClub(name: string, photoUri?: string | null): Promise<Club> {
  const { data, error } = await supabase.rpc('create_club', { p_name: name.trim() });
  if (error) throw error;
  const club = data as Club;
  if (!photoUri) return club;
  return updateClub(club.id, { photo_url: await uploadClubPhoto(club.id, photoUri) });
}

/** Les lectures d'un club, la plus récente d'abord (même celles que je ne lis pas) */
export async function getClubChallenges(clubId: string): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Challenge[];
}

/** L'aperçu d'un club par son code ; null si le code n'existe pas */
export async function getClubPreview(code: string): Promise<ClubPreview | null> {
  const { data, error } = await supabase.rpc('get_club_preview', { p_code: code });
  if (error) throw error;
  return ((data ?? [])[0] as ClubPreview) ?? null;
}

/** Rejoindre par le code : 'active' (je suis membre) ou 'pending' (en attente de l'admin) */
export async function joinClub(code: string): Promise<'active' | 'pending'> {
  const { data, error } = await supabase.rpc('join_club', { p_code: code });
  if (error) throw error;
  return data as 'active' | 'pending';
}

/** Accepter une demande (admins) */
export async function acceptClubMember(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('club_members')
    .update({ status: 'active' })
    .eq('club_id', clubId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Nommer admin (admins) */
export async function makeClubAdmin(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('club_members')
    .update({ role: 'admin' })
    .eq('club_id', clubId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Supprimer le club (admins) : ses lectures restent, hors club */
export async function deleteClub(clubId: string): Promise<void> {
  const { error } = await supabase.from('clubs').delete().eq('id', clubId);
  if (error) throw error;
}
