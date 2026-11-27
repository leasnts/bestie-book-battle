/**
 * Route /club-pick — « Mes book clubs » (#238, maquette 10).
 *
 * Ouvert par ⌄ à côté du nom du book club (onglet Clubs) ou par le rond du
 * club sur l'accueil. Le book club affiché est brodé ; en toucher un autre
 * l'affiche dans l'onglet Clubs. Dessous, de quoi en rejoindre ou en créer un :
 * même chose avec 1 ou 5 book clubs (Lea, 2026-11-27 : pas de rangée de ronds).
 *
 * Mêmes lignes que les choix de l'onboarding (OptionList).
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Button3D from '../components/Button3D';
import OptionList from '../components/onboarding/OptionList';
import ClubAvatar from '../components/ui/ClubAvatar';
import SheetPage from '../components/ui/SheetPage';
import { StitchLine } from '../components/ui/Stitch';
import { useClubStore } from '../stores/clubStore';
import { useProjectStore } from '../stores/projectStore';
import { spacing } from '../utils/constants';

export default function ClubPickRoute() {
  const router = useRouter();
  const { current } = useLocalSearchParams<{ current?: string }>();
  const clubs = useClubStore((s) => s.clubs);
  const selectClub = useClubStore((s) => s.selectClub);
  const activeClubId = useProjectStore((s) => s.activeChallenge?.club_id ?? null);
  const shown = current ?? activeClubId;

  // Celui affiché d'abord, puis les plus récents
  const list = useMemo(
    () =>
      Object.values(clubs).sort((a, b) =>
        a.id === shown ? -1 : b.id === shown ? 1 : b.created_at.localeCompare(a.created_at),
      ),
    [clubs, shown],
  );

  const open = (id: string) => {
    selectClub(id);
    // Depuis l'onglet : on y revient ; depuis l'accueil : on y va
    if (current) router.back();
    else router.replace('/(tabs)/clubs');
  };

  return (
    <SheetPage title="Mes book clubs" accent="book">
      <View>
        <OptionList
          options={list.map((club) => ({ key: club.id, label: club.name, leading: <ClubAvatar club={club} size={36} /> }))}
          value={shown ?? null}
          onChange={open}
          keepUndimmed
        />
        <StitchLine style={styles.stitch} />
        <View style={styles.ctas}>
          <View style={styles.cta}>
            <Button3D variant="secondary" onPress={() => router.replace('/club-code')}>
              J'ai un code
            </Button3D>
          </View>
          <View style={styles.cta}>
            <Button3D variant="secondary" onPress={() => router.replace('/club-edit')}>
              Créer
            </Button3D>
          </View>
        </View>
      </View>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  stitch: {
    marginVertical: spacing.lg,
  },
  ctas: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cta: {
    flex: 1,
  },
});
