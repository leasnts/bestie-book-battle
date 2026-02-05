/**
 * 📚 BESTIE BOOK BATTLE - Écran principal
 * 
 * Light mode avec bleu Klein + vert
 * Lignes de cahier en fond
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useProgressStore } from '../../stores/progressStore';
import { useProjectStore } from '../../stores/projectStore';
import { useDemoStore, getDemoData } from '../../stores/demoStore';

// 🎨 Noir & Blanc + Bleu Klein + Orange flamme
const COLORS = {
  bg: '#FAFAF8',
  bgLines: '#E8E8E4',
  card: '#FFFFFF',
  cardBorder: '#E0E0E0',
  primary: '#002FA7',      // Bleu Klein
  primaryLight: '#3355CC',
  text: '#1A1A1A',
  textDim: '#6B7280',
  textMuted: '#9CA3AF',
  flame: '#F59E0B',        // Orange flamme
  crown: '#F59E0B',
};


// Helper pour résoudre les images de démo
const resolveImageSource = (ref: string | any) => {
  if (typeof ref === 'string') {
    switch (ref) {
      case 'lea':
        return require('../../assets/images/lea.png');
      case 'zoe':
        return require('../../assets/images/zoe.png');
      case 'cover':
        return require('../../assets/images/cover.jpg');
      default:
        return require('../../assets/images/lea.png');
    }
  }
  return ref;
};

// Formater la date
function formatLastUpdate(date: Date | undefined): string {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.max(1, seconds)}s`; // Minimum 1s
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mode } = useDemoStore();
  
  // Utiliser les données de démo selon le mode
  const demoData = getDemoData(mode);
  const currentProject = demoData.project;
  
  const { project: realProject } = useProjectStore();
  const {
    loadProjectProgress,
    updateProgress,
    getUserProgress,
    participants: realParticipants,
  } = useProgressStore();

  // État local pour les participants en mode démo
  // Permet de mettre à jour les données de démo quand on ajoute des pages
  const [demoParticipants, setDemoParticipants] = useState(demoData.participants);

  // Mettre à jour les participants de démo quand le mode change
  useEffect(() => {
    if (mode !== 'empty') {
      setDemoParticipants(demoData.participants);
    }
  }, [mode]);

  // En mode vide, on utilise les vraies données du store
  // En mode démo, on utilise les données fictives (avec état local)
  const participants = mode === 'empty' ? realParticipants : demoParticipants;

  // Plus besoin du picker de projet
  const [currentPageInput, setCurrentPageInput] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const numberScale = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Charger les vraies données seulement si pas en mode démo
  useEffect(() => {
    if (mode === 'empty' && realProject) {
      loadProjectProgress(realProject.id, realProject.totalPages);
    }
  }, [mode, realProject?.id]);


  // Utiliser les données de démo ou les vraies données
  const myDemoProgress = mode === 'empty' ? undefined : participants.find(p => p.user.id === 'demo_user_lea');
  const myProgress = myDemoProgress?.progress || (user ? getUserProgress(user.id) : undefined);
  const lastSavedPage = myProgress?.currentPage || 0;
  const myStreak = myProgress?.streak || 0;
  const myLastUpdate = myProgress?.lastUpdated;
  const totalPages = currentProject?.totalPages || 100;

  useEffect(() => {
    setCurrentPageInput(lastSavedPage);
  }, [lastSavedPage, currentProject?.id, mode, participants]);

  // Calculs
  const pagesRead = Math.max(0, currentPageInput - lastSavedPage);
  const myPercentage = Math.round((currentPageInput / totalPages) * 100);

  // Moyenne du groupe
  const totalReadPages = participants.reduce((acc, p) => acc + p.progress.currentPage, 0);
  const averagePercentage = participants.length > 0
    ? Math.round((totalReadPages / participants.length / totalPages) * 100)
    : 0;

  // Fonction pour le retour haptique
  // Sur le web, cette fonction ne fait rien car Vibration n'est pas supporté
  const haptic = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
  };

  const animateNumber = () => {
    Animated.sequence([
      Animated.timing(numberScale, { toValue: 1.08, duration: 60, useNativeDriver: true }),
      Animated.spring(numberScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const changePage = (delta: number) => {
    const newValue = Math.max(0, Math.min(currentPageInput + delta, totalPages));
    if (newValue !== currentPageInput) {
      setCurrentPageInput(newValue);
      animateNumber();
      haptic();
    }
  };

  const handleSave = async () => {
    if (pagesRead === 0 || !currentProject) return;
    
    // En mode démo, on met à jour les participants localement
    if (mode !== 'empty') {
      // Mettre à jour la progression de Léa (utilisateur démo)
      const updatedParticipants = demoParticipants.map(p => {
        if (p.user.id === 'demo_user_lea') {
          return {
            ...p,
            progress: {
              ...p.progress,
              currentPage: currentPageInput,
              lastUpdated: new Date(),
              streak: p.progress.streak + 1, // Incrémente le streak
            },
          };
        }
        return p;
      });

      // Recalculer le leader
      const maxPage = Math.max(...updatedParticipants.map(p => p.progress.currentPage));
      const finalParticipants = updatedParticipants.map(p => ({
        ...p,
        isLeader: p.progress.currentPage === maxPage,
      }));

      setDemoParticipants(finalParticipants);
      
      setShowSuccess(true);
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setShowSuccess(false);
        });
      }, 1500);
      return;
    }
    
    // Vraie sauvegarde seulement si mode vide
    if (!user) return;
    try {
      await updateProgress(currentProject.id, user.id, currentPageInput);
      setShowSuccess(true);
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setShowSuccess(false);
        });
      }, 1500);
    } catch (error) {
      console.error(error);
    }
  };


  // Plus de sélection de projet interactive


  return (
    <View style={styles.container}>
      {/* Lignes de cahier en fond */}
      <View style={styles.linesBackground}>
        {[...Array(30)].map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30, justifyContent: 'space-between', flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* ═══════════ TOP BAR ═══════════ */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.push('/profile')} style={styles.topBarLeft}>
            <Image
              source={resolveImageSource(
                mode === 'empty' || mode === 'solo' || mode === 'with_friend' 
                  ? 'lea' 
                  : user?.profilePhotoUrl || 'lea'
              )}
              style={styles.topBarAvatar}
            />
          </Pressable>

          <Pressable onPress={() => router.push('/activity')} style={styles.topBarIcon}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textDim} />
          </Pressable>
        </View>

        {/* ═══════════ BANDEAU LIVRE + PROGRESSION (AVEC COVER) ═══════════ */}
        {currentProject ? (
          <View style={styles.bookBanner}>
          {/* Cover du livre à gauche */}
          <Image
            source={resolveImageSource(currentProject.coverUri || 'cover')}
            style={styles.bookCover}
          />

          {/* Info du livre à droite */}
          <View style={styles.bookBannerRight}>
            {/* Auteur */}
            <Text style={styles.bookAuthor} numberOfLines={1}>
              {currentProject.bookAuthor || 'Auteur inconnu'}
            </Text>

            {/* Titre + Badge pages */}
            <View style={styles.bookTitleRow}>
              <Text style={styles.bookTitle} numberOfLines={2}>
                {currentProject.bookTitle}
              </Text>
              <View style={styles.pagesBadge}>
                <Text style={styles.pagesBadgeText}>{totalPages}p</Text>
              </View>
            </View>

            {/* Barre de progression commune (moyenne) */}
            <View style={styles.avgProgressContainer}>
              <View style={styles.avgProgressBar}>
                <View style={[styles.avgProgressFill, { width: `${averagePercentage}%` }]} />
              </View>
              <Text style={styles.avgProgressText}>{averagePercentage}%</Text>
            </View>
          </View>
        </View>
        ) : null}

        {/* ═══════════ ZONE PRINCIPALE ═══════════ */}
        {currentProject ? (
          <View style={styles.mainSection}>
          <View style={styles.counter}>
            <Pressable
              onPress={() => changePage(-1)}
              onLongPress={() => changePage(-10)}
              delayLongPress={300}
              disabled={currentPageInput <= 0}
              style={[
                styles.counterBtn,
                currentPageInput <= 0 && styles.counterBtnDisabled
              ]}
            >
              <Ionicons
                name="remove"
                size={24}
                color={currentPageInput <= 0 ? COLORS.textMuted : COLORS.text}
              />
            </Pressable>

            <Animated.View style={[styles.pageDisplay, { transform: [{ scale: numberScale }] }]}>
              <Text style={styles.pagePrefix}>p.</Text>
              <Text style={styles.bigNumber}>{currentPageInput}</Text>
            </Animated.View>

            <Pressable
              onPress={() => changePage(1)}
              onLongPress={() => changePage(10)}
              delayLongPress={300}
              disabled={currentPageInput >= totalPages}
              style={[styles.counterBtn, styles.counterBtnPlus]}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </Pressable>
          </View>

          <View style={styles.quickBtns}>
            {[5, 10, 25].map(n => (
              <Pressable
                key={n}
                onPress={() => changePage(n)}
                style={styles.quickBtn}
              >
                <Text style={styles.quickBtnText}>+{n}</Text>
              </Pressable>
            ))}
          </View>

          {pagesRead > 0 && (
            <View style={styles.actionBtns}>
              <Pressable
                onPress={() => setCurrentPageInput(lastSavedPage)}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Annuler</Text>
              </Pressable>

              <Pressable onPress={handleSave} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Ajouter</Text>
              </Pressable>
            </View>
          )}
        </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="book-outline" size={80} color="#D0D0D0" style={{ marginBottom: 24 }} />
            <Text style={styles.emptyStateTitle}>Aucun projet de lecture</Text>
            <Text style={styles.emptyStateSubtitle}>
              Crée un projet ou rejoins celui de tes amis pour commencer
            </Text>

            <View style={styles.emptyStateButtons}>
              <Pressable 
                onPress={() => router.push('/onboarding/create')}
                style={styles.primaryBtnEmpty}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Créer un projet</Text>
              </Pressable>

              <Pressable 
                onPress={() => router.push('/project/join')}
                style={styles.secondaryBtnEmpty}
              >
                <Ionicons name="enter-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.secondaryBtnTextEmpty}>Rejoindre un projet</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ═══════════ STATS - LISTE PARTICIPANTS ═══════════ */}
        {currentProject && (
          <View style={styles.statsContainer}>
            {participants.length > 0 ? (
              <View style={styles.statsGrid}>
                {participants.map((p, index) => {
            const isMe = mode === 'empty' ? p.user.id === user?.id : (p.user.id === 'demo_user_lea' || p.user.id === user?.id);
            const progress = p.progress;
            const percentage = Math.round((progress.currentPage / totalPages) * 100);
            const timeAgo = formatLastUpdate(progress.lastUpdated);

            return (
              <View
                key={p.user.id}
                style={styles.statRow}
              >
                <View style={styles.statHeader}>
                  <View style={styles.statHeaderLeft}>
                    <Image
                      source={resolveImageSource(p.user.profilePhotoUrl || 'lea')}
                      style={styles.statAvatar}
                    />
                    <Text style={styles.statName}>
                      {isMe ? 'Toi' : p.user.name}
                    </Text>
                    {p.isLeader && <Ionicons name="trophy" size={14} color={COLORS.crown} style={{ marginLeft: 4 }} />}
                  </View>
                  <Text style={styles.timeAgoText}>{timeAgo}</Text>
                </View>

                <View style={styles.statPageRow}>
                  <Text style={styles.statPage}>{progress.currentPage}</Text>
                  {progress.streak > 0 && (
                    <View style={styles.miniStreak}>
                      <Ionicons name="flame" size={12} color={COLORS.flame} />
                      <Text style={styles.miniStreakText}>{progress.streak}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.percentageText}>{percentage}%</Text>
                </View>
              </View>
            );
          })}
              </View>
            ) : (
              <View style={[styles.statRow, styles.statRowEmpty, { justifyContent: 'center', paddingVertical: 40 }]}>
                <Ionicons name="people-outline" size={48} color="#D0D0D0" />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ═══════════ SUCCÈS ═══════════ */}
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, { opacity: successAnim }]}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
          <Text style={styles.successText}>Enregistré !</Text>
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
  emptyText: {
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 100,
  },

  // Lignes de cahier
  linesBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgLines,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
  },
  topBarLeft: {
    width: 50,
  },
  topBarAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: COLORS.text,  // Bordure noire
  },

  topBarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  // Bandeau livre avec cover
  bookBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  bookCover: {
    width: 70,
    height: 70,
    borderRadius: 6,
  },
  bookBannerRight: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookAuthor: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textDim,
    marginBottom: 2,
  },
  bookTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bookTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
  },
  pagesBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pagesBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avgProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avgProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bgLines,
    borderRadius: 3,
    overflow: 'hidden',
  },
  avgProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  avgProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDim,
    minWidth: 35,
  },

  // Zone principale
  mainSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pageDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  pagePrefix: {
    fontSize: 24,
    fontWeight: '500',
    color: COLORS.textDim,
    marginRight: 4,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  counterBtnPlus: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  bigNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: COLORS.primary,
    minWidth: 80,
    textAlign: 'center',
  },
  quickBtns: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  quickBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDim,
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },

  // Comparaison restructurée - Grille 2 colonnes
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statRow: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    width: '48%',
    flexGrow: 0,
    flexShrink: 0,
  },
  statRowEmpty: {
    width: '100%',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeAgoText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statPageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statPage: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bgLines,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDim,
  },
  miniStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.flame + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  miniStreakText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.flame,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Succès
  successOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  emptyStateButtons: {
    width: '100%',
    gap: 16,
  },
  primaryBtnEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  secondaryBtnEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    width: '100%',
  },
  secondaryBtnTextEmpty: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },

});

