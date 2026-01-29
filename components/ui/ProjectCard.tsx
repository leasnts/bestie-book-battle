/**
 * Composant ProjectCard
 * 
 * Carte qui affiche un aperçu d'un projet de lecture :
 * - Titre du livre
 * - Auteur (optionnel)
 * - Progression personnelle
 * - Nombre de participants
 * - Date de début
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Project, UserProgress } from '../../types';
import { ProgressBar } from './ProgressBar';
import { colors, spacing, borderRadius, shadows } from '../../utils/constants';

interface ProjectCardProps {
  /** Données du projet */
  project: Project;
  /** Progression de l'utilisateur courant dans ce projet */
  userProgress?: UserProgress;
  /** Callback au clic sur la carte */
  onPress: () => void;
}

export function ProjectCard({
  project,
  userProgress,
  onPress,
}: ProjectCardProps) {
  // Calcule le pourcentage de progression
  const percentage = userProgress && project.totalPages > 0
    ? Math.round((userProgress.currentPage / project.totalPages) * 100)
    : 0;
  
  // Formate la date de début
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {/* En-tête avec icône de livre */}
      <View style={styles.header}>
        <View style={styles.bookIconContainer}>
          <Ionicons name="book" size={24} color={colors.primary} />
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {project.bookTitle}
          </Text>
          {project.bookAuthor && (
            <Text style={styles.author} numberOfLines={1}>
              {project.bookAuthor}
            </Text>
          )}
        </View>
      </View>
      
      {/* Barre de progression */}
      <View style={styles.progressSection}>
        <ProgressBar
          percentage={percentage}
          height={8}
          showPercentage
        />
        <Text style={styles.pagesText}>
          {userProgress?.currentPage || 0} / {project.totalPages} pages
        </Text>
      </View>
      
      {/* Footer avec métadonnées */}
      <View style={styles.footer}>
        {/* Nombre de participants */}
        <View style={styles.footerItem}>
          <Ionicons name="people" size={16} color={colors.textSecondary} />
          <Text style={styles.footerText}>
            {project.participants.length} participant{project.participants.length > 1 ? 's' : ''}
          </Text>
        </View>
        
        {/* Date de début */}
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.footerText}>
            Depuis le {formatDate(project.startDate)}
          </Text>
        </View>
      </View>
      
      {/* Badge si projet terminé */}
      {project.isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ Terminé</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  bookIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  author: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  pagesText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  completedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
});

