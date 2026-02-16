/**
 * Composant ProgressCard
 *
 * Classement vertical des participants dans un challenge de lecture.
 * Celui qui a le plus lu est en haut, celui qui a le moins lu est en bas.
 *
 * Comment ça marche :
 * - On reçoit "me" (l'utilisateur connecté) et "friend" (l'ami.e)
 * - On les trie par score décroissant (le plus de pages lues en premier)
 * - Chaque participant est affiché sur une ligne horizontale :
 *   → [avatar + couronne si leader] [nom] ........... [badge streak] [score]
 * - Le score utilise un compteur roulant animé (hook useRollingCounter)
 *   pour un feedback visuel satisfaisant quand la valeur change
 * - La couronne PNG est positionnée en absolute au-dessus de l'avatar du leader,
 *   légèrement penchée (~9°) comme dans le Figma
 */

import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../utils/constants';
import IconFlame from '../icons/IconFlame';

interface Participant {
  id: string;
  name: string;
  photoUrl: string | null;
  score: number;        // Page actuelle (= score)
  streak: number;       // Nombre de jours consécutifs
  isLeader: boolean;    // Est en tête ?
  /** true = a lu hier mais pas aujourd'hui, le streak va « mourir » si pas de lecture */
  streakAtRisk?: boolean;
}

interface ProgressCardProps {
  /** Le participant "moi" (utilisateur connecté) */
  me: Participant;
  /** Le participant ami.e */
  friend: Participant | null;
  /** Callback quand on tap sur un participant */
  onParticipantPress?: (participantId: string) => void;
}

// Fallback avatar quand le participant n'a pas de photo
const DEFAULT_AVATAR = require('../../assets/images/lea.png');

// Image de la couronne (remplace l'emoji 👑 pour un rendu cohérent cross-platform)
const CROWN_IMAGE = require('../../assets/images/crown.png');

/**
 * Résout l'URL de l'avatar en source Image compatible expo-image.
 * Si l'URL est null ou invalide, on utilise l'avatar par défaut.
 */
const resolveAvatar = (url: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

// ─── Hook : compteur roulant ──────────────────────────────────────
/**
 * Anime un nombre de sa valeur précédente vers la nouvelle valeur,
 * avec un effet de "compteur qui roule" (odometer).
 *
 * Comment ça marche :
 * - On garde en mémoire la valeur précédente avec useRef
 * - Quand target change, on lance une boucle requestAnimationFrame
 *   qui interpole entre l'ancienne et la nouvelle valeur
 * - L'interpolation utilise une courbe ease-out cubique :
 *   rapide au début, ralentit vers la fin (naturel et satisfaisant)
 * - Le nombre affiché est arrondi à l'entier le plus proche
 *
 * @param target La valeur cible (nombre entier)
 * @param duration Durée de l'animation en ms (défaut: 800ms)
 * @returns Le nombre actuellement affiché (animé)
 */
function useRollingCounter(target: number, duration = 800): number {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const rafId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;

    const start = Date.now();
    const diff = target - from;

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubique : rapide au début, ralentit à la fin
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + diff * eased));
      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration]);

  return display;
}

// ─── Ligne d'un participant ──────────────────────────────────────
/**
 * Affiche une ligne pour un participant dans le classement.
 *
 * Layout horizontal :
 * [avatar 24×24 + couronne si leader] [nom en WorkSans SemiBold 14px]
 * ........... espace flexible ...........
 * [badge streak : 🔥 + nombre] [score en Rokkitt SemiBold 24px]
 *
 * La couronne est positionnée en absolute au-dessus de l'avatar,
 * légèrement penchée (~9°) pour un rendu fun et naturel.
 */
