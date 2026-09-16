/**
 * Route /library — la bibliothèque de tes challenges
 *
 * Ouverte par le bouton en haut à gauche de l'accueil. Présentée comme un sheet
 * iOS natif (`presentation: 'formSheet'`, configuré dans app/_layout.tsx), sur
 * le même modèle que /leaderboard : lire l'en-tête de app/leaderboard.tsx avant
 * de toucher à la mise en page.
 *
 * Les données viennent directement du projectStore : aucun paramètre d'URL.
 */

import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import BookLibrary from '../components/ui/BookLibrary';
import { useProjectStore } from '../stores/projectStore';
import { Challenge } from '../types/supabase';

export default function LibraryRoute() {
  const router = useRouter();
  const challenges = useProjectStore((state) => state.challenges);
  const activeChallengeId = useProjectStore((state) => state.activeChallenge?.id ?? null);
  const setActiveChallenge = useProjectStore((state) => state.setActiveChallenge);

  // Choisir un livre : il devient le livre en cours, et on revient à l'accueil
  const handleSelect = useCallback(
    (challenge: Challenge) => {
      setActiveChallenge(challenge);
      router.back();
    },
    [setActiveChallenge, router],
  );

  return (
    <BookLibrary
      challenges={challenges}
      activeChallengeId={activeChallengeId}
      onSelect={handleSelect}
    />
  );
}
