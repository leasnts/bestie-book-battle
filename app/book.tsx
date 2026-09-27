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
 * Mise en page : `SheetPage`, le squelette commun à tous les sheets de l'app.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { EllipsisIcon, FlagIcon, Trash2Icon, PlusIcon, UsersIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import BookBento from '../components/ui/BookBento';
import GlassButton from '../components/ui/GlassButton';
import { CapDot } from '../components/ui/GoalTrack';
import SheetPage from '../components/ui/SheetPage';
import { getChallengeHistory } from '../services/supabase/database';
import { useAnnotationStore } from '../stores/annotationStore';
import { ANNOTATION_CATEGORIES } from '../utils/annotations';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import { confirmDeleteCap } from '../utils/confirmDeleteCap';
import type { ChallengeGoal, ProgressHistory } from '../types/supabase';
import {
  borderRadius,
  colors,
  dangerGradient,
  fonts,
  inkAlpha,
  shadows,
  spacing,
} from '../utils/constants';
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
  const { user } = useAuthStore();
  const {
    activeChallenge,
    challenges,
    leaveActiveChallenge,
  } = useProjectStore();
  const { participants } = useProgressStore();
  const { secondaryGoal, history: goalHistory, removeGoal } = useGoalStore();

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

  const goals = useMemo(() => [secondaryGoal, ...goalHistory], [secondaryGoal, goalHistory]);
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

  // Le carnet : combien de notes, dont les miennes, et où elles sont dans le
  // livre. Celles que je peux lire gardent leur couleur ; les verrouillées ne
  // montrent que leur place (règle du carnet : rien de leur contenu)
  const { notes: allNotes, ahead: allAhead, challengeId: notesBookId } = useAnnotationStore();
  const noteCounts = useMemo(() => {
    // Le carnet chargé est peut-être celui d'un autre livre
    const sameBook = notesBookId === challengeId;
    const readable = sameBook ? allNotes : [];
    const locked = sameBook ? allAhead : [];
    return {
      total: readable.length + locked.length,
      mine: readable.filter((n) => n.user_id === user?.id).length,
      stickers: [
        ...readable.map((n) => ({
          id: n.id,
          position: n.position,
          color: ANNOTATION_CATEGORIES[n.category]?.color ?? null,
        })),
        ...locked.map((n) => ({ id: n.id, position: n.book_position, color: null })),
      ],
    };
  }, [allNotes, allAhead, notesBookId, challengeId, user?.id]);
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
        if (index === 0) router.push('/edit-book?from=book');
        if (index === 1) handleLeave();
      },
    );
  }, [isAdmin, handleLeave, router]);

  /** Comme la base : seule la personne qui a posé le cap, ou l'admin du livre */
  const canDeleteCap = (goal: ChallengeGoal) => goal.created_by === user?.id || isAdmin;

  if (!activeChallenge) return null;

  /** Un cap en pages de MON édition : « p. 28 », ou « ≈ p. 31 » si j'ai une autre édition */
  const capPages = (cap: TrackCap) => {
    const pages = Math.round((cap.percent / 100) * myPages);
    return myPages === referencePages ? `p. ${pages}` : `≈ p. ${pages}`;
  };

  return (
    <SheetPage
      title={activeChallenge.book_title}
      subtitle={activeChallenge.book_author}
      titleLines={2}
      actions={
        <GlassButton
          icon={EllipsisIcon}
          size={36}
          onPress={handleMenu}
          accessibilityLabel="Plus d'options"
        />
      }
    >
      {/* ─── Le tableau de bord ─── */}
      <BookBento
        remaining={remaining}
        endLabel={
          activeChallenge.target_end_date ? formatLongDate(activeChallenge.target_end_date) : null
        }
        onEditEnd={() => router.push('/end-date?from=book')}
        clubPercent={clubPercent}
        myPercent={myPercent}
        currentPage={mine?.current_page ?? 0}
        pages={myPages}
        members={members}
        onOpenMembers={() => router.push('/leaderboard?from=book')}
        onOpenJournal={() => user?.id && router.push(`/participant/${user.id}?from=book`)}
        notes={noteCounts}
        onOpenNotes={() => router.push('/notes?from=book')}
        inviteCode={activeChallenge.invite_code}
        onInvite={handleShareInvite}
      />

      {/* ─── Caps ─── */}
      <GroupHeader title="Caps">
        <GlassButton
          icon={PlusIcon}
          size={36}
          onPress={() => router.push('/cap?from=book')}
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
            const goal = goalById.get(cap.id);
            const row = (
              <Row
                key={cap.id}
                icon={FlagIcon}
                leading={
                  cap.state === 'past' ? (
                    <CapDot percent={cap.percent} myPercent={myPercent} clubPercent={clubPercent} />
                  ) : undefined
                }
                label={`${capPages(cap)} · ${formatTrackDate(cap.deadline)}`}
                value={`${reached}/${memberCount}`}
                valueIcon={UsersIcon}
                valueA11y={`${reached} personne${reached > 1 ? 's' : ''} sur ${memberCount}`}
                tag={cap.state === 'current' ? 'en cours' : undefined}
                dimmed={cap.state === 'past'}
                onPress={() => {
                  if (goal) router.push(`/cap?id=${goal.id}&from=book`);
                }}
              />
            );
            // Glisser vers la gauche pour supprimer, si on en a le droit
            if (!goal || !canDeleteCap(goal)) return row;
            return (
              <SwipeToDelete
                key={cap.id}
                onDelete={() => confirmDeleteCap(() => removeGoal(goal.id))}
              >
                {row}
              </SwipeToDelete>
            );
          })
        )}
      </Group>
    </SheetPage>
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

