/**
 * LeaderboardSection — la case « Progression » de l'accueil.
 *
 * Troisième question de l'accueil : où en est le groupe. Pas de podium ni de
 * numéro de rang (Lea, 2026-11-10 : rien de « compet ») : l'ordre suit
 * l'avancée, c'est tout. Chaque ligne porte l'avatar, le prénom, le %, et
 * dessous un bout du fil de l'app (`Seam`) qui s'encre jusqu'au % de la
 * personne et finit sur un nœud. Moi en rouge (prénom, %, fil), sans contour
 * autour des photos.
 *
 * Ce qu'on montre : moi et mes voisins, toujours 3 lignes (`selectNeighbours`)
 * - la personne juste devant, moi, la personne juste derrière
 * - en tête ou dernière, la fenêtre se cale au bord
 * - à deux → deux lignes plus grandes, centrées dans le carré
 * - petit écran (`compact`) → le 1er et moi, avec trois points entre les deux
 *
 * **Toujours en %**, même quand tout le monde lit la même édition : la page
 * n'appartient qu'à soi, seul le pourcentage se compare (DESIGN.md › Pages ou %).
 *
 * Tout le cadre s'ouvre d'un toucher (classement complet).
 *
 * Gardés : le compteur qui roule quand un score change, et le glissement des
 * lignes quand l'ordre change. Les deux se coupent avec « Réduire les animations ».
 */

import { Image } from 'expo-image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  colors,
  fonts,
  inkAlpha,
  lowki,
  motion,
  spacing,
} from '../../utils/constants';
import {
  formatScore,
  LeaderboardParticipant,
  RankedParticipant,
  rankParticipants,
  selectNeighbours,
  selectVisibleRows,
} from '../../utils/leaderboard';
import GlassSection from './GlassSection';
import { KNOT_R, Seam } from './GoalTrack';
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
  /**
   * Avec `square` : prend toute la hauteur qu'on lui donne au lieu d'être carré
   * (la page de droite du livre ouvert, iPhone Duo déplié).
   */
  fill?: boolean;
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

// ─── Le fil d'une personne ────────────────────────────────────────
/**
 * Le fil de l'app en petit, sur toute la largeur de la ligne : encré jusqu'au
 * % de la personne (rouge pour moi), puis un nœud bombé. À 0 %, pas de nœud :
 * rien n'est encore cousu.
 */
export function PersonThread({ percent, me }: { percent: number; me: boolean }) {
  const [width, setWidth] = useState(0);
  // Le fil s'arrête à un rayon de nœud des bords : le nœud n'est jamais coupé
  const inner = Math.max(0, width - KNOT_R * 2);
  const until = (inner * Math.min(Math.max(percent, 0), 100)) / 100;
  const knot = me ? 'url(#progressKnotMe)' : 'url(#progressKnotInk)';
  return (
    <View style={styles.thread} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={THREAD_HEIGHT}>
          <Defs>
            <RadialGradient id="progressKnotMe" cx="35%" cy="30%" r="80%">
              <Stop offset="0" stopColor="#bc6271" />
              <Stop offset="0.55" stopColor={lowki.red.light} />
              <Stop offset="1" stopColor={lowki.red.dark} />
            </RadialGradient>
            <RadialGradient id="progressKnotInk" cx="35%" cy="30%" r="80%">
              <Stop offset="0" stopColor="#8a5d51" />
              <Stop offset="0.55" stopColor={lowki.chocolate.light} />
              <Stop offset="1" stopColor={lowki.chocolate.dark} />
            </RadialGradient>
          </Defs>
          <G x={KNOT_R}>
            <Seam
              width={inner}
              readUntil={percent > 0 ? until + 0.5 : 0}
              y={THREAD_HEIGHT / 2}
              readColor={me ? colors.accent : undefined}
            />
            {percent > 0 && <Circle cx={until} cy={THREAD_HEIGHT / 2} r={KNOT_R} fill={knot} />}
          </G>
        </Svg>
      )}
    </View>
  );
}

