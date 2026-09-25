/**
 * Route /book — la fiche du livre, en sheet iOS natif.
 *
 * C'est ce que le cadre « Le livre » de l'accueil ouvre d'un toucher. Elle
 * remplace le menu ⋮ de l'ancienne carte et ses deux modales maison : tout ce
 * qui se règle sur un livre vit ici.
 *
 * - **Fin** : la date, les jours restants, et de quoi la changer.
 * - **Caps** : le cap en cours, les caps passés avec combien de membres les
 *   avaient atteints **à leur date** (la progression d'aujourd'hui ne dirait
 *   rien d'un cap d'il y a deux semaines). Les pages sont affichées dans **mon**
 *   édition : un cap est enregistré en %, il ne tombe pas à la même page pour
 *   tout le monde.
 * - **Club** : les membres, le code d'invitation, le partage.
 * - Modifier le livre, et le quitter.
 *
 * Présentation : `formSheet` déclaré dans `app/_layout.tsx` (recette de #33).
 * La ScrollView est l'enfant DIRECT de l'écran, sans View intermédiaire, sinon
 * react-native-screens calcule mal les marges du sheet.
 */

import { useRouter } from 'expo-router';
import {
  EllipsisIcon,
  FlagIcon,
  PlusIcon,
  UsersIcon,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import DeadlineEditSheet from '../components/ui/DeadlineEditSheet';
import EditBookSheet from '../components/ui/EditBookSheet';
import GoalFormSheet from '../components/ui/GoalFormSheet';
import BookBento from '../components/ui/BookBento';
import BookSpine from '../components/ui/BookSpine';
import GlassButton from '../components/ui/GlassButton';
import { CapDot } from '../components/ui/GoalTrack';
import { SHEET_TOP_INSET } from '../components/ui/SheetHeader';
import { myCoverUrl } from '../services/myEdition';
import { getChallengeHistory } from '../services/supabase/database';
import { uploadBookCover } from '../services/supabase/storage';
import { useFitSheet } from '../hooks/useFitSheet';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import type { ChallengeGoal, ProgressHistory } from '../types/supabase';
import {
  borderRadius,
  colors,
  fonts,
  inkAlpha,
  shadows,
  spacing,
} from '../utils/constants';
import { extractCoverPalette, type CoverPalette } from '../utils/coverPalette';
import {
  buildCaps,
  countAtCap,
  countAtCapOnDate,
  daysLeft,
  formatTrackDate,
  median,
  type TrackCap,
} from '../utils/track';

export default function BookRoute() {
  const router = useRouter();
  // Le sheet s'ouvre à la hauteur de toute la fiche, plafonné sous l'en-tête de l'accueil
  // Sans barre ni titre : la couverture et le titre du livre suffisent
  const fit = useFitSheet({ withBar: false });
  const { user } = useAuthStore();
  const {
    activeChallenge,
    challenges,
    updateActiveChallenge,
    leaveActiveChallenge,
    loadUserChallenges,
  } = useProjectStore();
  const { participants, saveMyEdition } = useProgressStore();
  const { secondaryGoal, history: goalHistory, addGoal, editGoal } = useGoalStore();

  const [deadlineVisible, setDeadlineVisible] = useState(false);
  const [editBookVisible, setEditBookVisible] = useState(false);
  /** Le cap qu'on modifie, ou `null` pour en ajouter un */
  const [capForm, setCapForm] = useState<{ open: boolean; goal: ChallengeGoal | null }>({
    open: false,
    goal: null,
  });
  const [clubHistory, setClubHistory] = useState<ProgressHistory[]>([]);

  const challengeId = activeChallenge?.id;
  const referencePages = activeChallenge?.total_pages ?? 0;

  // L'historique du club sert à dater les caps passés (« x/y » à leur date)
  useEffect(() => {
    if (!challengeId) return;
    getChallengeHistory(challengeId)
      .then(setClubHistory)
      .catch((error) => console.warn('[Fiche du livre] historique indisponible', error));
  }, [challengeId]);

  const goals = useMemo(
    () => [secondaryGoal, ...goalHistory],
    [secondaryGoal, goalHistory],
  );
  const caps = useMemo(
    () => buildCaps(goals, referencePages).slice().reverse(),
    [goals, referencePages],
  );
  const goalById = useMemo(() => {
    const map = new Map<string, ChallengeGoal>();
    for (const goal of goals) if (goal) map.set(goal.id, goal);
    return map;
  }, [goals]);

  /** Ma progression sur ce livre : mon édition (pages, couverture) */
  const mine = useMemo(
    () => participants.find((p) => p.user.id === user?.id)?.progress,
    [participants, user?.id],
  );
  /** Mon édition, pour convertir les caps en pages qui me parlent */
  const myPages = mine?.total_pages ?? referencePages;
  /** La personne qui a créé le bbb règle le livre ; les autres, leur édition */
  const isAdmin = !!user?.id && activeChallenge?.admin_id === user.id;

  /** Le nombre de pages de chacun, pour compter qui avait atteint un cap */
  const editions = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of participants) {
      map[p.user.id] = p.progress.total_pages ?? referencePages;
    }
    return map;
  }, [participants, referencePages]);

  const percentages = participants.map((p) => p.percentage || 0);
  /** Pour colorer les ronds des caps comme sur la piste de l'accueil */
  const myPercent = participants.find((p) => p.user.id === user?.id)?.percentage ?? 0;
  const clubPercent = median(percentages);
  /** Mes co-lectrices et co-lecteurs, les plus avancés d'abord, pour les avatars */
  const members = useMemo(
    () =>
      participants
        .slice()
        .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
        .map((p) => ({ id: p.user.id, photoUrl: p.user.profile_photo_url })),
    [participants],
  );
  const memberCount = participants.length;

  const remaining = daysLeft(activeChallenge?.target_end_date);

  // ─── Actions ────────────────────────────────────────────────────

  const handleSaveDeadline = useCallback(
    async (date: Date) => {
      await updateActiveChallenge({ target_end_date: date.toISOString() });
    },
    [updateActiveChallenge],
  );

  const handleSaveCap = useCallback(
    async (type: 'primary' | 'secondary', targetPages: number, deadline: Date) => {
      if (!activeChallenge || !user?.id) return;

      if (type === 'primary') {
        await updateActiveChallenge({ target_end_date: deadline.toISOString() });
      } else {
        // La baseline sert à mesurer le chemin parcouru depuis la pose du cap
        const baseline =
          participants.length > 0
            ? Math.round(
                participants.reduce((sum, p) => sum + (p.progress?.current_page ?? 0), 0) /
                  participants.length,
              )
            : 0;
        const edited = capForm.goal;

        if (edited) {
          await editGoal(edited.id, {
            target_pages: targetPages,
            deadline: deadline.toISOString(),
            results: { baseline },
          });
        } else {
          await addGoal({
            challenge_id: activeChallenge.id,
            type: 'secondary',
            target_pages: targetPages,
            deadline: deadline.toISOString(),
            created_by: user.id,
            results: { baseline },
          });
        }
      }
      setCapForm({ open: false, goal: null });
    },
    [activeChallenge, user?.id, participants, capForm.goal, addGoal, editGoal, updateActiveChallenge],
  );

  const handleSaveBook = useCallback(
    async (data: { title: string; author: string; totalPages: number; coverUri?: string }) => {
      if (!activeChallenge || !user?.id) return;

      // Mes pages, dans tous les cas : c'est ma progression qui en dépend
      if (data.totalPages !== myPages) {
        await saveMyEdition(activeChallenge.id, user.id, { totalPages: data.totalPages });
      }

      if (!isAdmin) {
        // Membre : sa couverture ne change que la sienne
        if (data.coverUri) {
          await saveMyEdition(activeChallenge.id, user.id, { cover: data.coverUri });
        }
        return;
      }

      // Admin : son édition est celle de référence du bbb (celle que voient les
      // invitées). Nouvelle couverture : upload et couleurs du fond en
      // parallèle. Si l'extraction échoue, la base efface l'ancienne palette et
      // l'accueil la recalcule (useCoverPalette).
      let coverUrl = activeChallenge.cover_url;
      let newPalette: CoverPalette | undefined;
      if (data.coverUri) {
        const [{ url }, palette] = await Promise.all([
          uploadBookCover(activeChallenge.id, data.coverUri),
          extractCoverPalette(data.coverUri).catch(() => undefined),
        ]);
        coverUrl = url;
        newPalette = palette;
      }

      await updateActiveChallenge({
        book_title: data.title,
        book_author: data.author,
        total_pages: data.totalPages,
        cover_url: coverUrl,
        ...(newPalette && { cover_palette: newPalette }),
      });

      await loadUserChallenges(user.id);
    },
    [activeChallenge, user?.id, myPages, isAdmin, saveMyEdition, updateActiveChallenge, loadUserChallenges],
  );

  const handleShareInvite = useCallback(async () => {
    if (!activeChallenge?.invite_code) return;
    try {
      await Share.share({
        message: `Rejoins-moi pour lire « ${activeChallenge.book_title} » sur bestiebookbattle !\n\nCode d'invitation : ${activeChallenge.invite_code.split('').join(' ')}`,
      });
    } catch {
      // partage annulé
    }
  }, [activeChallenge]);

  const handleLeave = useCallback(() => {
    if (!activeChallenge || !user?.id) return;
    Alert.alert(
      'Quitter le livre',
      `Tu veux retirer « ${activeChallenge.book_title} » de ta bibliothèque ? Tu pourras le rejoindre plus tard avec le code.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              const remainingBooks = challenges.filter((c) => c.id !== activeChallenge.id);
              await leaveActiveChallenge(user.id);
              router.back();
              if (remainingBooks.length === 0) {
                router.push({
                  pathname: '/onboarding/role',
                  params: { firstName: user.first_name || 'Lecteur', addChallenge: 'true' },
                });
              }
            } catch (error) {
              console.error('Erreur en quittant le livre:', error);
              Alert.alert('Erreur', 'Impossible de quitter ce livre. Réessaie.');
            }
          },
        },
      ],
    );
  }, [activeChallenge, challenges, user, leaveActiveChallenge, router]);

  /** Le menu « … » : ce qui se fait rarement sur un livre */
  const handleMenu = useCallback(() => {
    const options = [isAdmin ? 'Modifier le livre' : 'Mon édition', 'Quitter le livre', 'Annuler'];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
      (index) => {
        if (index === 0) setEditBookVisible(true);
        if (index === 1) handleLeave();
      },
    );
  }, [isAdmin, handleLeave]);

  if (!activeChallenge) return null;

  /** Un cap en pages de MON édition : « p. 28 », ou « ≈ p. 31 » si j'ai une autre édition */
  const capPages = (cap: TrackCap) => {
    const pages = Math.round((cap.percent / 100) * myPages);
    return myPages === referencePages ? `p. ${pages}` : `≈ p. ${pages}`;
  };

  return (
    <ScrollView
      style={[styles.screen, fit.style]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      onContentSizeChange={fit.onContentSizeChange}
    >
      {/* ─── Le livre : sa tranche, et le menu ─── */}
      <View style={styles.menuRow}>
        <GlassButton
          icon={EllipsisIcon}
          size={36}
          onPress={handleMenu}
          accessibilityLabel="Plus d'options"
        />
      </View>
      <View style={styles.spine}>
        <BookSpine
          title={activeChallenge.book_title}
          author={activeChallenge.book_author}
        />
      </View>

      {/* ─── Le tableau de bord ─── */}
      <BookBento
        remaining={remaining}
        endLabel={
          activeChallenge.target_end_date
            ? formatLongDate(activeChallenge.target_end_date)
            : null
        }
        onEditEnd={() => setDeadlineVisible(true)}
        clubPercent={clubPercent}
        myPercent={myPercent}
        currentPage={mine?.current_page ?? 0}
        pages={myPages}
        members={members}
        onOpenMembers={() => router.push('/leaderboard?from=book')}
        inviteCode={activeChallenge.invite_code}
        onInvite={handleShareInvite}
      />

      {/* ─── Caps ─── */}
      <GroupHeader title="Caps">
        <GlassButton
          icon={PlusIcon}
          size={36}
          onPress={() => setCapForm({ open: true, goal: null })}
          accessibilityLabel="Ajouter un cap"
        />
      </GroupHeader>
      <Group>
        {caps.length === 0 ? (
          <Row icon={FlagIcon} label="Aucun cap" value="" />
        ) : (
          caps.map((cap) => {
            const reached =
              cap.state === 'past'
                ? countAtCapOnDate(clubHistory, editions, cap)
                : countAtCap(percentages, cap.percent);
            return (
              <Row
                key={cap.id}
                icon={FlagIcon}
                leading={
                  cap.state === 'past' ? (
                    <CapDot
                      percent={cap.percent}
                      myPercent={myPercent}
                      clubPercent={clubPercent}
                    />
                  ) : undefined
                }
                label={`${capPages(cap)} · ${formatTrackDate(cap.deadline)}`}
                value={`${reached}/${memberCount}`}
                valueIcon={UsersIcon}
                valueA11y={`${reached} personne${reached > 1 ? 's' : ''} sur ${memberCount}`}
                tag={cap.state === 'current' ? 'en cours' : undefined}
                dimmed={cap.state === 'past'}
                onPress={() => {
                  const goal = goalById.get(cap.id);
                  if (goal) setCapForm({ open: true, goal });
                }}
              />
            );
          })
        )}
      </Group>

      {/* ─── Les formulaires ─── */}
      <DeadlineEditSheet
        visible={deadlineVisible}
        onClose={() => setDeadlineVisible(false)}
        currentDate={activeChallenge.target_end_date}
        onSave={handleSaveDeadline}
      />

      <GoalFormSheet
        visible={capForm.open}
        onClose={() => setCapForm({ open: false, goal: null })}
        currentGoal={capForm.goal}
        history={goalHistory}
        onSaveGoal={handleSaveCap}
        totalPages={referencePages}
      />

      <EditBookSheet
        visible={editBookVisible}
        onClose={() => setEditBookVisible(false)}
        currentBook={{
          title: activeChallenge.book_title,
          author: activeChallenge.book_author || '',
          totalPages: myPages,
          coverUrl: myCoverUrl(activeChallenge, mine),
        }}
        editionOnly={!isAdmin}
        onSave={handleSaveBook}
      />
    </ScrollView>
  );
}

// ─── Briques ───────────────────────────────────────────────────────

function GroupHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** Une section de la fiche : carte blanche, bordure claire, petite ombre.
 * Deux vues, car `overflow: 'hidden'` (pour arrondir le fond des lignes
 * pressées) couperait l'ombre sur iOS. */
function Group({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <View style={[styles.group, style]}>
      <View style={styles.groupClip}>{children}</View>
    </View>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  tag,
  dimmed = false,
  chevron = false,
  leading,
  valueIcon: ValueIcon,
  valueA11y,
  trailingIcon: TrailingIcon,
  onPress,
}: {
  icon: typeof FlagIcon;
  label: string;
  value: string;
  /** Remplace l'icône de gauche (le rond d'un cap passé) */
  leading?: React.ReactNode;
  /** Petite icône devant la valeur, pour dire ce qu'elle compte */
  valueIcon?: typeof FlagIcon;
  /** La valeur lue par VoiceOver, si « 3/5 » ne suffit pas */
  valueA11y?: string;
  /** Icône à droite de la valeur : ce que fait le toucher (modifier…) */
  trailingIcon?: typeof FlagIcon;
  /** Petit repère sombre à droite du libellé, pour le cap en cours */
  tag?: string;
  dimmed?: boolean;
  chevron?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.rowLeading}>
        {leading ?? (
          <Icon
            size={17}
            color={dimmed ? colors.textPlaceholder : colors.textSecondary}
            strokeWidth={2}
          />
        )}
      </View>
      <Text style={[styles.rowLabel, dimmed && styles.rowLabelDimmed]} numberOfLines={1}>
        {label}
      </Text>
      {tag && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      )}
      {ValueIcon && value !== '' && (
        <ValueIcon size={14} color={colors.textTertiary} strokeWidth={2.4} />
      )}
      <Text style={styles.rowValue}>{value}</Text>
      {TrailingIcon && (
        <TrailingIcon size={15} color={colors.textTertiary} strokeWidth={2.2} />
      )}
      {chevron && <Text style={styles.rowChevron}>›</Text>}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}${valueA11y || value ? `, ${valueA11y ?? value}` : ''}`}
    >
      {content}
    </Pressable>
  );
}

/** « lun. 13 oct. » */
function formatLongDate(iso: string) {
  const formatted = new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
  },
  content: {
    paddingTop: SHEET_TOP_INSET,
    paddingHorizontal: spacing.lg,
    // iOS ajoute déjà la zone du bas de l'écran (34 pt) sous le contenu
    paddingBottom: spacing.lg,
  },


  /** Le « … » en haut à droite, au-dessus de la tranche */
  menuRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  spine: {
    marginBottom: spacing.xl,
  },

  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // La hauteur du rond en verre du « + »
    height: 36,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },

  group: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.xs,
  },
  groupClip: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 46,
    paddingHorizontal: spacing.lg,
  },
  rowLeading: {
    width: 18,
    alignItems: 'center',
  },
  rowPressed: {
    backgroundColor: inkAlpha(0.04),
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  rowLabelDimmed: {
    fontFamily: fonts.body,
    color: colors.textTertiary,
  },
  rowValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  rowChevron: {
    fontFamily: fonts.body,
    fontSize: 20,
    color: colors.textPlaceholder,
    marginLeft: -4,
  },

  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark900,
  },
  tagText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.white,
  },
});
