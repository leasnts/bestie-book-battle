/**
 * Composant ProgressCard
 *
 * Section de classement affichée en bas de l'accueil.
 *
 * Règle d'affichage : le top 3 du challenge, plus moi. Jamais de scroll.
 * Un scroll imbriqué dans la page d'accueil était impossible à manipuler
 * (on ne savait jamais si on déplaçait la liste ou la page).
 *
 * Ce qu'on montre :
 * - moi sur le podium → le top 3
 * - moi ailleurs      → le top 3, un séparateur, puis MA ligne avec mon rang
 *   réel (#7). Je garde toujours un repère sur ma position.
 *
 * Le reste du classement s'ouvre dans un bottom sheet via le bouton du bas.
 *
 * Sous les participants, une carte optionnelle affiche l'objectif intermédiaire
 * du groupe (pages visées + deadline + anneau de progression).
 */

import { Image } from 'expo-image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  useReducedMotion,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
  formatScore,
  LeaderboardParticipant,
  rankParticipants,
  RankedParticipant,
  selectVisibleRows,
} from '../../utils/leaderboard';
import { borderRadius, colors, fonts, inkAlpha, motion, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';
import { ChevronRightIcon, FlameIcon } from 'lucide-react-native';

// ─── Props ─────────────────────────────────────────────────────────

interface ProgressCardProps {
  /** Tous les participants (y compris l'utilisateur connecté) */
  participants: LeaderboardParticipant[];
  /** ID de l'utilisateur connecté */
  myUserId: string;
  /** Tap sur un participant → ouvre sa timeline de lecture */
  onParticipantPress?: (participantId: string) => void;
  /** Tap sur « Voir le classement » → ouvre le LeaderboardSheet */
  onSeeAllPress?: () => void;
  /** true = les scores sont des pourcentages (éditions différentes entre participants) */
  showPercentage?: boolean;
  /** Objectif intermédiaire du groupe (optionnel) */
  intermediateGoal?: {
    target_pages: number;
    deadline: string;
    /** Page moyenne des participants au moment de la création de l'objectif */
    baseline: number;
  } | null;
  /** Tap sur la carte objectif */
  onGoalPress?: () => void;
}

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');
const CROWN_IMAGE = require('../../assets/images/crown.png');

const resolveAvatar = (url: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

// ─── Hook : compteur roulant ──────────────────────────────────────
/**
 * Anime un nombre de sa valeur précédente vers la nouvelle valeur,
 * avec un effet de « compteur qui roule » (odomètre).
 *
 * Comment ça marche :
 * - On garde la valeur précédente avec useRef
 * - Quand `target` change, une boucle requestAnimationFrame interpole
 *   entre l'ancienne et la nouvelle valeur
 * - La courbe est une ease-out quart : rapide au début, décélère à la fin
 * - Si l'utilisateur a activé « Réduire les animations », on saute directement
 *   à la valeur finale
 */
function useRollingCounter(target: number, duration = 800, enabled = true): number {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const rafId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;

    if (!enabled) {
      setDisplay(target);
      return;
    }

    const start = Date.now();
    const diff = target - from;

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out quart : rapide au début, décélère à la fin
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(Math.round(from + diff * eased));
      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration, enabled]);

  return display;
}

// ─── Ligne d'un participant ───────────────────────────────────────
/**
 * Une ligne du classement sur l'accueil.
 *
 * [rang si épinglé] [avatar + couronne si leader] [prénom] … [streak] [score]
 *
 * Le rang n'est affiché QUE sur la ligne épinglée : dans le podium, l'ordre
 * vertical suffit à le comprendre, et trois numéros de plus alourdiraient la
 * lecture pour rien.
 */
