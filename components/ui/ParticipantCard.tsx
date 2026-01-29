/**
 * Composant ParticipantCard
 * 
 * Carte qui affiche un participant avec :
 * - Sa photo de profil
 * - Son nom
 * - Sa progression (pages lues / total)
 * - Sa barre de progression
 * - Son streak
 * - La couronne si c'est le leader
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ParticipantWithProgress } from '../../types';
import { Avatar } from '../common/Avatar';
import { Crown } from '../common/Crown';
import { ProgressBar } from './ProgressBar';
import { StreakBadge } from './StreakBadge';
import { colors, spacing, borderRadius, shadows } from '../../utils/constants';

interface ParticipantCardProps {
  /** Données du participant avec sa progression */
  participant: ParticipantWithProgress;
  /** Nombre total de pages du livre */
  totalPages: number;
  /** Callback au clic sur la carte */
  onPress?: () => void;
  /** C'est l'utilisateur courant */
  isCurrentUser?: boolean;
}

export function ParticipantCard({
  participant,
  totalPages,
  onPress,
  isCurrentUser = false,
}: ParticipantCardProps) {
  const { user, progress, percentage, isLeader, rank } = participant;
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isCurrentUser && styles.currentUserCard,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Rang à gauche */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, isLeader && styles.rankLeader]}>
          {rank}
        </Text>
      </View>
      
      {/* Avatar avec couronne si leader */}
      <View style={styles.avatarContainer}>
        <Avatar
          photoUrl={user.profilePhotoUrl}
          name={user.name}
          size={48}
          borderWidth={isCurrentUser ? 2 : 0}
          borderColor={colors.primary}
        />
        {isLeader && (
          <View style={styles.crownContainer}>
            <Crown size="small" />
          </View>
        )}
      </View>
      
      {/* Infos du participant */}
      <View style={styles.infoContainer}>
        {/* Nom et streak */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
            {isCurrentUser && ' (toi)'}
          </Text>
          {progress.streak > 0 && (
            <StreakBadge streak={progress.streak} size="small" />
          )}
        </View>
        
        {/* Pages lues */}
        <Text style={styles.pages}>
          {progress.currentPage} / {totalPages} pages
        </Text>
        
        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <ProgressBar
            percentage={percentage}
            height={6}
            color={isLeader ? colors.crown : colors.primary}
            showPercentage
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  currentUserCard: {
    backgroundColor: colors.primaryLight + '20', // 20 = ~12% opacité
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  rankLeader: {
    color: colors.crown,
    fontSize: 18,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  crownContainer: {
    position: 'absolute',
    top: -8,
    right: -4,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  pages: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
});

