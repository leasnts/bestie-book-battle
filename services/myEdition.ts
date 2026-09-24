/**
 * Mon édition d'un livre : ses pages, sa couverture, son éditeur.
 *
 * Chacun lit son édition (poche, broché, Kindle…). Le bbb garde une édition de
 * référence (`challenges`), celle de la personne qui l'a créé ; chaque membre
 * peut avoir la sienne dans `user_progress`. Couverture absente = celle du bbb.
 */

import type { Challenge, UserProgress } from '../types/supabase';
import { updateMyEdition } from './supabase/database';
import { uploadBookCover } from './supabase/storage';

export interface MyEditionInput {
  totalPages?: number;
  /** Photo locale (file://…) à envoyer, ou URL d'une couverture trouvée par la recherche */
  cover?: string | null;
  publisher?: string | null;
}

/**
 * Enregistrer mon édition. Une photo locale est d'abord envoyée dans le
 * stockage, sous `{challengeId}/{userId}.jpg`.
 */
export async function saveMyEdition(
  challengeId: string,
  userId: string,
  { totalPages, cover, publisher }: MyEditionInput
): Promise<UserProgress> {
  let coverUrl = cover;
  if (cover && !/^https?:\/\//.test(cover)) {
    ({ url: coverUrl } = await uploadBookCover(challengeId, cover, userId));
  }

  return updateMyEdition(challengeId, userId, {
    ...(totalPages !== undefined && { total_pages: totalPages }),
    ...(coverUrl !== undefined && { cover_url: coverUrl }),
    ...(publisher !== undefined && { publisher }),
  });
}

/** La couverture que JE vois : celle de mon édition, sinon celle du bbb */
export function myCoverUrl(
  challenge: Pick<Challenge, 'cover_url'>,
  mine: { cover_url?: string | null } | null | undefined
): string | null {
  return mine?.cover_url || challenge.cover_url;
}
