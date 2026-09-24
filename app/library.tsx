/**
 * Route /library — la bibliothèque : tous mes livres
 *
 * Ouverte par le bouton en haut à gauche de l'accueil. Présentée comme un sheet
 * iOS natif (`presentation: 'formSheet'`, configuré dans app/_layout.tsx), sur
 * le même modèle que /leaderboard : lire l'en-tête de app/leaderboard.tsx avant
 * de toucher à la mise en page.
 *
 * Les données viennent directement des stores : aucun paramètre d'URL. Ma
 * progression par livre est en cache (projectStore.myProgress) et rafraîchie
 * à chaque ouverture ; pour le livre de l'accueil, on prend la version vivante
 * du progressStore, à jour dès que j'enregistre des pages.
 */

import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BookLibrary, { LIST_SIDE } from '../components/ui/BookLibrary';
import { sheetIconItem } from '../components/ui/SheetHeader';
import WatercolorCorner, {
  WATERCOLOR_OVERFLOW_RIGHT,
  WATERCOLOR_OVERFLOW_TOP,
} from '../components/ui/WatercolorCorner';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import { Challenge } from '../types/supabase';
import { BookReading, LibraryFilter, newBookId, readingOf, sortBooks } from '../utils/library';

export default function LibraryRoute() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const challenges = useProjectStore((state) => state.challenges);
  const activeChallengeId = useProjectStore((state) => state.activeChallenge?.id ?? null);
  const setActiveChallenge = useProjectStore((state) => state.setActiveChallenge);
  const myProgress = useProjectStore((state) => state.myProgress);
  const loadMyProgress = useProjectStore((state) => state.loadMyProgress);
  const liveProgress = useProgressStore((state) => state.currentUserProgress);
  const userId = useAuthStore((state) => state.user?.id);
  const firstName = useAuthStore((state) => state.user?.first_name);
  // Filtre Tout / En cours / Non lus / Lus : pas retenu, chaque ouverture montre tout
  const [filter, setFilter] = useState<LibraryFilter>('all');

  // Rafraîchit ma progression en arrière-plan ; le cache s'affiche tout de suite
  useEffect(() => {
    if (userId) loadMyProgress(userId);
  }, [userId, loadMyProgress]);

  // Cache + version vivante du livre de l'accueil
  const progressById = useMemo(() => {
    if (!liveProgress || liveProgress.user_id !== userId) return myProgress;
    return { ...myProgress, [liveProgress.challenge_id]: liveProgress };
  }, [myProgress, liveProgress, userId]);

  const readings = useMemo(() => {
    const byId: Record<string, BookReading> = {};
    for (const book of challenges) byId[book.id] = readingOf(progressById[book.id]);
    return byId;
  }, [challenges, progressById]);

  const books = useMemo(() => {
    const sorted = sortBooks(challenges, progressById);
    return filter === 'all' ? sorted : sorted.filter((book) => readings[book.id]?.state === filter);
  }, [challenges, progressById, readings, filter]);

  const newId = useMemo(() => newBookId(challenges, progressById), [challenges, progressById]);

  // Choisir un livre : il devient le livre en cours, et on revient à l'accueil
  const handleSelect = useCallback(
    (challenge: Challenge) => {
      setActiveChallenge(challenge);
      router.back();
    },
    [setActiveChallenge, router],
  );

  // Ajouter un livre : même parcours que le « + » de la barre d'onglets. On
  // ferme d'abord le sheet, sinon l'écran poussé s'ouvrirait À L'INTÉRIEUR du sheet.
  const handleAdd = useCallback(() => {
    router.back();
    router.push({
      pathname: '/onboarding/role',
      params: { firstName: firstName || 'Lecteur', addChallenge: 'true' },
    });
  }, [router, firstName]);

  return (
    <>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            sheetIconItem({ icon: PlusIcon, onPress: handleAdd, accessibilityLabel: 'Ajouter une lecture' }),
          ],
        }}
      />
      <BookLibrary
        challenges={books}
        readings={readings}
        newBookId={newId}
        activeChallengeId={activeChallengeId}
        onSelect={handleSelect}
        filter={filter}
        onFilterChange={setFilter}
        // Dans l'en-tête de la liste, pour que les filtres passent par-dessus.
        // Recalé sur le coin de l'écran : la liste commence sous la barre, avec
        // sa marge. Tons neutres : aucun livre précis ici.
        headerBackground={
          <WatercolorCorner
            style={{
              top: -WATERCOLOR_OVERFLOW_TOP - headerHeight,
              right: -WATERCOLOR_OVERFLOW_RIGHT - LIST_SIDE,
            }}
          />
        }
      />
    </>
  );
}
