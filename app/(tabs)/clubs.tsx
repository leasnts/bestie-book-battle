/**
 * Onglet Clubs (#238, #246) : la maison du club, et ses actus.
 *
 *   (TC) (LL) (HL) (+)                    2 clubs ou plus : on change ici
 *   (TC) Test club ›            (👤+)     le club → sa page (membres, réglages)
 *        (◐◐◐) 5 membres                  👤+ : inviter
 *   ┌[couv] Les Sœurs Blue ───────────┐
 *   │       club à 54 % · J-12        │   la lecture en cours du club
 *   │   [ Rejoindre la lecture ]      │   si je ne la lis pas encore
 *   └─────────────────────────────────┘
 *   Ça bouge                              le fil : notes, caps, fini, arrivées
 *   Déjà lus ensemble                     les lectures passées
 *
 * Un seul club : il s'ouvre tout de suite, pas une liste d'une ligne (Lea,
 * 2026-11-27). Sans club : de quoi en créer un ou en rejoindre un.
 */

import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRightIcon, MapPinIcon, PlusIcon, UserPlusIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import ClubFeed from '../../components/club/ClubFeed';
import PageTransition from '../../components/PageTransition';
import { CoverImage } from '../../components/ui/BookCover';
import ClubAvatar from '../../components/ui/ClubAvatar';
import GlassButton from '../../components/ui/GlassButton';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import PressableScale from '../../components/ui/PressableScale';
import { StitchLine } from '../../components/ui/Stitch';
import {
  addReaction,
  getAnnotationsByIds,
  removeReaction,
  type AnnotationWithAuthor,
} from '../../services/supabase/annotations';
import {
  addFeedReaction,
  getClubChallenges,
  getClubFeed,
  getClubMembers,
  getClubReadingTrack,
  removeFeedReaction,
} from '../../services/supabase/clubs';
import { useAuthStore } from '../../stores/authStore';
import { useClubStore } from '../../stores/clubStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Challenge, ClubFeedItem, ClubMember } from '../../types/supabase';
import { borderRadius, colors, creamAlpha, fonts, spacing } from '../../utils/constants';
import { extractCoverPalette, inkBandOf, type CoverPalette } from '../../utils/coverPalette';
import { feel } from '../../utils/feel';
import { oops } from '../../utils/notice';
import { resolvePhotoSource } from '../../utils/profilePhoto';

const ROUND = 56;
const TRACK_AVATAR = 28;

/** « 9 déc. » */
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/** « J-12 » avant la fin de la lecture, rien sans date */
function countdown(end: string | null): string | null {
  if (!end) return null;
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(new Date(end)) - day(new Date())) / 86400000);
  return days >= 0 ? `J-${days}` : `J+${-days}`;
}

/** Ajouter ou retirer ma réaction dans une liste, sans attendre la base */
function toggleIn<T extends { user_id: string; emoji: string }>(list: T[], me: string, emoji: string, make: () => T) {
  const mine = list.some((r) => r.user_id === me && r.emoji === emoji);
  return { mine, next: mine ? list.filter((r) => !(r.user_id === me && r.emoji === emoji)) : [...list, make()] };
}