function ParticipantRow({
  participant,
  displayScore,
  onPress,
}: {
  participant: Participant;
  displayScore: number;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.participantRow} onPress={onPress}>
      {/* ── Côté gauche : avatar + nom ── */}
      <View style={styles.participantLeft}>
        {/* Wrapper avatar : la couronne est positionnée en absolute par rapport à lui */}
        <View style={styles.avatarWrapper}>
          <Image
            source={resolveAvatar(participant.photoUrl)}
            style={styles.avatar}
            contentFit="cover"
          />
          {/* Couronne du leader — légèrement penchée (~9°) comme dans le Figma */}
          {participant.isLeader && (
            <View style={styles.crownOverAvatar}>
              <Image source={CROWN_IMAGE} style={styles.crownImage} contentFit="contain" />
            </View>
          )}
        </View>
        <Text style={styles.userName} numberOfLines={1}>{participant.name}</Text>
      </View>

      {/* ── Côté droit : badge streak + score ── */}
      <View style={styles.participantRight}>
        {participant.streak > 0 && (
          <View
            style={[
              styles.streakBadge,
              participant.streakAtRisk && styles.streakBadgeAtRisk,
            ]}
          >
            <IconFlame size={12} color={colors.textTertiary} />
            <Text style={styles.streakText}>{participant.streak}</Text>
          </View>
        )}
        <Text style={styles.scoreNumber}>{displayScore}</Text>
      </View>
    </Pressable>
  );
}

// ─── Composant principal ──────────────────────────────────────────
export default function ProgressCard({
  me,
  friend,
  onParticipantPress,
}: ProgressCardProps) {
  // Compteurs roulants — quand le score change (ex: après enregistrement),
  // le nombre affiché s'incrémente progressivement de l'ancien au nouveau.
  const myDisplayScore = useRollingCounter(me.score);
  const friendDisplayScore = useRollingCounter(friend?.score ?? 0);

  // On construit la liste des participants, triée par score décroissant.
  // Le participant avec le plus de pages lues apparaît en premier (en haut).
  const sortedParticipants: { participant: Participant; displayScore: number }[] = [];

  sortedParticipants.push({ participant: me, displayScore: myDisplayScore });
  if (friend) {
    sortedParticipants.push({ participant: friend, displayScore: friendDisplayScore });
  }

  // Tri décroissant par score (le plus lu en haut)
  sortedParticipants.sort((a, b) => b.participant.score - a.participant.score);

  return (
    <View style={styles.container}>
      {sortedParticipants.map((entry) => (
        <ParticipantRow
          key={entry.participant.id}
          participant={entry.participant}
          displayScore={entry.displayScore}
          onPress={() => onParticipantPress?.(entry.participant.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Conteneur principal : liste verticale avec un gap de 12px entre les lignes
  container: {
    width: '100%',
    gap: spacing.md,
  },

  // ═══ LIGNE PARTICIPANT ═══
  // Chaque participant occupe une ligne horizontale :
  // gauche (avatar + nom) ↔ droite (streak + score)
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  // Côté gauche : avatar + nom, alignés horizontalement
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },

  // Côté droit : streak badge + score, alignés horizontalement
  participantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  // ═══ AVATAR + COURONNE ═══

  // Le wrapper autour de l'avatar permet de positionner la couronne
  // en absolute par rapport à l'avatar (pas par rapport au container global)
  avatarWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  // Couronne positionnée au-dessus de l'avatar, légèrement penchée.
  // Avatar 28×28 : on centre la couronne (~28px) et on remonte au-dessus
  crownOverAvatar: {
    position: 'absolute',
    top: -18,
    left: -2,
    zIndex: 10,
    transform: [{ rotate: '9deg' }],
  },
  crownImage: {
    width: 28,
    height: 28,
  },

  // ═══ NOM UTILISATEUR ═══
  // WorkSans SemiBold 18px pour les prénoms
  userName: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 24,
  },

  // ═══ SCORE ═══
  // Rokkitt SemiBold 24px (display-xs dans le Figma)
  scoreNumber: {
    fontFamily: 'Rokkitt_SemiBold',
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 32,
    textAlign: 'right',
  },

  // ═══ BADGE STREAK ═══
  // Badge avec fond semi-transparent + bordure, contenant l'icône flamme + le nombre
  // Même style que l'ancien design pour garder la cohérence visuelle
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  /** Streak en danger : badge en opacité réduite + bordure pointillée */
  streakBadgeAtRisk: {
    opacity: 0.6,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.3)',
  },
  streakText: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 12,
    textAlign: 'center',
  },
});
