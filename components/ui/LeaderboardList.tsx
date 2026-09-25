/**
 * Composant LeaderboardList
 *
 * Le classement complet : en-tête + liste scrollable de tous les participants.
 *
 * Volontairement sans habillage de sheet : c'est la route `/leaderboard` qui le
 * présente, et c'est iOS qui dessine le sheet lui-même (poignée, paliers de
 * hauteur, glissement pour fermer). Ce composant ne s'occupe que du contenu.
 *
 * Une ligne :
 * [rang] [avatar + couronne si leader] [prénom + streak] [barre] [score]
 *
 * Ta ligne est surlignée pour que tu te repères d'un coup d'œil, même au milieu
 * de vingt participants.
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useFitSheet } from '../../hooks/useFitSheet';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import {
  formatParticipantCount,
  formatScore,
  LeaderboardParticipant,
  rankParticipants,
  RankedParticipant,
} from '../../utils/leaderboard';
import { borderRadius, colors, fonts, inkAlpha, motion, spacing } from '../../utils/constants';
import { FlameIcon } from 'lucide-react-native';

// ─── Props ─────────────────────────────────────────────────────────

interface LeaderboardListProps {
  /** Tous les participants, non triés — le tri est fait ici */
  participants: LeaderboardParticipant[];
  /** ID de l'utilisateur connecté, pour surligner sa ligne */
  myUserId: string;
  /** Lignes non touchables : le journal de chacun ne s'ouvre que depuis l'accueil */
  readOnly?: boolean;
}

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');
const CROWN_IMAGE = require('../../assets/images/crown.png');

