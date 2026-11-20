/**
 * Route /club — la page d'un club (#238), où l'on change aussi de club.
 *
 * Ouverte par le rond du club sur l'accueil (le club du livre affiché), ou par
 * « Le club » dans le « … » de la fiche du livre (`?id=`).
 *
 *   (L)  (H)  (S)                       mes clubs, si j'en ai plusieurs : le
 *   Liseuses Honey Soleil               club affiché brodé ; en toucher un autre
 *                                       met sa lecture sur l'accueil
 *   Les Liseuses                    (+👤) (…)
 *   (L)(◐◐◐) 7 membres
 *   ┌──────────────────────────────┐
 *   │ [cover] Fourth Wing     47 % │   la lecture en cours : la toucher la
 *   │         Rebecca Yarros  📍 11 déc.│   met sur l'accueil
 *   └──────────────────────────────┘
 *   [cover][cover][cover]               les livres déjà lus ensemble
 *   (◐) Moi                    admin
 *   (◐) Emma                            l'admin touche un membre pour le retirer
 *
 * Pas de titres de section : la lecture, l'étagère et les membres se
 * reconnaissent seuls.
 */

import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EllipsisIcon, MapPinIcon, UserPlusIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CoverImage } from '../components/ui/BookCover';
import ClubAvatar from '../components/ui/ClubAvatar';
import GlassButton from '../components/ui/GlassButton';
import GlassSection from '../components/ui/GlassSection';
import PressableScale from '../components/ui/PressableScale';
import SheetPage from '../components/ui/SheetPage';
import { StitchBorder, StitchLine } from '../components/ui/Stitch';
import { STITCH_ON, STITCH_WEIGHT } from '../components/onboarding/OptionList';
import { feel } from '../utils/feel';
import { getClubMembers, removeClubMember } from '../services/supabase/clubs';
import { useAuthStore } from '../stores/authStore';
import { useClubStore } from '../stores/clubStore';
import { useProjectStore } from '../stores/projectStore';
import type { Challenge, ClubMember } from '../types/supabase';
import { colors, fonts, spacing } from '../utils/constants';
import { oops } from '../utils/notice';
import { resolvePhotoSource } from '../utils/profilePhoto';
import { clubReadings } from '../utils/clubs';

const AVATAR = 34;
/** Un rond de la rangée des clubs */
const SWITCH = 52;

