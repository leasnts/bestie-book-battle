/**
 * Composant ProgressCard
 * 
 * Carte de comparaison de progression entre deux participants.
 * Affiche côte à côte : "Moi" (à gauche) et l'ami.e (à droite)
 * avec leurs scores, streaks et une barre de progression comparative.
 * 
 * Comment ça marche :
 * - En haut : les deux participants avec avatar, nom, et pastille online
 * - Au milieu : les scores (grand chiffre) avec badge streak (flamme)
 * - En bas : une barre de progression duale (le score de chacun en proportion)
 * - Une couronne s'affiche au-dessus du leader (celui qui a le plus de pages)
 * 
 * Le composant est tappable : quand on appuie sur un participant,
 * on ouvre son historique de lectures.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../utils/constants';

interface Participant {
  id: string;
  name: string;
  photoUrl: string | null;
  score: number;        // Page actuelle (= score)
  streak: number;       // Nombre de jours consécutifs
  isLeader: boolean;    // Est en tête ?
}

interface ProgressCardProps {
  /** Le participant "moi" (utilisateur connecté) */
  me: Participant;
  /** Le participant ami.e */
  friend: Participant | null;
  /** Callback quand on tap sur un participant */
  onParticipantPress?: (participantId: string) => void;
}

// Fallback avatar
const DEFAULT_AVATAR = require('../../assets/images/lea.png');

const resolveAvatar = (url: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

export default function ProgressCard({
  me,
  friend,
  onParticipantPress,
}: ProgressCardProps) {
  // Calcul de la proportion de la barre de progression
  // Le total = score moi + score ami
  // La largeur de chaque segment est proportionnelle
  const totalScore = me.score + (friend?.score || 0);
  const myRatio = totalScore > 0 ? me.score / totalScore : 0.5;

  return (
    <View style={styles.container}>
      {/* Couronne pour le leader (positionnée en haut à gauche) */}
      {me.isLeader && (
        <View style={styles.crownContainer}>
          <Text style={styles.crownEmoji}>👑</Text>
        </View>
      )}

      {/* Ligne des participants (avatars + noms) */}
      <View style={styles.usersRow}>
        {/* Moi — à gauche */}
        <Pressable
          style={styles.userInfo}
          onPress={() => onParticipantPress?.(me.id)}
        >
          <Image
            source={resolveAvatar(me.photoUrl)}
            style={styles.avatar}
            contentFit="cover"
          />
          <Text style={styles.userName}>{me.name}</Text>
          {/* Pastille "online" (petit point noir) */}
          <View style={styles.onlineDot} />
        </Pressable>

        {/* Ami.e — à droite */}
        {friend && (
          <Pressable
            style={[styles.userInfo, styles.userInfoRight]}
            onPress={() => onParticipantPress?.(friend.id)}
          >
            <Text style={styles.userName}>{friend.name}</Text>
            <Image
              source={resolveAvatar(friend.photoUrl)}
              style={styles.avatar}
              contentFit="cover"
            />
          </Pressable>
        )}
      </View>

      {/* Ligne des scores + streaks */}
      <View style={styles.scoresRow}>
        {/* Score de gauche (moi) */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreNumber}>{me.score}</Text>
          {me.streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color={colors.textTertiary} />
              <Text style={styles.streakText}>{me.streak}</Text>
            </View>
          )}
        </View>

        {/* Score de droite (ami) */}
        {friend && (
          <View style={[styles.scoreSection, styles.scoreSectionRight]}>
            {friend.streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={14} color={colors.textTertiary} />
                <Text style={styles.streakText}>{friend.streak}</Text>
              </View>
            )}
            <Text style={styles.scoreNumber}>{friend.score}</Text>
          </View>
        )}
      </View>

      {/* Barre de progression duale */}
      <View style={styles.progressRow}>
        {/* Segment "moi" (noir foncé) */}
        <View
          style={[
            styles.progressSegmentMe,
            { flex: myRatio },
          ]}
        />
        {/* Segment "ami" (gris clair) */}
        {friend && (
          <View
            style={[
              styles.progressSegmentFriend,
              { flex: 1 - myRatio },
            ]}
          />
        )}
      </View>

      {/* Couronne ami si c'est le leader */}
      {friend?.isLeader && (
        <View style={styles.crownContainerRight}>
          <Text style={styles.crownEmoji}>👑</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    gap: spacing.md,
    position: 'relative',
  },
  // Couronne positionnée au-dessus de la carte, à gauche
  crownContainer: {
    position: 'absolute',
    top: -24,
    left: -4,
    zIndex: 10,
    transform: [{ rotate: '9deg' }],
  },
  crownContainerRight: {
    position: 'absolute',
    top: -24,
    right: -4,
    zIndex: 10,
    transform: [{ rotate: '-9deg' }],
  },
  crownEmoji: {
    fontSize: 24,
  },
  // Rangée des utilisateurs
  usersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfoRight: {
    flexDirection: 'row',
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userName: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dark900,
  },
  // Rangée des scores
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreSectionRight: {
    flexDirection: 'row',
  },
  scoreNumber: {
    fontFamily: 'Rokkitt_600SemiBold',
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 32,
  },
  // Badge streak avec icône flamme
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  // Barre de progression duale
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    height: 8,
  },
  progressSegmentMe: {
    backgroundColor: colors.dark950,
    borderRadius: 9999,
    height: 8,
  },
  progressSegmentFriend: {
    backgroundColor: '#a4a7ae',
    borderRadius: 9999,
    height: 8,
  },
});