const resolveAvatar = (url: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

// ─── Une ligne ─────────────────────────────────────────────────────

function LeaderboardRow({
  participant,
  index,
  animate,
  onPress,
}: {
  participant: RankedParticipant;
  index: number;
  animate: boolean;
  /** Absent : la ligne ne s'ouvre pas */
  onPress?: () => void;
}) {
  const { isMe, isLeader, rank } = participant;
  const score = formatScore(participant);

  // La barre est dessinée pleine largeur puis compressée horizontalement :
  // on anime `transform`, jamais `width`, donc aucun recalcul de layout.
  const fillScale = Math.max(0, Math.min(1, participant.percentage / 100));

  // Cascade d'apparition, plafonnée pour que le 20e participant n'attende pas
  // une seconde avant de s'afficher.
  const delay = Math.min(index * 40, 320);

  return (
    <Animated.View
      entering={
        animate
          ? FadeInDown.duration(motion.duration.entrance)
              .delay(delay)
              .easing(Easing.bezier(...motion.easing.easeOutQuart).factory())
          : undefined
      }
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.row, isMe && styles.rowMe, pressed && styles.rowPressed]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${participant.name}, rang ${rank}, ${score} pour cent`}
        accessibilityHint={onPress ? 'Ouvre son journal de lecture' : undefined}
      >
      {/* ── Rang ── */}
      <Text style={[styles.rank, isMe && styles.rankMe]}>{rank}</Text>

      {/* ── Avatar (+ couronne pour le leader) ── */}
      <View style={styles.avatarWrapper}>
        <Image
          source={resolveAvatar(participant.photoUrl)}
          style={styles.avatar}
          contentFit="cover"
        />
        {isLeader && (
          <View style={styles.crownOverAvatar}>
            <Image source={CROWN_IMAGE} style={styles.crownImage} contentFit="contain" />
          </View>
        )}
      </View>

      {/* ── Prénom, streak, score, barre ── */}
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
            {participant.name}
          </Text>

          {participant.streak > 0 && (
            <View
              style={[styles.streakBadge, participant.streakAtRisk && styles.streakBadgeAtRisk]}
            >
              <FlameIcon size={11} color={colors.textTertiary} fill={colors.textTertiary} />
              <Text style={styles.streakText}>{participant.streak}</Text>
            </View>
          )}

          <View style={styles.spacer} />

          <Text style={styles.score}>{score}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              isMe && styles.progressFillMe,
              { transform: [{ scaleX: fillScale }] },
            ]}
          />
        </View>
      </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Composant principal ───────────────────────────────────────────

export default function LeaderboardList({
  participants,
  myUserId,
  readOnly = false,
}: LeaderboardListProps) {
  // Le sheet s'ouvre à la hauteur de tout le classement, plafonné sous l'en-tête de l'accueil
  const fit = useFitSheet();
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  // Même fonction de tri que l'accueil → rangs cohérents entre les deux écrans
  const ranked = useMemo(
    () => rankParticipants(participants, myUserId),
    [participants, myUserId],
  );

  return (
    /*
      FlatList plutôt qu'une ScrollView remplie par `.map()`.

      Un book club vise 20 à 200 membres. Avec `.map()`, ouvrir le classement
      monterait les 200 lignes d'un coup — chacune avec son image, sa barre et
      son animation d'entrée — avant le premier affichage. FlatList ne monte que
      ce qui est à l'écran et recycle le reste.

      Elle reste l'enfant DIRECT de l'écran, sans View intermédiaire : c'est la
      condition pour qu'UIKit la reconnaisse comme la scroll view de l'écran et
      lui applique l'encart sous la barre de navigation. Avec une View entre les
      deux, le contenu passerait sous la barre en verre d'iOS 26.

      Le sous-titre vit dans `ListHeaderComponent`, donc dans le contenu
      scrollable — comportement iOS standard : le contenu glisse sous la barre
      et la fait réagir.
    */
    <FlatList
      data={ranked}
      keyExtractor={(participant) => participant.id}
      renderItem={({ item, index }) => (
        <LeaderboardRow
          participant={item}
          index={index}
          animate={!reducedMotion}
          onPress={readOnly ? undefined : () => router.push(`/participant/${item.id}`)}
        />
      )}
      ListHeaderComponent={
        <Text style={styles.headerSubtitle}>{formatParticipantCount(ranked.length)}</Text>
      }
      style={[styles.scrollView, fit.style]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      onContentSizeChange={fit.onContentSizeChange}
      /*
        Pas de `getItemLayout` : il suppose une hauteur de ligne constante, or
        les lignes grandissent avec le corps de texte système, et l'en-tête
        décalerait tous les offsets. FlatList mesure très bien toute seule ;
        une hauteur annoncée fausse provoquerait des sauts au défilement.
      */
      initialNumToRender={12}
      windowSize={7}
      removeClippedSubviews
      bounces
    />
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const AVATAR_SIZE = 36;
const RANK_WIDTH = 22;

const styles = StyleSheet.create({
  // ═══ SOUS-TITRE ═══
  headerSubtitle: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textTertiary,
  },
  // ═══ SCROLL ═══
  scrollView: {
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
    gap: spacing.xs,
  },

  // ═══ LIGNE ═══
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  /** Ma ligne : fond teinté pour la repérer d'un coup d'œil */
  rowPressed: {
    opacity: 0.6,
  },
  rowMe: {
    backgroundColor: inkAlpha(0.06),
  },

  // ═══ RANG ═══
  rank: {
    width: RANK_WIDTH,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.textPlaceholder,
    textAlign: 'center',
  },
  rankMe: {
    color: colors.textPrimary,
  },

  // ═══ AVATAR ═══
  avatarWrapper: {
    position: 'relative',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.alphaBlack10,
  },
  crownOverAvatar: {
    position: 'absolute',
    top: -20,
    left: -2,
    right: -2,
    zIndex: 10,
    alignItems: 'center',
  },
  crownImage: {
    width: 28,
    height: 28,
  },

  // ═══ CORPS DE LIGNE ═══
  rowBody: {
    flex: 1,
    gap: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  nameMe: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.textPrimary,
  },
  score: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
  },

  // ═══ BARRE DE PROGRESSION ═══
  progressTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: inkAlpha(0.08),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.textPlaceholder,
    // Compression depuis la gauche, pas depuis le centre
    transformOrigin: 'left',
  },
  // Ma barre : l'accent, comme toute progression (6 pt : un filet, donc uni)
  progressFillMe: {
    backgroundColor: colors.accent,
  },

  // ═══ BADGE STREAK ═══
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.alphaBlack10,
    borderWidth: 1,
    borderColor: colors.alphaBlack10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  streakBadgeAtRisk: {
    opacity: 0.6,
    borderStyle: 'dashed',
    borderColor: inkAlpha(0.3),
  },
  streakText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textTertiary,
  },
});
