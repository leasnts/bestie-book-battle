/**
 * useCoverPalette — les couleurs de la couverture du challenge affiché.
 *
 * Renvoie `challenge.cover_palette` tel quel (null = fond de repli noyer).
 *
 * Rattrapage des couvertures existantes : si le challenge a une couverture mais
 * pas encore de palette, la palette est extraite ici, enregistrée pour tout le
 * club (`saveCoverPalette`) puis appliquée au store. Le fond passe du repli aux
 * couleurs du livre en fondu, sans chargement visible.
 *
 * On attend `challengesLoaded` : le cache local peut dater d'avant la colonne
 * `cover_palette`, alors qu'une autre membre l'a peut-être déjà calculée.
 */

import { useEffect, useRef } from 'react';
import { saveCoverPalette } from '../services/supabase/database';
import { useProjectStore } from '../stores/projectStore';
import type { Challenge } from '../types/supabase';
import { extractCoverPalette, type CoverPalette } from '../utils/coverPalette';

export function useCoverPalette(challenge: Challenge | null): CoverPalette | null {
  const challengesLoaded = useProjectStore((s) => s.challengesLoaded);
  const patchChallengeLocally = useProjectStore((s) => s.patchChallengeLocally);
  /** Couvertures déjà tentées pendant cette session : pas de nouvel essai en boucle si ça échoue */
  const attempted = useRef(new Set<string>());

  const id = challenge?.id;
  const coverUrl = challenge?.cover_url;
  const missing = challenge != null && challenge.cover_palette == null;

  useEffect(() => {
    if (!challengesLoaded || !missing || !id || !coverUrl) return;
    if (attempted.current.has(coverUrl)) return;
    attempted.current.add(coverUrl);

    extractCoverPalette(coverUrl)
      .then(async (palette) => {
        await saveCoverPalette(id, palette);
        patchChallengeLocally(id, { cover_palette: palette });
      })
      .catch((error) => {
        // Sans palette, le fond reste sur le repli noyer : rien de bloquant
        console.warn('[CoverPalette] extraction impossible', error);
      });
  }, [challengesLoaded, missing, id, coverUrl, patchChallengeLocally]);

  return challenge?.cover_palette ?? null;
}
