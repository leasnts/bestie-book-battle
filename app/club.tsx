/**
 * Route /club — la page d'un club (#238), en plein écran, façon page de groupe.
 *
 *   ‹                                (…)
 *   ░░ bannière : les couvertures du club ░░
 *   (L)                                   le gros rond du club la chevauche
 *   Les Liseuses ⇅                        ⇅ : changer de club (si plusieurs)
 *   (◐◐◐) 5 membres · 3 lectures
 *   [ Inviter ]  [ Je lis aussi ]         « Je lis aussi » : si je ne lis pas
 *   Lecture   Étagère   Membres           encore la lecture en cours
 *
 * - Lecture : la lecture en cours du club ; la toucher la met sur l'accueil.
 * - Étagère : ses lectures passées, en grille, avec leur mois.
 * - Membres : la liste ; l'admin y accepte les demandes, nomme un admin,
 *   retire quelqu'un.
 *
 * `?id=` : le club ; sans, celui du livre de l'accueil. Ouverte par le rond de
 * l'accueil, l'onglet Clubs, ou « Le club » dans la fiche du livre.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon, ChevronsUpDownIcon, EllipsisIcon, MapPinIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../components/Button3D';
import { CoverImage } from '../components/ui/BookCover';
import ClubAvatar from '../components/ui/ClubAvatar';
import GlassButton from '../components/ui/GlassButton';
import GlassSection from '../components/ui/GlassSection';
import PressableScale from '../components/ui/PressableScale';
import { StitchLine } from '../components/ui/Stitch';
import {
  acceptClubMember,
  deleteClub,
  getClubChallenges,
  getClubMembers,
  makeClubAdmin,
  removeClubMember,
  updateClub,
} from '../services/supabase/clubs';
import { useAuthStore } from '../stores/authStore';
import { useClubStore } from '../stores/clubStore';
import { useProjectStore } from '../stores/projectStore';
import type { Challenge, ClubMember } from '../types/supabase';
import { accentGradient, colors, fonts, lowki, spacing } from '../utils/constants';
import { feel } from '../utils/feel';
import { nudge, oops } from '../utils/notice';
import { resolvePhotoSource } from '../utils/profilePhoto';

const BANNER = 210;
const AVATAR = 96;
const MEMBER = 40;
type Tab = 'reading' | 'shelf' | 'members';
const TABS: { key: Tab; label: string }[] = [
  { key: 'reading', label: 'Lecture' },
  { key: 'shelf', label: 'Étagère' },
  { key: 'members', label: 'Membres' },
];

/** « 11 déc. » */
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
/** « oct. 2026 » */
const monthOf = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

