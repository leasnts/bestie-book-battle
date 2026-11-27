/**
 * La PAL du club (#238, étape 2) : proposer un livre, y mettre un cœur, et
 * choisir le prochain (l'admin). Tables club_pal / club_pal_votes, fonction
 * choose_club_next (scripts/add-club-pal.sql).
 */

import { supabase } from '../../supabaseConfig';
import type { BookSearchResult } from '../../types/bookSearch';
import type { Challenge } from '../../types/supabase';

/** Un livre de la PAL du club, avec ses cœurs */
export interface ClubPalBook {
  id: string;
  club_id: string;
  book_title: string;
  book_author: string | null;
  cover_url: string | null;
  total_pages: number | null;
  proposed_by: string;
  created_at: string;
  proposer: { first_name: string | null } | null;
  votes: { user_id: string }[];
}

/** La PAL du club, le plus de cœurs d'abord (à égalité, le plus ancien) */
export async function getClubPal(clubId: string): Promise<ClubPalBook[]> {
  const { data, error } = await supabase
    .from('club_pal')
    .select('*, proposer:users!club_pal_proposed_by_fkey(first_name), votes:club_pal_votes(user_id)')
    .eq('club_id', clubId)
    .is('chosen_challenge_id', null);
  if (error) throw error;
  return sortPal((data ?? []) as unknown as ClubPalBook[]);
}

export function sortPal(list: ClubPalBook[]): ClubPalBook[] {
  return [...list].sort((a, b) => b.votes.length - a.votes.length || a.created_at.localeCompare(b.created_at));
}

/** Proposer un livre au club */
export async function proposeToClub(clubId: string, userId: string, book: BookSearchResult): Promise<void> {
  const { error } = await supabase.from('club_pal').insert({
    club_id: clubId,
    book_title: book.title,
    book_author: book.author || null,
    cover_url: book.coverUrl,
    total_pages: book.pageCount && book.pageCount > 0 ? book.pageCount : null,
    isbn: book.isbn ?? null,
    proposed_by: userId,
  });
  // Déjà dans la PAL : rien à faire
  if (error && error.code !== '23505') throw error;
}

export async function votePal(palId: string, userId: string, on: boolean): Promise<void> {
  const { error } = on
    ? await supabase.from('club_pal_votes').insert({ pal_id: palId, user_id: userId })
    : await supabase.from('club_pal_votes').delete().eq('pal_id', palId).eq('user_id', userId);
  if (error && error.code !== '23505') throw error;
}

/** L'admin choisit le prochain : il devient la lecture « Ensuite » du club */
export async function chooseClubNext(palId: string): Promise<Challenge> {
  const { data, error } = await supabase.rpc('choose_club_next', { p_pal_id: palId });
  if (error) throw error;
  return data as Challenge;
}