/** « 11 déc. », comme la date de fin sur l'accueil */
function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ClubRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const from = params.from;
  const userId = useAuthStore((s) => s.user?.id);
  const activeClubId = useProjectStore((s) => s.activeChallenge?.club_id ?? null);
  // Le club affiché : celui demandé, sinon celui du livre de l'accueil
  const [id, setId] = useState(params.id ?? activeClubId ?? '');
  const clubs = useClubStore((s) => s.clubs);
  const club = clubs[id];
  const loadMyClubs = useClubStore((s) => s.loadMyClubs);
  const challenges = useProjectStore((s) => s.challenges);
  const setActiveChallenge = useProjectStore((s) => s.setActiveChallenge);
  const [members, setMembers] = useState<ClubMember[]>([]);

  const load = useCallback(() => {
    if (!id) return;
    getClubMembers(id)
      .then(setMembers)
      .catch((error) => console.warn('[Club] membres indisponibles', error));
  }, [id]);
  useEffect(load, [load]);

  const { current, past } = useMemo(() => clubReadings(challenges, id), [challenges, id]);
  const isAdmin = members.some((m) => m.user_id === userId && m.role === 'admin');

  const openReading = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    router.dismissAll();
  };

  // Mes clubs, le plus récent d'abord : la rangée du haut, pour changer de club
  const myClubs = useMemo(
    () => Object.values(clubs).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [clubs],
  );

  // Changer de club : sa lecture en cours passe sur l'accueil, la page le montre
  const switchClub = (clubId: string) => {
    if (clubId === id) return;
    feel('tic');
    setMembers([]);
    setId(clubId);
    const reading = clubReadings(challenges, clubId).current;
    if (reading) setActiveChallenge(reading);
  };

  const handleMenu = () => {
    const options = isAdmin ? ['Modifier le club', 'Annuler'] : ['Quitter le club', 'Annuler'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: 1, destructiveButtonIndex: isAdmin ? undefined : 0 },
      (index) => {
        if (index !== 0) return;
        if (isAdmin) router.push(`/club-edit?id=${id}&from=club`);
        else if (userId) leave(userId);
      },
    );
  };

  const leave = (memberId: string) => {
    const me = memberId === userId;
    const who = members.find((m) => m.user_id === memberId)?.user.first_name ?? '';
    Alert.alert(me ? 'Quitter le club' : `Retirer ${who}`, undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: me ? 'Quitter' : 'Retirer',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeClubMember(id, memberId);
            if (me) {
              if (userId) await loadMyClubs(userId);
              router.back();
            } else {
              load();
            }
          } catch (error) {
            oops(me ? 'Club pas quitté' : 'Pas retiré', error);
          }
        },
      },
    ]);
  };

  if (!club) return null;

  return (
    <SheetPage
      title={club.name}
      onBack={from ? () => router.back() : undefined}
      subtitle={
        <View style={styles.sub}>
          <ClubAvatar club={club} size={28} />
          <View style={styles.stack}>
            {members.slice(0, 4).map((m, i) => (
              <Image
                key={m.user_id}
                source={resolvePhotoSource(m.user.profile_photo_url)}
                style={[styles.mini, i > 0 && styles.miniOver]}
              />
            ))}
          </View>
          {members.length > 0 && (
            <Text style={styles.subText}>
              {members.length} membre{members.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      }
      actions={
        <>
          {current && (
            <GlassButton
              icon={UserPlusIcon}
              onPress={() => router.push(`/invite?id=${current.id}&from=club`)}
              accessibilityLabel="Inviter dans le club"
            />
          )}
          <GlassButton icon={EllipsisIcon} onPress={handleMenu} accessibilityLabel="Plus d'options" />
        </>
      }
    >
      {myClubs.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcher}>
          {myClubs.map((c) => {
            const on = c.id === id;
            return (
              <PressableScale
                key={c.id}
                style={styles.switchItem}
                pressedScale={0.92}
                onPress={() => switchClub(c.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={c.name}
                accessibilityHint={on ? undefined : "Met sa lecture sur l'accueil"}
              >
                <View style={[styles.switchRing, on && styles.switchRingOn]}>
                  {on && <StitchBorder radius={SWITCH / 2 + 5} inset={1} color={STITCH_ON} weight={STITCH_WEIGHT} />}
                  <ClubAvatar club={c} size={SWITCH} />
                </View>
                <Text style={[styles.switchName, on && styles.switchNameOn]} numberOfLines={2}>
                  {c.name}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      )}

      {current && (
        <GlassSection
          paper
          onPress={() => openReading(current)}
          accessibilityLabel={`${current.book_title}, lecture en cours du club`}
          accessibilityHint="La met sur l'accueil"
        >
          <View style={styles.current}>
            {current.cover_url ? <CoverImage uri={current.cover_url} style={styles.cover} /> : <View style={styles.cover} />}
            <View style={styles.currentText}>
              <Text style={styles.title} numberOfLines={2}>
                {current.book_title}
              </Text>
              {current.book_author && (
                <Text style={styles.author} numberOfLines={1}>
                  {current.book_author}
                </Text>
              )}
              <View style={styles.facts}>
                <Text style={styles.fact}>{Math.round(current.average_progress_percentage ?? 0)} %</Text>
                {current.target_end_date && (
                  <View style={styles.meet}>
                    <MapPinIcon size={14} color={colors.textTertiary} strokeWidth={2} />
                    <Text style={styles.fact}>{formatShortDate(current.target_end_date)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </GlassSection>
      )}

      {past.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
          {past.map((c) => (
            <PressableScale
              key={c.id}
              pressedScale={0.96}
              onPress={() => openReading(c)}
              accessibilityRole="button"
              accessibilityLabel={c.book_title}
            >
              {c.cover_url ? <CoverImage uri={c.cover_url} style={styles.pastCover} /> : <View style={styles.pastCover} />}
            </PressableScale>
          ))}
        </ScrollView>
      )}

      <View style={styles.members}>
        {members.map((m, i) => {
          const canRemove = isAdmin && m.user_id !== userId;
          return (
            <View key={m.user_id}>
              {i > 0 && <StitchLine />}
              {canRemove ? (
                <PressableScale
                  style={styles.member}
                  pressedScale={0.98}
                  onPress={() => leave(m.user_id)}
                  accessibilityRole="button"
                  accessibilityHint="Retirer du club"
                >
                  <MemberLine member={m} me={m.user_id === userId} />
                </PressableScale>
              ) : (
                <View style={styles.member}>
                  <MemberLine member={m} me={m.user_id === userId} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </SheetPage>
  );
}

/** Une ligne de membre : photo, prénom (« Moi »), « admin » */
function MemberLine({ member, me }: { member: ClubMember; me: boolean }) {
  return (
    <>
      <Image source={resolvePhotoSource(member.user.profile_photo_url)} style={styles.avatar} />
      <Text style={styles.name} numberOfLines={1}>
        {me ? 'Moi' : member.user.first_name}
      </Text>
      {member.role === 'admin' && <Text style={styles.role}>admin</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  switcher: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  switchItem: {
    width: SWITCH + 28,
    alignItems: 'center',
    gap: 6,
  },
  // Le club affiché : brodé tout autour, comme le choix de l'onboarding
  switchRing: {
    width: SWITCH + 10,
    height: SWITCH + 10,
    borderRadius: (SWITCH + 10) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  switchRingOn: {
    opacity: 1,
  },
  // Un nom de 20 caractères tient sur deux lignes
  switchName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    color: colors.textTertiary,
  },
  switchNameOn: {
    color: colors.textPrimary,
  },
  sub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stack: {
    flexDirection: 'row',
  },
  mini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
  },
  miniOver: {
    marginLeft: -8,
  },
  subText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textTertiary,
  },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cover: {
    width: 62,
    height: 88,
    borderRadius: 3,
  },
  currentText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  facts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  meet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fact: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
  shelf: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  pastCover: {
    width: 54,
    height: 78,
    borderRadius: 2,
  },
  members: {
    marginTop: spacing.sm,
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  name: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  role: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
});