// ─── Une ligne ────────────────────────────────────────────────────
/** `[avatar] [prénom … %]`, et dessous le fil de la personne */
function Row({
  participant,
  animate,
  size,
}: {
  participant: RankedParticipant;
  animate: boolean;
  size: RowSize;
}) {
  const score = formatScore(participant);
  const displayScore = useRollingCounter(score, 800, animate);
  const s = SIZES[size];
  const me = participant.isMe;

  const avatar = (
    <Image
      source={resolveAvatar(participant.photoUrl)}
      style={[
        styles.avatar,
        { width: s.avatar, height: s.avatar, borderRadius: s.avatar * AVATAR_ROUND },
      ]}
      contentFit="cover"
    />
  );

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
      style={[styles.row, { gap: s.gap }]}
      accessible
      accessibilityLabel={`${participant.name}, ${score} pour cent`}
    >
      {avatar}
      <View style={[styles.body, { gap: s.lineGap }]}>
        <View style={styles.line}>
          <Text
            style={[styles.name, { fontSize: s.name }, me && styles.nameMe]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {participant.name}
          </Text>
          <Text style={[styles.score, { fontSize: s.score }, me && styles.scoreMe]} maxFontSizeMultiplier={1.2}>
            {displayScore}
            <AccentUnit size={Math.round(s.score * 0.72)} color={me ? colors.accent : colors.textPrimary}>
              %
            </AccentUnit>
          </Text>
        </View>
        <PersonThread percent={participant.percentage} me={me} />
      </View>
    </Animated.View>
  );
}

/** Petit écran : trois points entre le 1er et moi, sans dire combien de monde */
function Gap() {
  return (
    <View style={styles.gap} accessible={false}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.gapDot} />
      ))}
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
  fill = false,
}: LeaderboardSectionProps) {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  const ranked = useMemo(() => rankParticipants(participants, myUserId), [participants, myUserId]);
  // Petit écran : le 1er et moi ; sinon moi et mes voisins (Lea, 2026-11-11 :
  // pas de « top 3 · · · moi », ça faisait classement)
  const { rows, pinnedMe } = useMemo(
    () =>
      compact
        ? selectVisibleRows(ranked, true)
        : { rows: selectNeighbours(ranked), pinnedMe: null as RankedParticipant | null },
    [ranked, compact],
  );
  const duo = ranked.length === 2;
  const size: RowSize = !square ? 'wide' : duo ? 'duo' : 'square';
  const a11y = `Progression, ${ranked.map((p) => `${p.name} ${formatScore(p)} pour cent`).join(', ')}`;

  return (
    <GlassSection
      compact={compact}
      onPress={onPress}
      accessibilityLabel={a11y}
      accessibilityHint="Ouvre la progression complète"
      style={square && (fill ? styles.fill : styles.square)}
    >
      <View style={[styles.rows, square && (duo ? styles.rowsDuo : styles.rowsSquare)]}>
        {rows.map((participant) => (
          <Row key={participant.id} participant={participant} animate={animate} size={size} />
        ))}
        {pinnedMe && (
          <>
            <Gap />
            <Row participant={pinnedMe} animate={animate} size={size} />
          </>
        )}
      </View>
    </GlassSection>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette G2 (artefact « Progression », tour 3), en points.

type RowSize = 'square' | 'duo' | 'wide';
const SIZES: Record<RowSize, { avatar: number; name: number; score: number; gap: number; lineGap: number }> = {
  square: { avatar: 28, name: 13, score: 14, gap: 9, lineGap: 6 },
  duo: { avatar: 34, name: 14, score: 16, gap: 10, lineGap: 8 },
  wide: { avatar: 32, name: 16, score: 18, gap: spacing.md, lineGap: 8 },
};
/** Arrondi des avatars, en part du côté (carré arrondi, comme partout) */
export const AVATAR_ROUND = 0.32;
/** Hauteur du dessin du fil : assez pour le nœud */
const THREAD_HEIGHT = KNOT_R * 2 + 2;

const styles = StyleSheet.create({
  rows: {
    gap: spacing.md,
  },
  square: {
    aspectRatio: 1,
  },
  fill: {
    flex: 1,
  },
  // En carré : les lignes réparties sur toute la hauteur
  rowsSquare: {
    flex: 1,
    gap: 0,
    justifyContent: 'space-between',
  },
  // À deux : deux lignes plus grandes, centrées
  rowsDuo: {
    flex: 1,
    gap: 22,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Pas de contour (Lea, 2026-11-11) : la photo seule
  avatar: {},
  body: {
    flex: 1,
    minWidth: 0,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  nameMe: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.accent,
  },
  score: {
    fontFamily: fonts.display,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  scoreMe: {
    color: colors.accent,
  },
  // Le fil tient dans la ligne : à 100 %, le nœud s'arrête au bord du %, jamais
  // coupé par le cadre
  thread: {
    height: THREAD_HEIGHT,
  },
  gap: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  gapDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: inkAlpha(0.3),
  },
});
