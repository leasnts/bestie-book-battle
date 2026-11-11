/**
 * Composant LeaderboardList
 *
 * Le classement complet : en-tête + liste scrollable de tous les participants.
 *
 * Volontairement sans habillage de sheet : c'est la route `/leaderboard` qui le
 * présente, et c'est iOS qui dessine le sheet lui-même (poignée, paliers de
 * hauteur, glissement pour fermer). Ce composant ne s'occupe que du contenu.
 *
 * Même langage que la case Progression de l'accueil (LeaderboardSection) :
 * [avatar] [prénom + série … %], et dessous le fil de la personne, encré
 * jusqu'à son % et fini par un nœud. Moi en rouge (prénom, %, fil).
 *
 * Pas de couronne, pas de numéro de rang (Lea, 2026-11-11 : rien de « compet ») :
 * l'ordre suffit.
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { SheetPageHeader, SheetSubtitle, useSheetScroll } from './SheetPage';
import Animated, { Easing, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import {
  formatParticipantCount,
  formatScore,
  LeaderboardParticipant,
  rankParticipants,
  RankedParticipant,
} from '../../utils/leaderboard';
import { colors, fonts, lowki, motion, spacing } from '../../utils/constants';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native';
import { AccentUnit } from './AccentWord';
import { STREAK_FLAME } from './StreakPill';
import { AVATAR_ROUND, PersonThread } from './LeaderboardSection';

// ─── Props ─────────────────────────────────────────────────────────

interface LeaderboardListProps {
  /** Tous les participants, non triés — le tri est fait ici */
  participants: LeaderboardParticipant[];
  /** ID de l'utilisateur connecté, pour surligner sa ligne */
  myUserId: string;
  /** Lignes non touchables : le journal de chacun ne s'ouvre que depuis l'accueil */
  readOnly?: boolean;
  /** Posé sur un autre sheet : un retour à gauche du titre */
  onBack?: () => void;
}

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');

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
  const { isMe, rank } = participant;
  const score = formatScore(participant);

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
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${participant.name}, rang ${rank}, ${score} pour cent`}
        accessibilityHint={onPress ? 'Ouvre son journal de lecture' : undefined}
      >
        <Image
          source={resolveAvatar(participant.photoUrl)}
          style={styles.avatar}
          contentFit="cover"
        />

        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
              {participant.name}
            </Text>

            {participant.streak > 0 && (
              <View
                style={[styles.streak, participant.streakAtRisk && styles.streakAtRisk]}
                accessibilityLabel={`Série de ${participant.streak} jour${participant.streak > 1 ? 's' : ''}`}
              >
                <Image source={STREAK_FLAME} style={styles.streakFlame} />
                <Text style={styles.streakText} maxFontSizeMultiplier={1.3}>{participant.streak}</Text>
              </View>
            )}

            <View style={styles.spacer} />

            <Text style={[styles.score, isMe && styles.scoreMe]}>
              {score}
              <AccentUnit
                size={Math.round(styles.score.fontSize * 0.72)}
                color={isMe ? colors.accent : colors.textPrimary}
              >
                %
              </AccentUnit>
            </Text>
          </View>

          <PersonThread percent={participant.percentage} me={isMe} />
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
  onBack,
}: LeaderboardListProps) {
  // Le sheet s'ouvre à la hauteur de tout le classement, plafonné sous l'en-tête de l'accueil
  const sheet = useSheetScroll();
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  // Même fonction de tri que l'accueil → rangs cohérents entre les deux écrans
  const ranked = useMemo(
    () => rankParticipants(participants, myUserId),
    [participants, myUserId],
  );
  /**
   * Premier en haut (par défaut) ou dernier en haut. Chacun garde son rang :
   * on retourne la liste, pas le classement.
   */
  const [ascending, setAscending] = useState(false);
  const rows = useMemo(() => (ascending ? [...ranked].reverse() : ranked), [ranked, ascending]);

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

      L'en-tête (`SheetPageHeader`, commun à tous les sheets) vit dans
      `ListHeaderComponent`, collé en haut quand on fait défiler.
    */
    <FlatList
      data={rows}
      keyExtractor={(participant) => participant.id}
      renderItem={({ item, index }) => (
        <LeaderboardRow
          participant={item}
          index={index}
          animate={!reducedMotion}
          onPress={
            readOnly ? undefined : () => router.push(`/participant/${item.id}?from=leaderboard`)
          }
        />
      )}
      {...sheet.scrollProps}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={
        <SheetPageHeader
          title="Progression"
          subtitle={
            <PressableScale
              style={styles.sort}
              pressedScale={0.96}
              hitSlop={8}
              onPress={() => setAscending((value) => !value)}
              accessibilityRole="button"
              accessibilityLabel={`${formatParticipantCount(ranked.length)}, ${
                ascending ? 'du dernier au premier' : 'du premier au dernier'
              }`}
              accessibilityHint="Inverse l'ordre"
            >
              <SheetSubtitle>{formatParticipantCount(ranked.length)}</SheetSubtitle>
              {ascending ? (
                <ChevronUpIcon size={16} color={colors.textTertiary} strokeWidth={2.25} />
              ) : (
                <ChevronDownIcon size={16} color={colors.textTertiary} strokeWidth={2.25} />
              )}
            </PressableScale>
          }
          onBack={onBack}
          scrolled={sheet.scrolled}
        />
      }
      /*
        Pas de `getItemLayout` : il suppose une hauteur de ligne constante, or
        les lignes grandissent avec le corps de texte système, et l'en-tête
        décalerait tous les offsets. FlatList mesure très bien toute seule ;
        une hauteur annoncée fausse provoquerait des sauts au défilement.
      */
      initialNumToRender={12}
      windowSize={7}
      bounces
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

// ─── Styles ────────────────────────────────────────────────────────

// Mêmes mesures que la case de l'accueil en large (LeaderboardSection › SIZES.wide)
const AVATAR_SIZE = 32;

const styles = StyleSheet.create({
  // « 5 membres ⌄ » : touchable pour inverser l'ordre
  sort: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  // Un peu d'air entre les lignes
  separator: {
    height: spacing.xs,
  },

  // ═══ LIGNE ═══
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowPressed: {
    opacity: 0.6,
  },

  // Pas de contour : la photo seule, carré arrondi comme sur l'accueil
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE * AVATAR_ROUND,
  },

  // ═══ CORPS DE LIGNE ═══
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
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
    color: colors.accent,
  },
  score: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  scoreMe: {
    color: colors.accent,
  },

  // ═══ SÉRIE ═══
  // Pas de badge : la flamme Lowki et le nombre en rouge, comme la gélule de
  // l'accueil (StreakPill). En danger : atténués ensemble, même opacité.
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakAtRisk: {
    opacity: 0.45,
  },
  streakFlame: {
    width: 14,
    height: 14,
  },
  streakText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: lowki.red.light,
    fontVariant: ['tabular-nums'],
  },
});
