/**
 * Route /club-pick — choisir le club où aller (#238).
 *
 * Ouvert par le rond du club sur l'accueil, quand je suis dans 2 clubs ou plus
 * (avec un seul, le rond ouvre directement sa page). Le club du livre affiché
 * est en premier, brodé. Toucher un club ouvre sa page.
 *
 * Mêmes lignes que les choix de l'onboarding (OptionList).
 */

import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import OptionList from '../components/onboarding/OptionList';
import ClubAvatar from '../components/ui/ClubAvatar';
import SheetPage from '../components/ui/SheetPage';
import { useClubStore } from '../stores/clubStore';
import { useProjectStore } from '../stores/projectStore';

export default function ClubPickRoute() {
  const router = useRouter();
  const clubs = useClubStore((s) => s.clubs);
  const activeClubId = useProjectStore((s) => s.activeChallenge?.club_id ?? null);

  // Le club du livre affiché d'abord, puis les plus récents
  const list = useMemo(
    () =>
      Object.values(clubs).sort((a, b) =>
        a.id === activeClubId ? -1 : b.id === activeClubId ? 1 : b.created_at.localeCompare(a.created_at),
      ),
    [clubs, activeClubId],
  );

  return (
    <SheetPage title="Mes clubs" accent="clubs">
      <View>
        <OptionList
          options={list.map((club) => ({ key: club.id, label: club.name, leading: <ClubAvatar club={club} size={36} /> }))}
          value={activeClubId}
          onChange={(id) => router.replace(`/club?id=${id}`)}
          keepUndimmed
        />
      </View>
    </SheetPage>
  );
}