export default function ClubRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const activeClubId = useProjectStore((s) => s.activeChallenge?.club_id ?? null);
  const myChallenges = useProjectStore((s) => s.challenges);
  const setActiveChallenge = useProjectStore((s) => s.setActiveChallenge);
  const clubs = useClubStore((s) => s.clubs);
  const putClub = useClubStore((s) => s.putClub);
  const dropClub = useClubStore((s) => s.dropClub);

  const [id, setId] = useState(params.id ?? activeClubId ?? '');
  const [tab, setTab] = useState<Tab>('reading');
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [readings, setReadings] = useState<Challenge[]>([]);
  const club = clubs[id];

  const load = useCallback(() => {
    if (!id) return;
    getClubMembers(id).then(setMembers).catch((e) => console.warn('[Club] membres', e));
    getClubChallenges(id).then(setReadings).catch((e) => console.warn('[Club] lectures', e));
  }, [id]);
  useEffect(load, [load]);

  const active = members.filter((m) => m.status === 'active');
  const pending = members.filter((m) => m.status === 'pending');
  const isAdmin = active.some((m) => m.user_id === userId && m.role === 'admin');
  const current = readings.find((c) => c.status !== 'completed') ?? null;
  const past = readings.filter((c) => c !== current);
  // Je lis la lecture en cours si elle est dans mes lectures
  const mineCurrent = current ? myChallenges.find((c) => c.id === current.id) ?? null : null;

  const myClubs = useMemo(
    () => Object.values(clubs).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [clubs],
  );

  /** Une lecture que je lis : sur l'accueil ; une lecture en cours que je ne lis pas : la rejoindre */
  const openReading = (challenge: Challenge) => {
    const mine = myChallenges.find((c) => c.id === challenge.id);
    if (mine) {
      setActiveChallenge(mine);
      router.dismissTo('/');
    } else if (challenge.status !== 'completed') {
      router.push(`/join/${challenge.invite_code}`);
    }
  };

  const switchClub = () => {
    const options = [...myClubs.map((c) => c.name), 'Annuler'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: 'Mes clubs' },
      (i) => {
        const next = myClubs[i];
        if (!next || next.id === id) return;
        feel('tic');
        setMembers([]);
        setReadings([]);
        setTab('reading');
        setId(next.id);
      },
    );
  };

  const confirmDelete = () => {
    Alert.alert('Supprimer le club', 'Ses lectures restent, hors club', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteClub(id);
            dropClub(id);
            router.back();
          } catch (error) {
            oops('Club pas supprimé', error);
          }
        },
      },
    ]);
  };

  const confirmLeave = (memberId: string) => {
    const me = memberId === userId;
    const who = members.find((m) => m.user_id === memberId)?.user.first_name ?? '';
    Alert.alert(me ? 'Quitter le club' : `Retirer ${who}`, me ? undefined : 'La lecture en cours du club aussi', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: me ? 'Quitter' : 'Retirer',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeClubMember(id, memberId);
            if (me) {
              dropClub(id);
              router.back();
            } else load();
          } catch (error) {
            oops(me ? 'Club pas quitté' : 'Pas retiré', error);
          }
        },
      },
    ]);
  };

  const handleMenu = () => {
    if (!club) return;
    if (!isAdmin) {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Quitter le club', 'Annuler'], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
        (i) => {
          if (i === 0 && userId) confirmLeave(userId);
        },
      );
      return;
    }
    const open = club.join_mode === 'open';
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Modifier le club', open ? 'Rejoindre sur demande' : 'Rejoindre avec le lien', 'Supprimer le club', 'Annuler'],
        destructiveButtonIndex: 2,
        cancelButtonIndex: 3,
      },
      async (i) => {
        if (i === 0) router.push(`/club-edit?id=${id}&from=club`);
        if (i === 1) {
          try {
            putClub(await updateClub(id, { join_mode: open ? 'request' : 'open' }));
            nudge(open ? 'Sur demande' : 'Avec le lien', open ? 'Tu valides chaque arrivée' : 'Le lien suffit pour entrer');
          } catch (error) {
            oops('Pas changé', error);
          }
        }
        if (i === 2) confirmDelete();
      },
    );
  };

  const memberMenu = (m: ClubMember) => {
    if (!isAdmin || m.user_id === userId) return;
    const options = [...(m.role === 'admin' ? [] : ['Nommer admin']), 'Retirer du club', 'Annuler'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, destructiveButtonIndex: options.length - 2, cancelButtonIndex: options.length - 1, title: m.user.first_name },
      async (i) => {
        if (options[i] === 'Nommer admin') {
          try {
            await makeClubAdmin(id, m.user_id);
            load();
          } catch (error) {
            oops('Pas nommé', error);
          }
        }
        if (options[i] === 'Retirer du club') confirmLeave(m.user_id);
      },
    );
  };

  const answer = async (m: ClubMember, accept: boolean) => {
    try {
      if (accept) await acceptClubMember(id, m.user_id);
      else await removeClubMember(id, m.user_id);
      feel('tic');
      load();
    } catch (error) {
      oops('Pas enregistré', error);
    }
  };

  if (!club) return <View style={styles.screen} />;

  const covers = readings.map((c) => c.cover_url).filter((u): u is string => !!u).slice(0, 6);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }} showsVerticalScrollIndicator={false}>
        {/* ── Bannière : les couvertures du club, de travers, sous un voile chocolat ── */}
        <View style={[styles.banner, { height: BANNER + insets.top }]}>
          <LinearGradient colors={[lowki.chocolate.light, lowki.chocolate.dark]} style={StyleSheet.absoluteFill} />
          <View style={styles.mosaic}>
            {covers.map((uri, i) => (
              <Image key={`${uri}-${i}`} source={{ uri }} style={styles.mosaicCover} contentFit="cover" />
            ))}
          </View>
          <LinearGradient colors={['rgba(46,27,22,0.15)', 'rgba(46,27,22,0.6)']} style={StyleSheet.absoluteFill} />
        </View>

        <View style={styles.body}>
          <View style={styles.avatarRing}>
            <ClubAvatar club={club} size={AVATAR} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {club.name}
            </Text>
            {myClubs.length > 1 && (
              <GlassButton icon={ChevronsUpDownIcon} onPress={switchClub} accessibilityLabel="Changer de club" />
            )}
          </View>

          <View style={styles.meta}>
            <View style={styles.stack}>
              {active.slice(0, 4).map((m, i) => (
                <Image key={m.user_id} source={resolvePhotoSource(m.user.profile_photo_url)} style={[styles.mini, i > 0 && styles.miniOver]} />
              ))}
            </View>
            <Text style={styles.metaText}>
              {active.length} membre{active.length > 1 ? 's' : ''}
              {readings.length > 0 ? ` · ${readings.length} lecture${readings.length > 1 ? 's' : ''}` : ''}
            </Text>
          </View>

          <View style={styles.ctas}>
            <View style={styles.cta}>
              <Button3D variant="primary" onPress={() => router.push(`/club-invite?id=${id}`)}>
                Inviter
              </Button3D>
            </View>
            {current && !mineCurrent && (
              <View style={styles.cta}>
                <Button3D variant="secondary" onPress={() => router.push(`/join/${current.invite_code}`)}>
                  Je lis aussi
                </Button3D>
              </View>
            )}
          </View>

          {/* ── Onglets ── */}
          <View style={styles.tabs} accessibilityRole="tablist">
            {TABS.map((t) => {
              const on = t.key === tab;
              return (
                <PressableScale
                  key={t.key}
                  style={styles.tab}
                  pressedScale={0.96}
                  onPress={() => {
                    if (!on) feel('tic');
                    setTab(t.key);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>
                    {t.label}
                    {t.key === 'members' && isAdmin && pending.length > 0 ? ` · ${pending.length}` : ''}
                  </Text>
                  {on && <LinearGradient colors={accentGradient} style={styles.tabBar} />}
                </PressableScale>
              );
            })}
          </View>

          {tab === 'reading' &&
            (current ? (
              <GlassSection paper onPress={() => openReading(current)} accessibilityLabel={`${current.book_title}, lecture en cours`}>
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
                      <Text style={styles.fact}>club à {Math.round(current.average_progress_percentage ?? 0)} %</Text>
                      {current.target_end_date && (
                        <View style={styles.meet}>
                          <MapPinIcon size={14} color={colors.textTertiary} strokeWidth={2} />
                          <Text style={styles.fact}>{shortDate(current.target_end_date)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </GlassSection>
            ) : (
              <Text style={styles.empty}>Pas de lecture en cours</Text>
            ))}

          {tab === 'shelf' &&
            (past.length > 0 ? (
              <View style={styles.grid}>
                {past.map((c) => (
                  <PressableScale
                    key={c.id}
                    style={styles.gridItem}
                    pressedScale={0.96}
                    onPress={() => openReading(c)}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.book_title}, ${monthOf(c.created_at)}`}
                  >
                    {c.cover_url ? <CoverImage uri={c.cover_url} style={styles.gridCover} /> : <View style={styles.gridCover} />}
                    <Text style={styles.gridMonth}>{monthOf(c.created_at)}</Text>
                  </PressableScale>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>Rien sur l'étagère pour l'instant</Text>
            ))}

          {tab === 'members' && (
            <View>
              {isAdmin &&
                pending.map((m) => (
                  <View key={m.user_id} style={styles.member}>
                    <Image source={resolvePhotoSource(m.user.profile_photo_url)} style={styles.avatar} />
                    <Text style={styles.memberName} numberOfLines={1}>
                      {m.user.first_name}
                    </Text>
                    <PressableScale
                      style={styles.answer}
                      onPress={() => answer(m, false)}
                      accessibilityRole="button"
                      accessibilityLabel={`Refuser ${m.user.first_name}`}
                    >
                      <Text style={styles.answerNo}>Refuser</Text>
                    </PressableScale>
                    <PressableScale
                      style={[styles.answer, styles.answerYesBox]}
                      onPress={() => answer(m, true)}
                      accessibilityRole="button"
                      accessibilityLabel={`Accepter ${m.user.first_name}`}
                    >
                      <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
                      <Text style={styles.answerYes}>Accepter</Text>
                    </PressableScale>
                  </View>
                ))}
              {active.map((m, i) => {
                const canManage = isAdmin && m.user_id !== userId;
                return (
                  <View key={m.user_id}>
                    {(i > 0 || (isAdmin && pending.length > 0)) && <StitchLine />}
                    <PressableScale
                      style={styles.member}
                      pressedScale={canManage ? 0.98 : 1}
                      onPress={() => memberMenu(m)}
                      accessibilityRole={canManage ? 'button' : 'text'}
                    >
                      <Image source={resolvePhotoSource(m.user.profile_photo_url)} style={styles.avatar} />
                      <Text style={styles.memberName} numberOfLines={1}>
                        {m.user_id === userId ? 'Moi' : m.user.first_name}
                      </Text>
                      {m.role === 'admin' && <Text style={styles.role}>admin</Text>}
                    </PressableScale>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Retour et menu, posés sur la bannière */}
      <View style={[styles.nav, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <GlassButton icon={ChevronLeftIcon} onPress={() => router.back()} accessibilityLabel="Retour" />
        <GlassButton icon={EllipsisIcon} onPress={handleMenu} accessibilityLabel="Plus d'options" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  banner: {
    overflow: 'hidden',
  },
  mosaic: {
    position: 'absolute',
    top: -30,
    left: -40,
    right: -40,
    flexDirection: 'row',
    gap: 10,
    transform: [{ rotate: '-8deg' }],
    opacity: 0.85,
  },
  mosaicCover: {
    width: 128,
    height: 192,
    borderRadius: 3,
  },
  nav: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  body: {
    paddingHorizontal: spacing.lg,
    marginTop: -AVATAR / 2,
  },
  // Le rond du club chevauche la bannière, cerclé du fond de la page
  avatarRing: {
    alignSelf: 'flex-start',
    borderRadius: AVATAR / 2 + 4,
    borderWidth: 4,
    borderColor: colors.bgApp,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stack: {
    flexDirection: 'row',
  },
  mini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.bgApp,
  },
  miniOver: {
    marginLeft: -8,
  },
  metaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textTertiary,
  },
  ctas: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cta: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingBottom: spacing.sm,
    minHeight: 44,
    justifyContent: 'flex-end',
  },
  tabLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textTertiary,
  },
  tabLabelOn: {
    color: colors.textPrimary,
  },
  // Le trait sous l'onglet choisi : rouge en dégradé, comme toute surface pleine
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 3,
    borderRadius: 2,
  },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cover: {
    width: 70,
    height: 100,
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
  empty: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '30%',
    gap: 6,
  },
  gridCover: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 3,
  },
  gridMonth: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
  },
  avatar: {
    width: MEMBER,
    height: MEMBER,
    borderRadius: MEMBER / 2,
  },
  memberName: {
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
  answer: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  answerYesBox: {
    marginLeft: spacing.xs,
  },
  answerNo: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textTertiary,
  },
  answerYes: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.white,
  },
});
