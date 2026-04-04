/**
 * 📖 ÉCRAN PRINCIPAL - Où en es-tu dans ta lecture ?
 * 
 * L'utilisateur entre son NUMÉRO DE PAGE actuel
 * Le calcul des pages lues se fait automatiquement
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useProgressStore } from '../../stores/progressStore';
import { handleOwnProgressUpdateMilestones } from '../../services/notificationTriggers';
import { cancelNotificationById, NOTIFICATION_IDS } from '../../services/notifications';

// 🎨 Palette de couleurs - Thème sombre néon
const COLORS = {
  bg: '#0D0D12',
  card: '#1A1A24',
  primary: '#7C3AED',
  primaryGlow: '#A78BFA',
  accent: '#06D6A0',
  accentDark: '#059669',
  text: '#FFFFFF',
  textDim: '#71717A',
  danger: '#EF4444',
};

// 🎉 Messages fun selon les pages lues
const getEncouragement = (pagesRead: number) => {
  if (pagesRead === 0) return { emoji: '📖', text: 'Où en es-tu ?' };
  if (pagesRead < 5) return { emoji: '👍', text: 'Bon début !' };
  if (pagesRead < 10) return { emoji: '🔥', text: 'En forme !' };
  if (pagesRead < 20) return { emoji: '⚡', text: 'Inarrêtable !' };
  if (pagesRead < 30) return { emoji: '🚀', text: 'Machine à lire !' };
  if (pagesRead < 50) return { emoji: '🏆', text: 'Champion !' };
  return { emoji: '👑', text: 'Légende absolue !' };
};

export default function UpdateProgressScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { user } = useAuthStore();
  const { currentChallenge: currentProject, loadChallenge: selectProject } = useProjectStore();
  const { updateProgress, getUserProgressById, loadChallengeProgress, isLoading } = useProgressStore();
  
  // State - Le numéro de page actuel
  const [currentPageInput, setCurrentPageInput] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  
  // Animations
  const numberScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  
  // Charge le projet si nécessaire
  useEffect(() => {
    if (projectId && !currentProject) {
      selectProject(projectId);
    }
    if (projectId && currentProject) {
      loadChallengeProgress(projectId);
    }
  }, [projectId, currentProject?.id]);
  
  // Initialise avec la page actuelle de l'utilisateur
  const userProgress = user ? getUserProgressById(user.id) : undefined;
  const lastSavedPage = userProgress?.current_page || 0;
  // Utiliser le total_pages de l'édition du participant, avec fallback sur celui du challenge
  const totalPages = userProgress?.total_pages
    ?? currentProject?.total_pages
    ?? 100;
  
  // Initialise l'input avec la dernière page sauvegardée
  useEffect(() => {
    if (lastSavedPage > 0 && currentPageInput === 0) {
      setCurrentPageInput(lastSavedPage);
    }
  }, [lastSavedPage]);
  
  // Calculs
  const pagesRead = Math.max(0, currentPageInput - lastSavedPage);
  const percentage = Math.round((currentPageInput / totalPages) * 100);
  const hasProgress = pagesRead > 0;
  
  const encouragement = getEncouragement(pagesRead);
  
  // Vibration légère (mobile)
  const hapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
  };
  
  // Animation du nombre
  const animateNumber = () => {
    Animated.sequence([
      Animated.timing(numberScale, {
        toValue: 1.1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(numberScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Changer la page
  const changePage = (delta: number) => {
    const newValue = Math.max(lastSavedPage, Math.min(currentPageInput + delta, totalPages));
    if (newValue !== currentPageInput) {
      setCurrentPageInput(newValue);
      animateNumber();
      hapticFeedback();
    }
  };
  
  // Aller directement à une page
  const goToPage = (page: number) => {
    const newValue = Math.max(lastSavedPage, Math.min(page, totalPages));
    setCurrentPageInput(newValue);
    animateNumber();
  };
  
  // Célébration !
  const celebrate = () => {
    setShowCelebration(true);
    setCelebrationMessage(getEncouragement(pagesRead).text);
    
    Animated.spring(celebrationAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    setTimeout(() => {
      router.back();
    }, 2000);
  };
  
  // Sauvegarder
  const handleSave = async () => {
    if (!hasProgress || !user || !projectId) return;
    
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    
    try {
      await updateProgress(projectId, user.id, currentPageInput);

      // L'utilisateur vient de lire → annuler les notifs planifiées
      // "inactivité" et "streak en danger" qui ne sont plus pertinentes.
      cancelNotificationById(NOTIFICATION_IDS.INACTIVITY).catch(() => {});
      cancelNotificationById(NOTIFICATION_IDS.STREAK_AT_RISK).catch(() => {});

      // Déclencher les notifications de milestones (50%, 100 pages, livre terminé, etc.)
      handleOwnProgressUpdateMilestones(
        projectId,
        lastSavedPage,
        currentPageInput,
        totalPages,
        currentProject?.book_title ?? 'Ton livre',
        user.profile_photo_url ?? null
      ).catch(() => {});
      celebrate();
    } catch (error) {
      console.error(error);
    }
  };

  // Loading state
  if (!currentProject) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textDim} />
        </Pressable>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {currentProject?.book_title || 'Mon livre'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Question principale */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionEmoji}>📖</Text>
        <Text style={styles.question}>
          Tu en es où ?
        </Text>
        <Text style={styles.subQuestion}>
          Dernière fois : page {lastSavedPage}
        </Text>
      </View>
      
      {/* Compteur de page - LE NUMÉRO DE PAGE ACTUEL */}
      <View style={styles.counterContainer}>
        {/* Bouton - */}
        <Pressable
          onPress={() => changePage(-1)}
          onLongPress={() => changePage(-10)}
          delayLongPress={300}
          disabled={currentPageInput <= lastSavedPage}
          style={({ pressed }) => [
            styles.counterBtn,
            styles.counterBtnMinus,
            pressed && styles.counterBtnPressed,
            currentPageInput <= lastSavedPage && styles.counterBtnDisabled,
          ]}
        >
          <Ionicons name="remove" size={28} color={currentPageInput <= lastSavedPage ? COLORS.textDim : COLORS.text} />
        </Pressable>
        
        {/* Numéro de page */}
        <Animated.View style={[styles.numberContainer, { transform: [{ scale: numberScale }] }]}>
          <Text style={styles.pageLabel}>Page</Text>
          <Text style={styles.bigNumber}>{currentPageInput}</Text>
          <Text style={styles.totalPages}>/ {totalPages}</Text>
        </Animated.View>
        
        {/* Bouton + */}
        <Pressable
          onPress={() => changePage(1)}
          onLongPress={() => changePage(10)}
          delayLongPress={300}
          disabled={currentPageInput >= totalPages}
          style={({ pressed }) => [
            styles.counterBtn,
            styles.counterBtnPlus,
            pressed && styles.counterBtnPressed,
            currentPageInput >= totalPages && styles.counterBtnDisabled,
          ]}
        >
          <Ionicons name="add" size={28} color={COLORS.bg} />
        </Pressable>
      </View>
      
      {/* Pages lues aujourd'hui */}
      {hasProgress && (
        <View style={styles.pagesReadBadge}>
          <Text style={styles.pagesReadText}>+{pagesRead} pages aujourd'hui</Text>
          <Text style={styles.encouragementEmoji}>{encouragement.emoji}</Text>
        </View>
      )}
      
      {/* Encouragement */}
      <View style={styles.encouragementContainer}>
        <Text style={styles.encouragementText}>{encouragement.text}</Text>
      </View>
      
      {/* Raccourcis - Sauts de pages */}
      <View style={styles.quickButtons}>
        <Text style={styles.quickLabel}>Avancer de :</Text>
        <View style={styles.quickRow}>
          {[5, 10, 20, 50].map((amount) => (
            <Pressable
              key={amount}
              onPress={() => changePage(amount)}
              disabled={currentPageInput + amount > totalPages}
              style={({ pressed }) => [
                styles.quickBtn,
                pressed && styles.quickBtnPressed,
                currentPageInput + amount > totalPages && styles.quickBtnDisabled,
              ]}
            >
              <Text style={[
                styles.quickBtnText,
                currentPageInput + amount > totalPages && styles.quickBtnTextDisabled
              ]}>+{amount}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      {/* Barre de progression */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            {/* Ancienne progression */}
            <View 
              style={[
                styles.progressFillOld, 
                { width: `${Math.round((lastSavedPage / totalPages) * 100)}%` }
              ]} 
            />
            {/* Nouvelle progression */}
            <View 
              style={[
                styles.progressFillNew, 
                { width: `${percentage}%` }
              ]} 
            />
          </View>
        </View>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>
      
      {/* Bouton Valider */}
      <Animated.View style={[styles.saveButtonContainer, { transform: [{ scale: buttonScale }] }]}>
        <Pressable
          onPress={handleSave}
          disabled={!hasProgress || isLoading}
          style={[
            styles.saveButton,
            !hasProgress && styles.saveButtonDisabled,
          ]}
        >
          {hasProgress ? (
            <View style={styles.saveButtonContent}>
              <Text style={styles.saveButtonText}>C'est noté !</Text>
              <Text style={styles.saveButtonSub}>+{pagesRead} pages ✨</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Avance dans ta lecture</Text>
          )}
        </Pressable>
      </Animated.View>
      
      {/* Astuce */}
      <Text style={styles.tip}>
        💡 Appui long = +10 pages
      </Text>
      
      {/* Overlay de célébration */}
      {showCelebration && (
        <Animated.View 
          style={[
            styles.celebrationOverlay,
            { 
              opacity: celebrationAnim,
              transform: [{ scale: celebrationAnim }] 
            }
          ]}
        >
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationTitle}>Bravo !</Text>
          <Text style={styles.celebrationPages}>+{pagesRead} pages</Text>
          <Text style={styles.celebrationSub}>Tu es à la page {currentPageInput}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textDim,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  questionContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  questionEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  question: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subQuestion: {
    fontSize: 14,
    color: COLORS.textDim,
    marginTop: 6,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnMinus: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.textDim + '40',
  },
  counterBtnPlus: {
    backgroundColor: COLORS.accent,
  },
  counterBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  counterBtnDisabled: {
    opacity: 0.3,
  },
  numberContainer: {
    minWidth: 140,
    alignItems: 'center',
  },
  pageLabel: {
    fontSize: 14,
    color: COLORS.textDim,
    marginBottom: -4,
  },
  bigNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 80,
  },
  totalPages: {
    fontSize: 16,
    color: COLORS.textDim,
    marginTop: -6,
  },
  pagesReadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent + '20',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 8,
    marginBottom: 8,
  },
  pagesReadText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
  },
  encouragementContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  encouragementEmoji: {
    fontSize: 18,
  },
  encouragementText: {
    fontSize: 14,
    color: COLORS.primaryGlow,
    fontWeight: '500',
  },
  quickButtons: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  quickLabel: {
    fontSize: 12,
    color: COLORS.textDim,
    marginBottom: 8,
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  quickBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  quickBtnPressed: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickBtnDisabled: {
    opacity: 0.3,
  },
  quickBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryGlow,
  },
  quickBtnTextDisabled: {
    color: COLORS.textDim,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFillOld: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.textDim + '60',
    borderRadius: 4,
  },
  progressFillNew: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDim,
    minWidth: 45,
    textAlign: 'right',
  },
  saveButtonContainer: {
    marginHorizontal: 24,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.card,
  },
  saveButtonContent: {
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  saveButtonSub: {
    fontSize: 13,
    color: COLORS.text + 'CC',
    marginTop: 2,
  },
  tip: {
    fontSize: 12,
    color: COLORS.textDim,
    textAlign: 'center',
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg + 'FA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  celebrationEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  celebrationPages: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  celebrationSub: {
    fontSize: 16,
    color: COLORS.textDim,
  },
});
