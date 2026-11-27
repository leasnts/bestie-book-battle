/**
 * Onglet Clubs (#238, #246) : mes clubs, et la maison du club choisi.
 *
 *   Mes clubs
 *   [carte Test club][carte Liseuses][ · place vide · ]   les cartes défilent ;
 *   (◐◐◐◐) 5 membres ›                         (👤+)       la vide : code / créer
 *   ┌[couv] Les Sœurs Blue ───────────┐
 *   │       ·····●·········· 9 déc.   │    le cadre « Le livre » de l'accueil
 *   └─────────────────────────────────┘
 *   [ Rejoindre la lecture ]               si je ne la lis pas encore
 *   Ça bouge                    Tout voir  les 4 dernières actus
 *   Déjà lus ensemble                      l'étagère de la bibliothèque
 *
 * Pas de rangée de ronds (Lea, 2026-11-27) : des cartes, et toujours une place
 * vide au bout pour dire qu'un club peut venir s'y ranger. Proposer des clubs
 * à rejoindre viendra plus tard (#250).
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronDownIcon, ChevronRightIcon, UserPlusIcon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import BookClubEmpty from '../../components/club/BookClubEmpty';
import ClubFeed from '../../components/club/ClubFeed';
import ClubShelf from '../../components/club/ClubShelf';
import PageTransition from '../../components/PageTransition';
import BookSection from '../../components/ui/BookSection';
import ClubAvatar from '../../components/ui/ClubAvatar';
import GlassButton from '../../components/ui/GlassButton';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import PressableScale from '../../components/ui/PressableScale';
import { useClubFeed } from '../../hooks/useClubFeed';
import { getClubChallenges, getClubMembers } from '../../services/supabase/clubs';
import { useClubStore } from '../../stores/clubStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Challenge, ClubMember } from '../../types/supabase';
import { colors, fonts, spacing } from '../../utils/constants';
import { resolvePhotoSource } from '../../utils/profilePhoto';

/** L'onglet montre les dernières actus ; le reste est derrière « Tout voir » */
const FEED_PREVIEW = 4;
/** La bannière du book club, sous la barre d'état */
const BANNER = 150;

