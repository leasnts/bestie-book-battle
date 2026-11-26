/**
 * Route /club-join/[code] — l'aperçu d'un club avant de le rejoindre (#238).
 *
 * Ouverte par le lien ou le QR du club (bestie-book-battle://club-join/RH2PSN),
 * ou après « Rejoindre avec un code ».
 *
 *        (L)               la photo du club
 *    Les Liseuses
 *   5 membres · Fourth Wing
 *   [ Rejoindre ]          club « sur demande » : « Demander à rejoindre »
 *
 * Club ouvert : on entre, puis « Je lis aussi » propose la lecture en cours
 * (le parcours court de l'onboarding). Sur demande : « Demande envoyée ».
 * Déjà membre : le bouton ouvre la page du club. Pas encore connecté·e :
 * l'onboarding d'abord (le lien se rouvre ensuite).
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button3D from '../../components/Button3D';
import { CoverImage } from '../../components/ui/BookCover';
import ClubAvatar from '../../components/ui/ClubAvatar';
import SheetPage, { SheetFooter } from '../../components/ui/SheetPage';
import { getClubChallenges, getClubPreview, joinClub } from '../../services/supabase/clubs';
import { useAuthStore } from '../../stores/authStore';
import { useClubStore } from '../../stores/clubStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Challenge, ClubPreview } from '../../types/supabase';
import { colors, fonts, spacing } from '../../utils/constants';
import { buzz } from '../../utils/feel';
import { oops } from '../../utils/notice';

export default function ClubJoinRoute() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const loadMyClubs = useClubStore((s) => s.loadMyClubs);
  const [club, setClub] = useState<ClubPreview | null | undefined>(undefined);
  const [status, setStatus] = useState<'active' | 'pending' | null>(null);
  const [busy, setBusy] = useState(false);
  // La lecture en cours du club, si je ne la lis pas encore (« Je lis aussi »)
  const myChallenges = useProjectStore((s) => s.challenges);
  const [toRead, setToRead] = useState<Challenge | null>(null);

  useEffect(() => {
    getClubPreview(code ?? '')
      .then((preview) => {
        setClub(preview);
        setStatus(preview?.my_status ?? null);
      })
      .catch(() => setClub(null));
  }, [code]);

  useEffect(() => {
    if (status !== 'active' || !club) return;
    getClubChallenges(club.id)
      .then((list) => {
        const current = list.find((c) => c.status !== 'completed') ?? null;
        setToRead(current && !myChallenges.some((c) => c.id === current.id) ? current : null);
      })
      .catch(() => setToRead(null));
  }, [status, club, myChallenges]);

  const join = async () => {
    if (!club || !userId) return;
    setBusy(true);
    try {
      const next = await joinClub(code ?? '');
      setStatus(next);
      buzz('success');
      if (next === 'active') await loadMyClubs(userId);
    } catch (error) {
      oops('Club pas rejoint', error, { retry: () => join() });
    } finally {
      setBusy(false);
    }
  };

  /** Rejoindre la lecture en cours : le parcours court de l'onboarding */
  const readToo = () => {
    if (toRead) router.replace(`/join/${toRead.invite_code}`);
  };

  if (club === undefined) return <SheetPage title=" ">{null}</SheetPage>;
  if (club === null) {
    return (
      <SheetPage title="Code inconnu">
        <Text style={styles.line}>Vérifie le code avec la personne qui t'invite</Text>
        <SheetFooter>
          <Button3D variant="secondary" onPress={() => router.replace('/club-code')}>
            Retaper le code
          </Button3D>
        </SheetFooter>
      </SheetPage>
    );
  }

  return (
    <SheetPage title={club.name}>
      <View style={styles.head}>
        <ClubAvatar club={club} size={88} />
        <Text style={styles.line}>
          {club.member_count} membre{club.member_count > 1 ? 's' : ''}
        </Text>
      </View>

      {club.book_title && (
        <View style={styles.book}>
          {club.cover_url ? <CoverImage uri={club.cover_url} style={styles.cover} /> : null}
          <Text style={styles.bookTitle} numberOfLines={2}>
            {club.book_title}
          </Text>
        </View>
      )}

      <SheetFooter>
        {status === 'active' ? (
          <>
            {toRead && (
              <Button3D variant="primary" onPress={readToo}>
                Je lis aussi
              </Button3D>
            )}
            <Button3D variant={toRead ? 'secondary' : 'primary'} onPress={() => router.replace(`/club?id=${club.id}`)}>
              Voir le club
            </Button3D>
          </>
        ) : status === 'pending' ? (
          <Button3D variant="secondary" disabled onPress={() => {}}>
            Demande envoyée
          </Button3D>
        ) : (
          <Button3D variant="primary" onPress={join} loading={busy}>
            {club.join_mode === 'request' ? 'Demander à rejoindre' : 'Rejoindre'}
          </Button3D>
        )}
      </SheetFooter>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  head: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  line: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  book: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  cover: {
    width: 44,
    height: 64,
    borderRadius: 2,
  },
  bookTitle: {
    flexShrink: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
