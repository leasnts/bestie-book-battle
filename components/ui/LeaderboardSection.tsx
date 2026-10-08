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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
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
  PODIUM_SLOTS,
  rankParticipants,
  RankedParticipant,
  selectVisibleRows,
} from '../../utils/leaderboard';
import GlassSection from './GlassSection';
import { Seam } from './GoalTrack';
import { AccentUnit } from './AccentWord';

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
  /** Un carré du bento de l'accueil, à côté du carnet : lignes resserrées */
  square?: boolean;
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
function Row({
  participant,
  animate,
  square,
}: {
  participant: RankedParticipant;
  animate: boolean;
  square: boolean;
}) {
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
      style={[styles.row, square && styles.rowSquare, participant.isMe && styles.rowMe]}
      accessible
      accessibilityLabel={`${participant.rank}, ${participant.name}, ${score} pour cent`}
    >
      <Text style={[styles.rank, square && styles.rankSquare]}>
        <AccentUnit size={square ? styles.rankSquare.fontSize : styles.rank.fontSize}>{String(participant.rank)}</AccentUnit>
      </Text>
      <Image
        source={resolveAvatar(participant.photoUrl)}
        style={[styles.avatar, square && styles.avatarSquare]}
        contentFit="cover"
      />
      <Text
        style={[styles.name, square && styles.nameSquare, participant.isMe && styles.nameMe]}
        numberOfLines={1}
      >
        {participant.name}
      </Text>
      <Text style={[styles.score, square && styles.scoreSquare]}>
        {displayScore}
        <AccentUnit size={square ? styles.scoreUnitSquare.fontSize : styles.scoreUnit.fontSize}>%</AccentUnit>
      </Text>
    </Animated.View>
  );
}

// ─── À deux : face-à-face ─────────────────────────────────────────
/**
 * Un groupe de deux n'a rien à classer : une liste de deux lignes laissait le
 * carré à moitié vide. À la place, les deux avatars en grand, chacun avec son
 * %, et entre eux un bout de fil cousu. Le plus avancé à droite, comme sur
 * la piste qui avance de gauche à droite.
 */
function Side({
  participant,
  animate,
  end = false,
}: {
  participant: RankedParticipant;
  animate: boolean;
  /** Côté droit : tout s'aligne sur le bord droit du cadre */
  end?: boolean;
}) {
  const score = useRollingCounter(formatScore(participant), 800, animate);
  return (
    <View style={[styles.duelSide, end && styles.duelSideEnd]}>
      <Image
        source={resolveAvatar(participant.photoUrl)}
        style={styles.duelAvatar}
        contentFit="cover"
      />
      <Text style={[styles.duelName, participant.isMe && styles.duelNameMe]} numberOfLines={1}>
        {participant.name}
      </Text>
      <Text style={styles.duelScore}>
        {score}
        <AccentUnit size={styles.duelScoreUnit.fontSize}>%</AccentUnit>
      </Text>
    </View>
  );
}

function Duel({ pair, animate }: { pair: RankedParticipant[]; animate: boolean }) {
  const [first, second] = pair;
  // Largeur du fil, pour y placer les points
  const [threadWidth, setThreadWidth] = useState(0);
  return (
    <View style={styles.duel}>
      <View style={styles.duelRow}>
        <Side participant={second} animate={animate} />
        <View
          style={styles.duelThread}
          onLayout={(e) => setThreadWidth(e.nativeEvent.layout.width)}
        >
          {/* Le même fil à points que la piste du livre (GoalTrack) */}
          {threadWidth > 0 && (
            <Svg width={threadWidth} height={THREAD_HEIGHT}>
              <Seam width={threadWidth} readUntil={threadWidth} y={THREAD_HEIGHT / 2} />
            </Svg>
          )}
        </View>
        <Side participant={first} animate={animate} end />
      </View>
    </View>
  );
}

// ─── Le cadre ─────────────────────────────────────────────────────