export default function ClubsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  // L'onglet affiché : la barre d'état claire ne vaut que pour lui
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const clubs = useClubStore((s) => s.clubs);
  const myChallenges = useProjectStore((s) => s.challenges);
  const activeClubId = useProjectStore((s) => s.activeChallenge?.club_id ?? null);
  const setActiveChallenge = useProjectStore((s) => s.setActiveChallenge);

  const myClubs = useMemo(
    () => Object.values(clubs).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [clubs],
  );
  const picked = useClubStore((s) => s.selectedId);
  // Le club choisi ; sinon celui du livre de l'accueil ; sinon le plus récent
  const clubId =
    (picked && clubs[picked] ? picked : null) ??
    (activeClubId && clubs[activeClubId] ? activeClubId : null) ??
    myClubs[0]?.id ??
    null;
  const club = clubId ? clubs[clubId] : null;

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [readings, setReadings] = useState<Challenge[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const { feed, notes, load: loadFeed, myUserId, toggleNoteReaction, toggleReaction } = useClubFeed(clubId);

  const load = useCallback(async (id: string) => {
    try {
      const [m, r] = await Promise.all([getClubMembers(id), getClubChallenges(id)]);
      setMembers(m);
      setReadings(r);
      setLoadedFor(id);
    } catch (error) {
      console.warn('[Clubs] club', error);
    }
  }, []);

  // À chaque retour sur l'onglet : le club bouge pendant qu'on est ailleurs
  useFocusEffect(
    useCallback(() => {
      if (!clubId) return;
      load(clubId);
      loadFeed();
    }, [clubId, load, loadFeed]),
  );

  // Changer de club : rien de l'autre club en attendant
  const ready = loadedFor === clubId;
  const active = ready ? members.filter((m) => m.status === 'active') : [];
  const current = ready ? readings.find((c) => c.status !== 'completed') ?? null : null;
  const past = ready ? readings.filter((c) => c.status === 'completed') : [];
  const mineCurrent = current ? myChallenges.find((c) => c.id === current.id) ?? null : null;


  /** Je la lis : sur l'accueil ; sinon, la rejoindre */
  const openCurrent = () => {
    if (!current) return;
    if (mineCurrent) {
      setActiveChallenge(mineCurrent);
      router.navigate('/(tabs)');
    } else {
      router.push(`/join/${current.invite_code}`);
    }
  };

  return (
    <PageTransition>
      {/* Sur la photo de la bannière, l'heure et la batterie en clair */}
      {focused && club && <StatusBar style="light" />}
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!club ? (
          <View style={{ paddingTop: insets.top + spacing.lg }}>
            <BookClubEmpty onCreate={() => router.push('/club-edit')} onJoin={() => router.push('/club-code')} />
          </View>
        ) : (
          <>
            {/* ── La bannière du book club : sa photo, bord à bord ── */}
            <View style={[styles.banner, { height: BANNER + insets.top }]}>
              {club.photo_url ? (
                <Image source={{ uri: club.photo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <ClubAvatar club={club} size={600} style={styles.bannerWash} />
              )}
              <LinearGradient colors={['rgba(46,27,22,0.15)', 'rgba(46,27,22,0.55)']} style={StyleSheet.absoluteFill} />
              <View style={[styles.bannerBar, { top: insets.top + spacing.sm }]}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Book club</Text>
                </View>
                <GlassButton
                  icon={UserPlusIcon}
                  onPress={() => router.push(`/club-invite?id=${club.id}`)}
                  accessibilityLabel="Inviter"
                />
              </View>
            </View>

            {/* ── Son nom, ⌄ pour changer ou en rejoindre un autre ; ses membres ── */}
            <View style={styles.nameRow}>
              <Text style={styles.clubName} numberOfLines={2} accessibilityRole="header">
                {club.name}
              </Text>
              <GlassButton
                icon={ChevronDownIcon}
                onPress={() => router.push(`/club-pick?current=${club.id}`)}
                accessibilityLabel="Mes book clubs"
              />
            </View>
            <PressableScale
              style={styles.members}
              pressedScale={0.98}
              onPress={() => router.push(`/club?id=${club.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${active.length} membres`}
              accessibilityHint="Ouvre la page du club"
            >
              <View style={styles.stack}>
                {active.slice(0, 5).map((m, i) => (
                  <Image
                    key={m.user_id}
                    source={resolvePhotoSource(m.user.profile_photo_url)}
                    style={[styles.mini, i > 0 && styles.miniOver]}
                  />
                ))}
              </View>
              <Text style={styles.metaText}>
                {active.length} membre{active.length > 1 ? 's' : ''}
              </Text>
              <ChevronRightIcon size={16} color={colors.textTertiary} strokeWidth={2.4} />
            </PressableScale>

            {/* ── La lecture en cours : le cadre du livre de l'accueil ── */}
            {current && (
              <View style={styles.book}>
                <BookSection
                  challenge={current}
                  coverUrl={current.cover_url}
                  percent={current.average_progress_percentage ?? 0}
                  group
                  caps={[]}
                  onPress={openCurrent}
                />
                {!mineCurrent && (
                  <View style={styles.joinCta}>
                    <Button3D variant="primary" onPress={openCurrent}>
                      Rejoindre la lecture
                    </Button3D>
                  </View>
                )}
              </View>
            )}

            {/* ── Ça bouge : les dernières actus ── */}
            {ready && feed.length > 0 && (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.h2} accessibilityRole="header">
                    Ça bouge
                  </Text>
                  {feed.length > FEED_PREVIEW && (
                    <PressableScale
                      style={styles.seeAll}
                      onPress={() => router.push(`/club-feed?id=${club.id}&current=${current?.id ?? ''}`)}
                      accessibilityRole="button"
                      accessibilityLabel="Tout voir"
                    >
                      <Text style={styles.seeAllText}>Tout voir</Text>
                      <ChevronRightIcon size={16} color={colors.textTertiary} strokeWidth={2.4} />
                    </PressableScale>
                  )}
                </View>
                <ClubFeed
                  items={feed.slice(0, FEED_PREVIEW)}
                  notes={notes}
                  myUserId={myUserId}
                  currentChallengeId={current?.id ?? null}
                  onToggleNoteReaction={toggleNoteReaction}
                  onToggleReaction={toggleReaction}
                />
              </>
            )}

            {/* ── Déjà lus ensemble : l'étagère ── */}
            {past.length > 0 && (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.h2} accessibilityRole="header">
                    Déjà lus ensemble
                  </Text>
                </View>
                <ClubShelf readings={past} side={spacing.lg} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  banner: {
    marginHorizontal: -spacing.lg,
    overflow: 'hidden',
  },
  bannerWash: {
    position: 'absolute',
    left: -100,
    top: -225,
    borderRadius: 0,
  },
  bannerBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,250,242,0.92)',
  },
  tagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  clubName: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  members: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    alignSelf: 'flex-start',
  },
  stack: {
    flexDirection: 'row',
  },
  mini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.bgApp,
  },
  miniOver: {
    marginLeft: -7,
  },
  metaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
  book: {
    marginTop: spacing.xl,
  },
  joinCta: {
    marginTop: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    paddingLeft: spacing.md,
  },
  seeAllText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textTertiary,
  },
});