/**
 * Glisser vers la gauche pour supprimer, sans rien couper : la ligne reste en
 * place et se resserre (le libellé garde son début, la valeur se pousse), le
 * rouge s'élargit depuis la droite. Relâché au-delà de la moitié, il reste
 * ouvert ; un toucher sur la ligne le referme.
 */
function SwipeToDelete({
  onDelete,
  children,
}: {
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const offset = useSharedValue(0);
  const start = useSharedValue(0);

  const close = () => {
    offset.value = withSpring(0, SWIPE_SPRING);
  };

  const pan = Gesture.Pan()
    // Horizontal seulement : le défilement vertical du sheet reste libre
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      start.value = offset.value;
    })
    .onUpdate((e) => {
      offset.value = Math.min(0, Math.max(-SWIPE_DELETE_WIDTH, start.value + e.translationX));
    })
    .onEnd((e) => {
      const open = offset.value + e.velocityX * 0.1 < -SWIPE_DELETE_WIDTH / 2;
      offset.value = withSpring(open ? -SWIPE_DELETE_WIDTH : 0, SWIPE_SPRING);
    });

  const action = useAnimatedStyle(() => ({ width: -offset.value }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.swipe}>
        <View
          style={styles.swipeContent}
          // Ouvert, un toucher sur la ligne referme au lieu d'ouvrir le cap
          onStartShouldSetResponderCapture={() => offset.value < 0}
          onResponderRelease={close}
        >
          {children}
        </View>
        <Animated.View style={[styles.swipeDelete, action]}>
          <Pressable
            onPress={() => {
              close();
              onDelete();
            }}
            style={styles.swipeDeletePress}
            accessibilityRole="button"
            accessibilityLabel="Supprimer le cap"
          >
            <LinearGradient colors={dangerGradient} style={styles.swipeDeleteFill}>
              <Trash2Icon size={20} color={colors.white} strokeWidth={2.2} />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </GestureDetector>
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
      {TrailingIcon && <TrailingIcon size={15} color={colors.textTertiary} strokeWidth={2.2} />}
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

const SWIPE_DELETE_WIDTH = 72;
const SWIPE_SPRING = { damping: 22, stiffness: 260 };

const styles = StyleSheet.create({
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
  swipe: {
    flexDirection: 'row',
  },
  swipeContent: {
    flex: 1,
  },
  swipeDelete: {
    overflow: 'hidden',
  },
  swipeDeletePress: {
    flex: 1,
  },
  swipeDeleteFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