export default function LeaderboardSection({
  participants,
  myUserId,
  onPress,
  compact = false,
  square = false,
}: LeaderboardSectionProps) {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  const ranked = useMemo(() => rankParticipants(participants, myUserId), [participants, myUserId]);
  const { rows, pinnedMe } = useMemo(() => selectVisibleRows(ranked, compact), [ranked, compact]);
  const spread = square && !pinnedMe;
  const duel = square && ranked.length === 2;
  const a11y = duel
    ? `Progression, ${ranked.map((p) => `${p.name} ${formatScore(p)} pour cent`).join(', ')}`
    : `Progression, ${ranked.length} membres`;

  return (
    <GlassSection
      compact={compact}
      onPress={onPress}
      accessibilityLabel={a11y}
      accessibilityHint="Ouvre la progression complète"
      style={square && styles.square}
    >
      <View style={styles.head}>
        {/* Plus de nombre de membres à côté du titre (Lea, 2026-10-01) : il ne menait nulle part */}
        <Text style={styles.title}>Progression</Text>
      </View>

      {duel ? (
        <Duel pair={ranked} animate={animate} />
      ) : (
        <View style={[styles.rows, square && styles.rowsSquare]}>
          {rows.map((participant) => (
            <React.Fragment key={participant.id}>
              {/* En carré sans ma ligne épinglée : 2 ou 3 lignes ne remplissent pas
                le cadre. Un ressort avant chaque ligne les répartit sur la hauteur,
                la dernière reste posée en bas comme dans le cas épinglé. */}
              {spread && <View style={styles.spring} />}
              <Row participant={participant} animate={animate} square={square} />
            </React.Fragment>
          ))}
          {/* À deux, la 2e ligne posée en bas laissait un vide lourd au-dessus :
            un dernier ressort centre la paire dans le cadre. */}
          {spread && rows.length < PODIUM_SLOTS && <View style={styles.spring} />}

          {/* Ma ligne, quand je suis hors du top 3 : le pointillé dit qu'il y a
            du monde entre les deux, sans écrire combien. */}
          {pinnedMe && (
            <>
              <View style={styles.gap} />
              <Row participant={pinnedMe} animate={animate} square={square} />
            </>
          )}
        </View>
      )}
    </GlassSection>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

const AVATAR_SIZE = 30;
const ROW_HEIGHT = 36;
/** Colonne du rang : trois chiffres tiennent sans pousser les avatars */
const RANK_WIDTH = 23;
/** Avatars du face-à-face : assez grands pour remplir le carré à deux */
const DUEL_AVATAR = 36;
/** Hauteur du dessin du fil : assez pour ses points */
const THREAD_HEIGHT = 4;

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

  rows: {
    marginTop: 7,
  },

  // En carré : les lignes se posent en bas du cadre, plus serrées
  square: {
    aspectRatio: 1,
  },
  rowsSquare: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  spring: {
    flex: 1,
  },
  rowSquare: {
    minHeight: 27,
    gap: spacing.sm,
    marginHorizontal: -6,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  rankSquare: {
    width: 12,
    fontSize: 13,
  },
  avatarSquare: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  nameSquare: {
    fontSize: 14,
  },
  scoreSquare: {
    fontSize: 16,
  },
  scoreUnitSquare: {
    fontSize: 11,
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

  // Face-à-face (groupe de deux)
  duel: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  /** Les avatars collés aux bords : le milieu reste au fil */
  duelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  duelSide: {
    alignItems: 'flex-start',
    gap: 3,
  },
  duelSideEnd: {
    alignItems: 'flex-end',
  },
  duelAvatar: {
    width: DUEL_AVATAR,
    height: DUEL_AVATAR,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: creamAlpha(0.6),
  },
  duelName: {
    maxWidth: '100%',
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  duelNameMe: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.textPrimary,
  },
  duelScore: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  duelScoreUnit: {
    fontSize: 13,
  },
  /** Le fil entre les deux, à hauteur des avatars */
  duelThread: {
    flex: 1,
    alignSelf: 'flex-start',
    height: DUEL_AVATAR,
    marginHorizontal: spacing.sm,
    justifyContent: 'center',
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
