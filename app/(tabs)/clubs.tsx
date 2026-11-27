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
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import BookClubEmpty from '../../components/club/BookClubEmpty';
import ClubFeed from '../../components/club/ClubFeed';
import ClubPalRow from '../../components/club/ClubPalRow';
import ClubShelf from '../../components/club/ClubShelf';
import PageTransition from '../../components/PageTransition';
import { CoverImage } from '../../components/ui/BookCover';
import BookSection from '../../components/ui/BookSection';
import ClubAvatar from '../../components/ui/ClubAvatar';
import GlassButton from '../../components/ui/GlassButton';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import PressableScale from '../../components/ui/PressableScale';
import { StitchBorder } from '../../components/ui/Stitch';
import { useClubFeed } from '../../hooks/useClubFeed';
import { useClubPal } from '../../hooks/useClubPal';
import { getClubChallenges, getClubMembers } from '../../services/supabase/clubs';
import { useClubStore } from '../../stores/clubStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Challenge, ClubMember } from '../../types/supabase';
import { colors, fonts, inkAlpha, paperFrameGradient, spacing } from '../../utils/constants';
import { clubSchedule } from '../../utils/clubs';
import { resolvePhotoSource } from '../../utils/profilePhoto';

/** L'onglet montre les dernières actus ; le reste est derrière « Tout voir » */
const FEED_PREVIEW = 4;
/** La bannière du book club, sous la barre d'état */
const BANNER = 150;

/** « 10 déc. » pour un jour « 2026-12-10 » */
function dayLabel(day: string | null): string {
  if (!day) return '';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ClubsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const { height } = useWindowDimensions();
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
  const schedule = clubSchedule(ready ? readings : []);
  const { current, next, past } = schedule;
  const mineCurrent = current ? myChallenges.find((c) => c.id === current.id) ?? null : null;
  const isAdmin = active.some((m) => m.user_id === myUserId && m.role === 'admin');
  // Le dernier livre fini (ou dont la date est passée) : « … c'est fait »
  const lastDone = current && schedule.ended ? current : past[0] ?? null;
  const { pal, toggleVote } = useClubPal(clubId);
  const propose = () => router.push('/book-search?for=club');
  const chooseNext = () => (pal.length > 0 ? router.push(`/club-next?id=${clubId}`) : propose());


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
          // Au milieu de l'écran, entre la barre d'état et la barre d'onglets
          <View style={[styles.emptyWrap, { minHeight: height - tabBarInset, paddingTop: insets.top }]}>
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

            {/* ── Ensuite : le prochain livre, déjà choisi ── */}
            {next && (
              <PressableScale
                style={styles.next}
                pressedScale={0.98}
                onPress={() => router.push(`/join/${next.invite_code}`)}
                accessibilityRole="button"
                accessibilityLabel={`Ensuite, ${next.book_title}, dès le ${dayLabel(next.starts_on)}`}
                accessibilityHint="Rejoindre cette lecture"
              >
                <StitchBorder radius={20} inset={0} color={inkAlpha(0.3)} />
                {next.cover_url ? <CoverImage uri={next.cover_url} style={styles.nextCover} /> : <View style={styles.nextCover} />}
                <View style={styles.nextText}>
                  <Text style={styles.metaText}>Ensuite</Text>
                  <Text style={styles.nextTitle} numberOfLines={1}>
                    {next.book_title}
                  </Text>
                </View>
                <Text style={styles.metaText}>dès le {dayLabel(next.starts_on)}</Text>
              </PressableScale>
            )}

            {/* ── Pas encore de livre : le premier ── */}
            {ready && readings.length === 0 && (
              <View style={styles.prompt}>
                <Text style={styles.promptTitle}>Votre premier livre</Text>
                <Text style={styles.metaText}>
                  {isAdmin ? 'Choisis-le, ou laisse le club proposer et voter' : 'Propose un livre, l’admin choisira'}
                </Text>
                <View style={styles.promptCtas}>
                  {isAdmin && (
                    <View style={styles.half}>
                      <Button3D variant="primary" onPress={chooseNext}>
                        Choisir
                      </Button3D>
                    </View>
                  )}
                  <View style={styles.half}>
                    <Button3D variant="secondary" onPress={propose}>
                      Proposer
                    </Button3D>
                  </View>
                </View>
              </View>
            )}

            {/* ── Livre fini, rien d'Ensuite : et maintenant ? ── */}
            {ready && schedule.ended && !next && lastDone && (
              <View style={styles.prompt}>
                <View style={styles.doneRow}>
                  {lastDone.cover_url ? <CoverImage uri={lastDone.cover_url} style={styles.nextCover} /> : null}
                  <Text style={styles.promptTitle} numberOfLines={2}>
                    {lastDone.book_title}, c’est fait
                  </Text>
                </View>
                {isAdmin ? (
                  <View style={styles.promptCtas}>
                    <View style={styles.half}>
                      <Button3D variant="primary" onPress={chooseNext}>
                        Et maintenant ?
                      </Button3D>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.metaText}>L’admin choisit la suite dans la PAL du club</Text>
                )}
              </View>
            )}

            {/* ── Seule pour l'instant : inviter ── */}
            {ready && active.length === 1 && (
              <View style={[styles.prompt, styles.alone]}>
                <View style={styles.nextText}>
                  <Text style={styles.nextTitle}>Seule pour l’instant</Text>
                  <Text style={styles.metaText}>Envoie le code à tes potes</Text>
                </View>
                <Button3D variant="secondary" size="small" onPress={() => router.push(`/club-invite?id=${clubId}`)}>
                  Inviter
                </Button3D>
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

            {/* ── À lire ensuite : la PAL du club ── */}
            {ready && (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.h2} accessibilityRole="header">
                    À lire ensuite
                  </Text>
                  <PressableScale
                    style={styles.seeAll}
                    onPress={() => router.push(`/club-pal?id=${clubId}`)}
                    accessibilityRole="button"
                    accessibilityLabel="PAL du club"
                  >
                    <Text style={styles.seeAllText}>PAL du club</Text>
                    <ChevronRightIcon size={16} color={colors.textTertiary} strokeWidth={2.4} />
                  </PressableScale>
                </View>
                <ClubPalRow pal={pal} myUserId={myUserId} onVote={toggleVote} onPropose={propose} side={spacing.lg} />
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
  emptyWrap: {
    justifyContent: 'center',
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
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
  },
  nextCover: {
    width: 32,
    height: 48,
    borderRadius: 2,
  },
  nextText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nextTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  prompt: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 24,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
    experimental_backgroundImage: `linear-gradient(180deg, ${paperFrameGradient[0]}, ${paperFrameGradient[1]})`,
  },
  promptTitle: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
  },
  promptCtas: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  half: {
    flex: 1,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  alone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
