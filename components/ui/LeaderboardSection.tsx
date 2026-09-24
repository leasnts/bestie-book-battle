/**
 * LeaderboardSection — le cadre « Classement » de l'accueil.
 *
 * Troisième question de l'accueil : où je me situe dans le club. Le classement
 * est du contexte, pas une compétition : rangs 1-2-3, puis ma ligne si je suis
 * plus loin. Rien d'autre.
 *
 * Ce qu'on montre :
 * - moi dans le top 3 → le top 3
 * - moi ailleurs      → le top 3, un trait pointillé, puis MA ligne avec mon
 *   rang réel, alignée sur les mêmes colonnes
 *
 * **Toujours en %**, même quand tout le monde lit la même édition : la page
 * n'appartient qu'à soi, seul le pourcentage se compare (DESIGN.md › Pages ou %).
 *
 * Tout le cadre s'ouvre d'un toucher (classement complet). Les lignes ne se
 * touchent plus une par une : deux cibles imbriquées rendaient le geste
 * incertain. La timeline d'une personne s'ouvre depuis le classement complet.
 *
 * Gardés de l'ancienne carte : le compteur qui roule quand un score change, et
 * le glissement des lignes quand l'ordre change. Les deux se coupent avec
 * « Réduire les animations ».
 */

import { Image } from 'expo-image';
import { ChevronRightIcon, UsersIcon } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, creamAlpha, fonts, inkAlpha, motion, spacing } from '../../utils/constants';
import {
  formatScore,
  LeaderboardParticipant,
  rankParticipants,
  RankedParticipant,
  selectVisibleRows,
} from '../../utils/leaderboard';
import GlassSection from './GlassSection';

// ─── Props ─────────────────────────────────────────────────────────

interface LeaderboardSectionProps {
  /** Tous les participants (y compris l'utilisateur connecté) */
  participants: LeaderboardParticipant[];
  /** ID de l'utilisateur connecté */
  myUserId: string;
  /** Toucher le cadre → classement complet */
  onPress?: () => void;
  /** Petit écran : le 1er et moi seulement (cf. selectVisibleRows) */
  compact?: boolean;
}

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');

const resolveAvatar = (url: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

// ─── Hook : compteur roulant ──────────────────────────────────────
/**
 * Anime un nombre de sa valeur précédente vers la nouvelle, en décélérant
 * (ease-out quart). Avec « Réduire les animations », la valeur finale s'affiche
 * directement.
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

// ─── Une ligne ────────────────────────────────────────────────────
/** `[rang] [avatar] [prénom] … [score %]`, sur quatre colonnes fixes */
function Row({ participant, animate }: { participant: RankedParticipant; animate: boolean }) {
  const score = formatScore(participant);
  const displayScore = useRollingCounter(score, 800, animate);

  return (
    // `layout` anime le glissement quand quelqu'un double quelqu'un d'autre
    <Animated.View
      layout={
        animate ? LinearTransition.springify().damping(20).stiffness(180).mass(0.7) : undefined
      }
      entering={
        animate
          ? FadeIn.duration(motion.duration.standard).easing(
              Easing.bezier(...motion.easing.easeOutQuart).factory(),
            )
          : undefined
      }
      style={[styles.row, participant.isMe && styles.rowMe]}
      accessible
      accessibilityLabel={`${participant.rank}, ${participant.name}, ${score} pour cent`}
    >
      <Text style={styles.rank}>{participant.rank}</Text>
      <Image
        source={resolveAvatar(participant.photoUrl)}
        style={styles.avatar}
        contentFit="cover"
      />
      <Text style={[styles.name, participant.isMe && styles.nameMe]} numberOfLines={1}>
        {participant.name}
      </Text>
      <Text style={styles.score}>
        {displayScore}
        <Text style={styles.scoreUnit}>%</Text>
      </Text>
    </Animated.View>
  );
}

// ─── Le cadre ─────────────────────────────────────────────────────

export default function LeaderboardSection({
  participants,
  myUserId,
  onPress,
  compact = false,
}: LeaderboardSectionProps) {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  const ranked = useMemo(() => rankParticipants(participants, myUserId), [participants, myUserId]);
  const { rows, pinnedMe } = useMemo(() => selectVisibleRows(ranked, compact), [ranked, compact]);

  return (
    <GlassSection
      compact={compact}
      onPress={onPress}
      accessibilityLabel={`Classement, ${ranked.length} membres`}
      accessibilityHint="Ouvre le classement complet"
    >
      <View style={styles.head}>
        <Text style={styles.title}>Classement</Text>
        <View style={styles.count}>
          <UsersIcon size={15} color={colors.textTertiary} strokeWidth={2} />
          <Text style={styles.countText}>{ranked.length}</Text>
          <ChevronRightIcon size={17} color={colors.textPlaceholder} strokeWidth={2} />
        </View>
      </View>

      <View style={styles.rows}>
        {rows.map((participant) => (
          <Row key={participant.id} participant={participant} animate={animate} />
        ))}

        {/* Ma ligne, quand je suis hors du top 3 : le pointillé dit qu'il y a
            du monde entre les deux, sans écrire combien. */}
        {pinnedMe && (
          <>
            <View style={styles.gap} />
            <Row participant={pinnedMe} animate={animate} />
          </>
        )}
      </View>
    </GlassSection>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

const AVATAR_SIZE = 30;
const ROW_HEIGHT = 36;
/** Colonne du rang : trois chiffres tiennent sans pousser les avatars */
const RANK_WIDTH = 23;

const styles = StyleSheet.create({
  // minHeight, pas height : aux gros corps de texte le titre doit pouvoir
  // pousser au lieu d'être coupé.
  head: {
    minHeight: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },

  rows: {
    marginTop: 7,
  },
  row: {
    minHeight: ROW_HEIGHT,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    // La ligne déborde du padding du cadre : son fond entoure le texte sans
    // décaler les colonnes.
    marginHorizontal: -9,
    paddingHorizontal: 9,
    borderRadius: 14,
  },
  rowMe: {
    backgroundColor: inkAlpha(0.06),
  },
  rank: {
    width: RANK_WIDTH,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.textPlaceholder,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: creamAlpha(0.6),
  },
  name: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  nameMe: {
    fontFamily: fonts.bodyExtraBold,
  },
  score: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  scoreUnit: {
    fontSize: 14,
  },

  /** Trait pointillé : un saut dans le classement, pas une séparation */
  gap: {
    height: 0,
    marginVertical: 5,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: inkAlpha(0.2),
  },
});