export default function ClubsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const userId = useAuthStore((s) => s.user?.id);
  const clubs = useClubStore((s) => s.clubs);
  const myChallenges = useProjectStore((s) => s.challenges);
  const activeClubId = useProjectStore((s) => s.activeChallenge?.club_id ?? null);
  const setActiveChallenge = useProjectStore((s) => s.setActiveChallenge);

  const myClubs = useMemo(
    () => Object.values(clubs).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [clubs],
  );
  const [picked, setPicked] = useState<string | null>(null);
  // Le club choisi ; sinon celui du livre de l'accueil ; sinon le plus récent
  const clubId =
    (picked && clubs[picked] ? picked : null) ?? (activeClubId && clubs[activeClubId] ? activeClubId : null) ?? myClubs[0]?.id ?? null;
  const club = clubId ? clubs[clubId] : null;

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [readings, setReadings] = useState<Challenge[]>([]);
  const [feed, setFeed] = useState<ClubFeedItem[]>([]);
  const [notes, setNotes] = useState<Record<string, AnnotationWithAuthor>>({});
  const [track, setTrack] = useState<Awaited<ReturnType<typeof getClubReadingTrack>>>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    try {
      const [m, r, f] = await Promise.all([getClubMembers(id), getClubChallenges(id), getClubFeed(id)]);
      const open = f.filter((i) => i.kind === 'note' && !i.locked && i.annotation_id).map((i) => i.annotation_id!);
      const reading = r.find((c) => c.status !== 'completed');
      const [list, t] = await Promise.all([
        getAnnotationsByIds(open),
        reading ? getClubReadingTrack(reading.id) : Promise.resolve([]),
      ]);
      setTrack(t);
      setMembers(m);
      setReadings(r);
      setFeed(f);
      setNotes(Object.fromEntries(list.map((n) => [n.id, n])));
      setLoadedFor(id);
    } catch (error) {
      console.warn('[Clubs] fil', error);
    }
  }, []);

  // À chaque retour sur l'onglet : le fil bouge pendant qu'on est ailleurs
  useFocusEffect(
    useCallback(() => {
      if (clubId) load(clubId);
    }, [clubId, load]),
  );

  // Changer de club : on n'affiche pas les actus de l'autre en attendant
  const ready = loadedFor === clubId;
  const active = ready ? members.filter((m) => m.status === 'active') : [];
  const current = ready ? readings.find((c) => c.status !== 'completed') ?? null : null;
  const past = ready ? readings.filter((c) => c.status === 'completed') : [];
  const mineCurrent = current ? myChallenges.find((c) => c.id === current.id) ?? null : null;

  // La couleur du livre en cours : sa palette, ou tirée de sa couverture si
  // personne ne l'a encore calculée
  const [extracted, setExtracted] = useState<{ url: string; palette: CoverPalette } | null>(null);
  const coverUrl = current?.cover_url ?? null;
  const stored = (current?.cover_palette as CoverPalette | null | undefined) ?? null;
  useEffect(() => {
    if (stored?.length || !coverUrl || extracted?.url === coverUrl) return;
    extractCoverPalette(coverUrl)
      .then((palette) => setExtracted({ url: coverUrl, palette }))
      .catch(() => {});
  }, [coverUrl, stored, extracted?.url]);
  const band = inkBandOf(stored?.length ? stored : extracted?.url === coverUrl ? extracted.palette : null);

  const pickClub = (id: string) => {
    if (id === clubId) return;
    feel('tic');
    setPicked(id);
  };

  const addClub = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Créer un club', 'Rejoindre avec un code', 'Annuler'], cancelButtonIndex: 2 },
      (i) => {
        if (i === 0) router.push('/club-edit');
        if (i === 1) router.push('/club-code');
      },
    );

  const openCurrent = () => {
    if (!current) return;
    if (mineCurrent) {
      setActiveChallenge(mineCurrent);
      router.navigate('/(tabs)');
    } else {
      router.push(`/join/${current.invite_code}`);
    }
  };

  const toggleNoteReaction = async (note: AnnotationWithAuthor, emoji: string) => {
    if (!userId) return;
    const { mine, next } = toggleIn(note.reactions, userId, emoji, () => ({
      annotation_id: note.id,
      user_id: userId,
      emoji,
      created_at: new Date().toISOString(),
    }));
    setNotes((prev) => ({ ...prev, [note.id]: { ...note, reactions: next } }));
    try {
      if (mine) await removeReaction(note.id, userId, emoji);
      else await addReaction(note.id, userId, emoji);
    } catch (error) {
      setNotes((prev) => ({ ...prev, [note.id]: note }));
      oops('Réaction pas posée', error);
    }
  };

  const toggleReaction = async (item: ClubFeedItem, emoji: string) => {
    if (!userId || !clubId) return;
    const { mine, next } = toggleIn(item.reactions ?? [], userId, emoji, () => ({
      user_id: userId,
      emoji,
      created_at: new Date().toISOString(),
    }));
    const swap = (reactions: ClubFeedItem['reactions']) =>
      setFeed((prev) => prev.map((i) => (i.event_key === item.event_key ? { ...i, reactions } : i)));
    swap(next);
    try {
      if (mine) await removeFeedReaction(clubId, item.event_key, userId, emoji);
      else await addFeedReaction(clubId, item.event_key, userId, emoji);
    } catch (error) {
      swap(item.reactions);
      oops('Réaction pas posée', error);
    }
  };



  return (
    <PageTransition>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: tabBarInset + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {!club ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Lis à plusieurs, livre après livre</Text>
            <Button3D variant="primary" onPress={() => router.push('/club-edit')}>
              Créer un club
            </Button3D>
            <Button3D variant="secondary" onPress={() => router.push('/club-code')}>
              J'ai un code
            </Button3D>
          </View>
        ) : (
          <>
            {/* ── Mes clubs : une rangée de ronds pour changer (2 ou plus) ── */}
            {myClubs.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.roundsScroll}
                contentContainerStyle={styles.rounds}
              >
                {myClubs.map((c) => {
                  const on = c.id === clubId;
                  return (
                    <PressableScale
                      key={c.id}
                      style={styles.roundItem}
                      pressedScale={0.94}
                      onPress={() => pickClub(c.id)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={c.name}
                    >
                      <View style={[styles.ring, on && styles.ringOn]}>
                        <ClubAvatar club={c} size={ROUND} />
                      </View>
                      <Text style={[styles.roundName, on && styles.roundNameOn]} numberOfLines={1}>
                        {c.name}
                      </Text>
                    </PressableScale>
                  );
                })}
                <View style={styles.roundAdd}>
                  <GlassButton icon={PlusIcon} onPress={addClub} accessibilityLabel="Créer ou rejoindre un club" />
                </View>
              </ScrollView>
            )}

            {/* ── Le club : toucher son nom ouvre sa page ── */}
            <View style={styles.header}>
              <PressableScale
                style={styles.identity}
                pressedScale={0.98}
                onPress={() => router.push(`/club?id=${club.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${club.name}, ${active.length} membres`}
                accessibilityHint="Ouvre la page du club"
              >
                <ClubAvatar club={club} size={52} />
                <View style={styles.identityText}>
                  <View style={styles.nameRow}>
                    <Text style={styles.clubName} numberOfLines={1}>
                      {club.name}
                    </Text>
                    <ChevronRightIcon size={18} color={colors.textTertiary} strokeWidth={2.4} />
                  </View>
                  {active.length > 0 && (
                    <View style={styles.meta}>
                      <View style={styles.stack}>
                        {active.slice(0, 4).map((m, i) => (
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
                    </View>
                  )}
                </View>
              </PressableScale>
              <GlassButton
                icon={UserPlusIcon}
                onPress={() => router.push(`/club-invite?id=${club.id}`)}
                accessibilityLabel="Inviter"
              />
              {myClubs.length === 1 && (
                <GlassButton icon={PlusIcon} onPress={addClub} accessibilityLabel="Créer ou rejoindre un club" />
              )}
            </View>

            {/* ── La lecture en cours, en grand, à la couleur du livre ── */}
            {current && (
              <PressableScale
                style={styles.reading}
                pressedScale={mineCurrent ? 0.98 : 1}
                onPress={mineCurrent ? openCurrent : undefined}
                accessibilityRole={mineCurrent ? 'button' : undefined}
                accessibilityLabel={`On lit ${current.book_title}, club à ${Math.round(current.average_progress_percentage ?? 0)} %`}
                accessibilityHint={mineCurrent ? 'Le met sur l’accueil' : undefined}
              >
                <LinearGradient colors={band} style={StyleSheet.absoluteFill} />
                <View style={styles.readingTop}>
                  {current.cover_url ? (
                    <CoverImage uri={current.cover_url} style={styles.readingCover} />
                  ) : (
                    <View style={styles.readingCover} />
                  )}
                  <View style={styles.readingText}>
                    <Text style={styles.onLit}>On lit</Text>
                    <Text style={styles.readingTitle} numberOfLines={3}>
                      {current.book_title}
                    </Text>
                    {current.book_author && (
                      <Text style={styles.readingAuthor} numberOfLines={1}>
                        {current.book_author}
                      </Text>
                    )}
                    <View style={styles.spacer} />
                    {current.target_end_date && (
                      <View style={styles.meet}>
                        <MapPinIcon size={15} color={colors.white} strokeWidth={2.2} />
                        <Text style={styles.readingMeta}>Rencontre {shortDate(current.target_end_date)}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* La piste : chaque lecteur à son %, cousu jusqu'à la moyenne du club */}
                {track.length > 0 && (
                  <View style={styles.track}>
                    <StitchLine color={creamAlpha(0.45)} style={styles.trackLine} />
                    <View style={[styles.trackDone, { width: `${Math.min(100, current.average_progress_percentage ?? 0)}%` }]}>
                      <StitchLine color={colors.white} />
                    </View>
                    {track.map((p, i) => (
                      <Image
                        key={p.user_id}
                        source={resolvePhotoSource(p.profile_photo_url)}
                        style={[
                          styles.trackAvatar,
                          { left: `${Math.min(100, p.percent)}%`, top: i % 2 === 0 ? 0 : TRACK_AVATAR + 2 },
                        ]}
                        accessibilityLabel={`${p.first_name ?? ''} à ${Math.round(p.percent)} %`}
                      />
                    ))}
                  </View>
                )}
                <View style={styles.trackLegend}>
                  <Text style={styles.readingMeta}>Club à {Math.round(current.average_progress_percentage ?? 0)} %</Text>
                  {countdown(current.target_end_date) && (
                    <Text style={styles.readingMeta}>{countdown(current.target_end_date)}</Text>
                  )}
                </View>

                {!mineCurrent && (
                  <View style={styles.readingCta}>
                    <Button3D variant="secondary" onPress={openCurrent}>
                      Rejoindre la lecture
                    </Button3D>
                  </View>
                )}
              </PressableScale>
            )}

            {/* ── Ça bouge ── */}
            {ready && feed.length > 0 && (
              <>
                <Text style={styles.h2} accessibilityRole="header">
                  Ça bouge
                </Text>
                <ClubFeed
                  items={feed}
                  notes={notes}
                  myUserId={userId}
                  currentChallengeId={current?.id ?? null}
                  onToggleNoteReaction={toggleNoteReaction}
                  onToggleReaction={toggleReaction}
                />
              </>
            )}

            {/* ── Déjà lus ensemble ── */}
            {past.length > 0 && (
              <>
                <Text style={styles.h2} accessibilityRole="header">
                  Déjà lus ensemble
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.shelfScroll}
                  contentContainerStyle={styles.shelf}
                >
                  {past.map((c) => (
                    <View key={c.id} style={styles.shelfItem} accessible accessibilityLabel={c.book_title}>
                      {c.cover_url ? <CoverImage uri={c.cover_url} style={styles.shelfCover} /> : <View style={styles.shelfCover} />}
                      <Text style={styles.shelfMonth}>
                        {new Date(c.completed_at ?? c.created_at).toLocaleDateString('fr-FR', { month: 'short' })}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
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
  // Les ronds débordent jusqu'aux bords de l'écran
  roundsScroll: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
  },
  rounds: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  roundItem: {
    width: ROUND + 12,
    alignItems: 'center',
    gap: spacing.xs,
  },
  ring: {
    padding: 3,
    borderRadius: (ROUND + 10) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ringOn: {
    borderColor: colors.accent,
  },
  roundName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  roundNameOn: {
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  roundAdd: {
    height: ROUND + 10,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  clubName: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  reading: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  readingTop: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  readingCover: {
    width: 104,
    height: 156,
    borderRadius: borderRadius.xs,
  },
  readingText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  onLit: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.white,
  },
  readingTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
    color: colors.white,
  },
  readingAuthor: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  spacer: {
    flex: 1,
  },
  meet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readingMeta: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.white,
  },
  // Les ronds se posent sur le fil, un sur deux au-dessus et en dessous
  track: {
    height: TRACK_AVATAR * 2 + 2,
    marginTop: spacing.lg,
    marginHorizontal: TRACK_AVATAR / 2,
  },
  trackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TRACK_AVATAR,
  },
  trackDone: {
    position: 'absolute',
    left: 0,
    top: TRACK_AVATAR,
    overflow: 'hidden',
  },
  trackAvatar: {
    position: 'absolute',
    width: TRACK_AVATAR,
    height: TRACK_AVATAR,
    borderRadius: TRACK_AVATAR / 2,
    marginLeft: -TRACK_AVATAR / 2,
    borderWidth: 2,
    borderColor: creamAlpha(0.9),
  },
  trackLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  readingCta: {
    marginTop: spacing.lg,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
  },
  shelfScroll: {
    marginHorizontal: -spacing.lg,
  },
  shelf: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  shelfItem: {
    width: 78,
    gap: spacing.xs,
  },
  shelfCover: {
    width: 78,
    height: 117,
    borderRadius: borderRadius.xs,
  },
  shelfMonth: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  empty: {
    gap: spacing.md,
    marginTop: spacing['3xl'],
  },
  emptyText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