function ParticipantRow({
  participant,
  onPress,
  showPercentage,
  showRank = false,
  animate,
}: {
  participant: RankedParticipant;
  onPress?: () => void;
  showPercentage?: boolean;
  showRank?: boolean;
  animate: boolean;
}) {
  const score = formatScore(participant, showPercentage);
  const displayScore = useRollingCounter(score, 800, animate);

  return (
    // `layout` anime le glissement quand l'ordre du classement change
    // (quelqu'un double quelqu'un d'autre en enregistrant ses pages).
    <Animated.View
      layout={
        animate
          ? LinearTransition.springify().damping(20).stiffness(180).mass(0.7)
          : undefined
      }
      entering={
        animate
          ? FadeIn.duration(motion.duration.standard).easing(
              Easing.bezier(...motion.easing.easeOutQuart).factory(),
            )
          : undefined
      }
    >
      <PressableScale
        style={styles.participantRow}
        pressedScale={0.98}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${participant.name}, rang ${participant.rank}, ${score}${showPercentage ? ' pour cent' : ' pages'}`}
      >
        {/* ── Côté gauche : rang (optionnel) + avatar + prénom ── */}
        <View style={styles.participantLeft}>
          {showRank && <Text style={styles.rankBadge}>#{participant.rank}</Text>}

          <View style={styles.avatarWrapper}>
            <Image
              source={resolveAvatar(participant.photoUrl)}
              style={styles.avatar}
              contentFit="cover"
            />
            {participant.isLeader && (
              <View style={styles.crownOverAvatar}>
                <Image source={CROWN_IMAGE} style={styles.crownImage} contentFit="contain" />
              </View>
            )}
          </View>

          <Text
            style={[styles.userName, participant.isMe && styles.userNameMe]}
            numberOfLines={1}
          >
            {participant.name}
          </Text>
        </View>

        {/* ── Côté droit : streak + score ── */}
        <View style={styles.participantRight}>
          {participant.streak > 0 && (
            <View
              style={[
                styles.streakBadge,
                participant.streakAtRisk && styles.streakBadgeAtRisk,
              ]}
            >
              <FlameIcon size={12} color={colors.textTertiary} fill={colors.textTertiary} />
              <Text style={styles.streakText}>{participant.streak}</Text>
            </View>
          )}
          <Text style={styles.scoreNumber}>
            {displayScore}
            {showPercentage ? '%' : ''}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

// ─── Composant principal ──────────────────────────────────────────

export default function ProgressCard({
  participants,
  myUserId,
  onParticipantPress,
  onSeeAllPress,
  showPercentage,
  intermediateGoal,
  onGoalPress,
}: ProgressCardProps) {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  // Classement complet, puis le top 3 + ma ligne
  const ranked = useMemo(
    () => rankParticipants(participants, myUserId),
    [participants, myUserId],
  );
  const { rows, pinnedMe, hasMore } = useMemo(() => selectVisibleRows(ranked), [ranked]);

  // ═══ CALCULS OBJECTIF INTERMÉDIAIRE ═══
  const goalData = intermediateGoal
    ? (() => {
        const deadline = new Date(intermediateGoal.deadline);

        // Formater la date « Mer. 18 févr. »
        const dateStr = deadline.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        const formattedDate =
          dateStr.charAt(0).toUpperCase() + dateStr.slice(1).replace('.', '. ');

        const averageCurrentPage =
          ranked.length > 0
            ? ranked.reduce((sum, p) => sum + p.score, 0) / ranked.length
            : 0;

        const baseline = intermediateGoal.baseline ?? 0;
        const range = intermediateGoal.target_pages - baseline;
        const progressPercentage =
          range > 0
            ? Math.min(
                100,
                Math.max(0, Math.round(((averageCurrentPage - baseline) / range) * 100)),
              )
            : 0;

        return { formattedDate, progressPercentage };
      })()
    : null;

  return (
    <View style={styles.container}>
      {/* ── Podium : le top 3 ── */}
      <View style={styles.participantList}>
        {rows.map((participant) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            onPress={() => onParticipantPress?.(participant.id)}
            showPercentage={showPercentage}
            animate={animate}
          />
        ))}
      </View>

      {/* ── Ma ligne épinglée, quand je suis hors du podium ── */}
      {pinnedMe && (
        <View style={styles.pinnedSection}>
          {/* Séparateur pointillé : signale visuellement le « saut » de rangs */}
          <View style={styles.dashedSeparator} />
          <ParticipantRow
            participant={pinnedMe}
            onPress={() => onParticipantPress?.(pinnedMe.id)}
            showPercentage={showPercentage}
            showRank
            animate={animate}
          />
        </View>
      )}

      {/* ── Bouton vers le classement complet ── */}
      {hasMore && (
        <PressableScale
          style={styles.seeAllButton}
          pressedScale={0.98}
          onPress={onSeeAllPress}
          accessibilityRole="button"
          accessibilityLabel={`Voir le classement complet, ${ranked.length} participants`}
        >
          <Text style={styles.seeAllText}>Voir le classement</Text>
          <View style={styles.seeAllCount}>
            <Text style={styles.seeAllCountText}>{ranked.length}</Text>
          </View>
          <ChevronRightIcon size={16} color={colors.textTertiary} />
        </PressableScale>
      )}

      {/* ── Carte objectif intermédiaire ── */}
      {intermediateGoal && goalData && (
        <>
          <View style={styles.separator} />

          <PressableScale style={styles.goalCard} pressedScale={0.98} onPress={onGoalPress}>
            {/* Partie gauche : Objectif + Deadline */}
            <View style={styles.goalLeft}>
              <View style={styles.goalColumn}>
                <Text style={styles.goalLabel}>Objectif</Text>
                <Text style={styles.goalValue}>{intermediateGoal.target_pages}</Text>
              </View>

              <View style={[styles.goalColumn, styles.goalColumnDeadline]}>
                <Text style={styles.goalLabel}>Deadline</Text>
                <Text style={styles.goalValue}>{goalData.formattedDate}</Text>
              </View>
            </View>

            {/* Partie droite : anneau de progression + chevron */}
            <View style={styles.goalRight}>
              <View style={styles.progressCircle}>
                <Svg width={44} height={44} viewBox="0 0 44 44">
                  <Circle
                    cx={22}
                    cy={22}
                    r={20}
                    stroke={inkAlpha(0.08)}
                    strokeWidth={3}
                    fill="none"
                  />
                  <Circle
                    cx={22}
                    cy={22}
                    r={20}
                    stroke={colors.dark900}
                    strokeWidth={3}
                    fill="none"
                    strokeDasharray={`${(goalData.progressPercentage / 100) * 125.6} 125.6`}
                    strokeLinecap="round"
                    rotation="-90"
                    origin="22, 22"
                  />
                </Svg>
                <View style={styles.progressPercentageContainer}>
                  <Text style={styles.progressPercentageText}>
                    {goalData.progressPercentage}%
                  </Text>
                </View>
              </View>

              <ChevronRightIcon size={24} color={colors.textSecondary} />
            </View>
          </PressableScale>
        </>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const AVATAR_SIZE = 28;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.md,
  },

  // Liste des participants — plus de ScrollView, hauteur libre
  participantList: {
    gap: spacing.md,
  },

  // ═══ MA LIGNE ÉPINGLÉE ═══
  pinnedSection: {
    gap: spacing.md,
  },
  /**
   * Séparateur pointillé plutôt que plein : il ne sépare pas deux sections,
   * il signale un saut dans le classement (« il y a du monde entre les deux »).
   * Réalisé avec une bordure dashed sur un bloc de hauteur nulle.
   */
  dashedSeparator: {
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: inkAlpha(0.18),
    width: '100%',
  },

  // ═══ BOUTON CLASSEMENT COMPLET ═══
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: inkAlpha(0.05),
    borderWidth: 1,
    borderColor: inkAlpha(0.06),
  },
  seeAllText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  /** Pastille du nombre total de participants */
  seeAllCount: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    backgroundColor: inkAlpha(0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllCountText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
  },

  // ═══ SÉPARATEUR OBJECTIF ═══
  separator: {
    height: 1,
    backgroundColor: colors.alphaBlack10,
    width: '100%',
  },

  // ═══ SECTION OBJECTIF ═══
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['2xl'],
  },
  goalLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing['2xl'],
  },
  goalColumn: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  goalColumnDeadline: {
    flex: 1,
  },
  goalLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textTertiary,
  },
  goalValue: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
  },
  goalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressCircle: {
    width: 44,
    height: 44,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentageContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentageText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.textTertiary,
  },

  // ═══ LIGNE PARTICIPANT ═══
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    // L'avatar fait 28 pt : sans padding, la ligne tappable tombe à 32 pt,
    // sous le minimum de 44 pt de la HIG. 8 pt de chaque côté l'y amènent
    // exactement, sans toucher à l'espacement visuel entre les lignes.
    paddingVertical: spacing.sm,
    marginVertical: -spacing.xs,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  participantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  /** Rang affiché uniquement sur la ligne épinglée (#7) */
  rankBadge: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.textPlaceholder,
    minWidth: 24,
  },

  // ═══ AVATAR + COURONNE ═══
  avatarWrapper: {
    position: 'relative',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.alphaWhite30,
  },
  crownOverAvatar: {
    position: 'absolute',
    top: -19,
    left: -2,
    right: -2,
    zIndex: 10,
    alignItems: 'center',
  },
  crownImage: {
    width: 28,
    height: 28,
  },

  // ═══ NOM ═══
  userName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  userNameMe: {
    fontFamily: fonts.bodyExtraBold,
  },

  // ═══ SCORE ═══
  scoreNumber: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.textPrimary,
    textAlign: 'right',
  },

  // ═══ BADGE STREAK ═══
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.alphaBlack10,
    borderWidth: 1,
    borderColor: colors.alphaBlack10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  streakBadgeAtRisk: {
    opacity: 0.6,
    borderStyle: 'dashed',
    borderColor: inkAlpha(0.3),
  },
  streakText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
