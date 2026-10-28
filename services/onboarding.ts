/**
 * Ce que l'onboarding enregistre, en un seul endroit (avant : recopié dans
 * complete.tsx et welcome.tsx).
 *
 * - `ensureProfile` : le profil existe (après Apple ou l'email, il peut n'être
 *   qu'en attente dans authStore).
 * - `createReading` : la lecture, avec sa couverture et sa palette.
 * - `settleMyReading` : ma lecture de CE livre (format, édition, position de
 *   départ, rythme), et mes habitudes (moments, formats, heure du rappel).
 */

import { supabase } from '../supabaseConfig';
import { useAuthStore } from '../stores/authStore';
import type { BookDraft, InvitationDraft } from '../stores/onboardingStore';
import { useProjectStore } from '../stores/projectStore';
import type { BookFormat, Challenge, ReadingMoment } from '../types/supabase';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../utils/constants';
import { extractCoverPalette } from '../utils/coverPalette';
import { saveMyEdition } from './myEdition';
import { createOrUpdateUserProfile, updateUserProfile } from './supabase/auth';
import { saveCoverPalette, updateChallenge } from './supabase/database';
import { uploadBookCover } from './supabase/storage';

/** L'heure du rappel selon le moment : le plus tard de la journée l'emporte */
const MOMENT_TIME: Record<ReadingMoment, string> = {
  matin: '07:45',
  trajets: '08:15',
  pause: '12:30',
  soir: '20:30',
  lit: '22:00',
};

export function reminderTime(moments: ReadingMoment[]): string {
  const times = moments.map((m) => MOMENT_TIME[m]).sort();
  return times[times.length - 1] ?? DEFAULT_NOTIFICATION_PREFERENCES.daily_reminder_time;
}

/** Le profil de la personne connectée, créé s'il n'était qu'en attente */
export async function ensureProfile(): Promise<string> {
  const { user, pendingUserData, setUser, setPendingUserData } = useAuthStore.getState();
  if (user?.id) return user.id;
  if (!pendingUserData) throw new Error('Utilisateur non identifié');
  const created = await createOrUpdateUserProfile({
    id: pendingUserData.authId,
    apple_user_id: pendingUserData.appleUserId,
    email: pendingUserData.email,
    first_name: pendingUserData.firstName || 'Toi',
    last_name: pendingUserData.lastName || null,
  });
  setUser(created);
  setPendingUserData(null);
  return created.id;
}

/** Crée la lecture (édition de référence = la mienne), couverture comprise */
export async function createReading(userId: string, book: BookDraft, targetEndDate: string | null): Promise<Challenge> {
  const challenge = await useProjectStore
    .getState()
    .createChallenge(userId, book.title, book.author || undefined, book.pages, undefined, targetEndDate ?? undefined);
  if (book.cover) await setReadingCover(challenge.id, book.cover);
  return challenge;
}

/** Le livre a changé après la création (retour en arrière) : on suit */
export async function updateReadingBook(challengeId: string, book: BookDraft) {
  await updateChallenge(challengeId, {
    book_title: book.title,
    book_author: book.author || null,
    total_pages: book.pages,
  });
  useProjectStore.getState().patchChallengeLocally(challengeId, {
    book_title: book.title,
    book_author: book.author || null,
    total_pages: book.pages,
  });
  if (book.cover) await setReadingCover(challengeId, book.cover);
}

/** La couverture de la lecture : envoyée si c'est une photo, puis sa palette */
async function setReadingCover(challengeId: string, cover: string) {
  try {
    const url = /^https?:\/\//.test(cover) ? cover : (await uploadBookCover(challengeId, cover)).url;
    await updateChallenge(challengeId, { cover_url: url });
    useProjectStore.getState().patchChallengeLocally(challengeId, { cover_url: url });
    extractCoverPalette(cover)
      .then(async (palette) => {
        await saveCoverPalette(challengeId, palette);
        useProjectStore.getState().patchChallengeLocally(challengeId, { cover_palette: palette });
      })
      .catch((error) => console.warn('[CoverPalette] extraction impossible', error));
  } catch (error) {
    // Une couverture manquante ne bloque pas la lecture
    console.warn('Couverture non enregistrée :', error);
  }
}

interface MyReading {
  format: BookFormat;
  /** Mon édition papier, si elle diffère de celle de la lecture */
  edition?: { pages: number; cover: string | null; publisher: string | null };
  /** Ma position de départ, dans l'unité du format */
  start: number;
  perDay: number | null;
  targetEndDate: string | null;
}

/** Ma lecture de ce livre : format, édition, rythme, puis ma position de départ */
export async function settleMyReading(challengeId: string, userId: string, mine: MyReading) {
  const percent = mine.format !== 'papier';
  await saveMyEdition(challengeId, userId, {
    format: mine.format,
    perDay: mine.perDay,
    targetEndDate: mine.targetEndDate,
    ...(percent
      ? { totalPages: 100 }
      : mine.edition && {
          totalPages: mine.edition.pages,
          cover: mine.edition.cover,
          publisher: mine.edition.publisher,
        }),
  });
  // Déjà lu avant chapi : posé sans historique ni série (voir set_start_position)
  if (mine.start > 0) {
    const { error } = await supabase.rpc('set_start_position', { p_challenge_id: challengeId, p_page: mine.start });
    if (error) throw error;
  }
}

/** Mes habitudes, en général : moments, formats, heure du rappel */
export async function saveReaderHabits(userId: string, moments: ReadingMoment[], usualFormats: BookFormat[]) {
  const user = useAuthStore.getState().user;
  const updated = await updateUserProfile(userId, {
    reading_moments: moments,
    usual_formats: usualFormats,
    notification_preferences: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...user?.notification_preferences,
      daily_reminder_time: reminderTime(moments),
    },
  });
  useAuthStore.getState().setUser(updated);
  return updated;
}

/** La date de fin, en partant d'aujourd'hui : YYYY-MM-DD, ou null si libre */
export function endDateFor(remaining: number, perDay: number | null): string | null {
  if (!perDay) return null;
  const date = new Date();
  date.setDate(date.getDate() + Math.ceil(Math.max(0, remaining) / perDay));
  return date.toISOString().slice(0, 10);
}

/** La lecture derrière un code (ou un lien) : null s'il ne mène nulle part */
export async function fetchInvitation(code: string): Promise<InvitationDraft | null> {
  // RPC : la personne n'est pas encore membre, une lecture directe serait bloquée (RLS)
  const { data, error } = await supabase.rpc('get_challenge_by_invite_code', { p_code: code.trim() });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return null;
  return {
    challengeId: row.id,
    code: row.invite_code,
    title: row.book_title,
    author: row.book_author || '',
    pages: row.total_pages,
    cover: row.cover_url || null,
    adminFirstName: row.admin_first_name || 'Quelqu’un',
    groupPercent: Number(row.average_progress_percentage) || 0,
  };
}
