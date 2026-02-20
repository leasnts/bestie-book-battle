/**
 * Écran Détail Projet
 * 
 * Affiche toutes les informations d'un projet de lecture :
 * - En-tête avec titre et progression globale
 * - Classement des participants avec couronne pour le leader
 * - Graphique de progression sur 30 jours
 * - Bouton pour mettre à jour sa progression
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FAB, Button, Chip, IconButton, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useProgressStore } from '../../stores/progressStore';
import { ParticipantCard } from '../../components/ui/ParticipantCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ProgressChart } from '../../components/charts/ProgressChart';
import { shareProject, copyInviteCode } from '../../utils/share';
import { colors, spacing, borderRadius, shadows } from '../../utils/constants';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentChallenge: currentProject, loadChallenge: selectProject, isLoading: projectLoading } = useProjectStore();
  const { 
    participants, 
    subscribeToProgress, 
    isLoading: progressLoading 
  } = useProgressStore();
  
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Charge le projet au montage
  useEffect(() => {
    if (id) {
      selectProject(id);
    }
  }, [id]);
  
  // S'abonne aux changements de progression (+ déclenche les notifications si un ami met à jour)
  useEffect(() => {
    if (currentProject && user?.id) {
      const totalPages = currentProject.total_pages ?? (currentProject as any).totalPages ?? 100;
      const bookTitle = currentProject.book_title ?? (currentProject as any).bookTitle ?? 'Le livre';
      const unsubscribe = subscribeToProgress(currentProject.id, {
        currentUserId: user.id,
        totalPages,
        bookTitle,
      });
      return () => unsubscribe();
    }
  }, [currentProject?.id, user?.id]);
  
  // Si pas de projet, affiche un loader ou revient en arrière
  if (!currentProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Calcule la progression moyenne du groupe
  const averageProgress = participants.length > 0
    ? Math.round(
        participants.reduce((sum, p) => sum + p.percentage, 0) / participants.length
      )
    : 0;
  
  // Trouve la progression de l'utilisateur actuel
  const currentUserProgress = participants.find(p => p.user.id === user?.id);
  
  // Partager le projet
  const handleShare = async () => {
    setMenuVisible(false);
    await shareProject(currentProject);
  };
  
  // Copier le code d'invitation
  const handleCopyCode = async () => {
    setMenuVisible(false);
    await copyInviteCode(currentProject.inviteCode);
    Alert.alert('Copié !', 'Le code d\'invitation a été copié dans le presse-papier');
  };
  
  // Naviguer vers la mise à jour de progression
  const handleUpdateProgress = () => {
    router.push(`/progress/update?projectId=${currentProject.id}`);
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: currentProject.bookTitle,
          headerRight: () => (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={handleShare}
                title="Partager"
                leadingIcon="share-variant"
              />
              <Menu.Item
                onPress={handleCopyCode}
                title="Copier le code"
                leadingIcon="content-copy"
              />
            </Menu>
          ),
        }}
      />
      
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* En-tête du projet */}
          <View style={styles.header}>
            {/* Icône du livre */}
            <View style={styles.bookIcon}>
              <Ionicons name="book" size={40} color={colors.primary} />
            </View>
            
            {/* Infos du livre */}
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{currentProject.bookTitle}</Text>
              {currentProject.bookAuthor && (
                <Text style={styles.bookAuthor}>{currentProject.bookAuthor}</Text>
              )}
              <Text style={styles.bookPages}>
                {currentProject.totalPages} pages
              </Text>
            </View>
          </View>
          
          {/* Code d'invitation */}
          <View style={styles.inviteSection}>
            <Text style={styles.inviteLabel}>Code d'invitation</Text>
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCode}>{currentProject.inviteCode}</Text>
              <IconButton
                icon="content-copy"
                size={20}
                onPress={handleCopyCode}
                iconColor={colors.primary}
              />
            </View>
          </View>
          
          {/* Progression du groupe */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Progression du groupe</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Moyenne</Text>
                <Text style={styles.progressPercentage}>{averageProgress}%</Text>
              </View>
              <ProgressBar
                percentage={averageProgress}
                height={12}
                color={colors.success}
              />
              <Text style={styles.participantsCount}>
                {participants.length} participant{participants.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          {/* Ta progression */}
          {currentUserProgress && (
            <View style={styles.yourProgressSection}>
              <Text style={styles.sectionTitle}>Ta progression</Text>
              <View style={styles.yourProgressCard}>
                <View style={styles.yourProgressInfo}>
                  <Text style={styles.yourProgressPages}>
                    {currentUserProgress.progress.currentPage} / {currentProject.totalPages}
                  </Text>
                  <Text style={styles.yourProgressLabel}>pages lues</Text>
                </View>
                <View style={styles.yourProgressBar}>
                  <ProgressBar
                    percentage={currentUserProgress.percentage}
                    height={10}
                    showPercentage
                  />
                </View>
                {currentUserProgress.progress.streak > 0 && (
                  <Chip
                    icon="fire"
                    style={styles.streakChip}
                    textStyle={styles.streakChipText}
                  >
                    {currentUserProgress.progress.streak} jours
                  </Chip>
                )}
              </View>
            </View>
          )}
          
          {/* Classement */}
          <View style={styles.rankingSection}>
            <Text style={styles.sectionTitle}>Classement</Text>
            {participants.map((participant) => (
              <ParticipantCard
                key={participant.user.id}
                participant={participant}
                totalPages={currentProject.totalPages}
                isCurrentUser={participant.user.id === user?.id}
              />
            ))}
          </View>
          
          {/* Graphique de progression */}
          <View style={styles.chartSection}>
            <ProgressChart
              participants={participants}
              totalPages={currentProject.totalPages}
            />
          </View>
        </ScrollView>
        
        {/* Bouton flottant pour mettre à jour la progression */}
        <FAB
          icon="pencil"
          label="Mettre à jour"
          onPress={handleUpdateProgress}
          style={styles.fab}
          color={colors.textOnPrimary}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100, // Espace pour le FAB
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  bookIcon: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bookPages: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  inviteSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  inviteLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
  },
  participantsCount: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  yourProgressSection: {
    marginBottom: spacing.md,
  },
  yourProgressCard: {
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  yourProgressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  yourProgressPages: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  yourProgressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  yourProgressBar: {
    marginBottom: spacing.sm,
  },
  streakChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningLight,
  },
  streakChipText: {
    color: colors.streak,
    fontWeight: '600',
  },
  rankingSection: {
    marginBottom: spacing.md,
  },
  chartSection: {
    marginBottom: spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});

