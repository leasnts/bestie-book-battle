/**
 * BESTIE BOOK BATTLE - Ecran principal
 * 
 * Affiche le challenge actif de l'utilisateur avec :
 * - Le bandeau livre (cover, titre, auteur, progression)
 * - Un dropdown pour naviguer entre tous les projets
 * - Le compteur de pages pour enregistrer sa lecture
 * - La liste des participants avec leurs progressions
 * 
 * Toutes les données viennent de Supabase (pas de données fictives).
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  Vibration,
  View
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useProgressStore } from '../../stores/progressStore';
import { useProjectStore } from '../../stores/projectStore';

// Active LayoutAnimation sur Android
// (sur iOS c'est déjà activé par défaut)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Palette de couleurs : Noir & Blanc + Bleu Klein + Orange flamme
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

/**
 * Résout la source d'une image : gère les URLs Supabase (http/https)
 * et les images locales embarquées dans l'app.
 * 
 * - Si c'est une URL http(s) → retourne { uri: url }
 * - Si c'est une ref locale connue ('lea', 'zoe', 'cover') → retourne le require()
 * - Sinon → fallback sur l'image par défaut
 */
const resolveImageSource = (ref: string | null | undefined) => {
  if (!ref) return require('../../assets/images/cover.jpg');
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return { uri: ref };
  }
  switch (ref) {
    case 'lea':
      return require('../../assets/images/lea.png');
    case 'zoe':
      return require('../../assets/images/zoe.png');
    case 'cover':
      return require('../../assets/images/cover.jpg');
    default:
      return require('../../assets/images/cover.jpg');
  }
};

/**
 * Résout la source d'un avatar utilisateur.
 * Même logique que resolveImageSource mais avec un fallback sur lea.png
 */
const resolveAvatarSource = (ref: string | null | undefined) => {
  if (!ref) return require('../../assets/images/lea.png');
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return { uri: ref };
  }
  switch (ref) {
    case 'lea':
      return require('../../assets/images/lea.png');
    case 'zoe':
      return require('../../assets/images/zoe.png');
    default:
      return require('../../assets/images/lea.png');
  }
};

/**
 * Formate une date en temps relatif (ex: "3j", "2h", "5m")
 * Utilisé pour afficher quand un participant a lu pour la dernière fois
 */
function formatLastUpdate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'maintenant';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // ===== Stores Supabase =====
  // projectStore : gère la liste des challenges et le challenge actif
  const {
    challenges,
    activeChallenge,
    setActiveChallenge,
    loadUserChallenges,
    isLoading: projectsLoading,
  } = useProjectStore();

  // progressStore : gère les progressions et participants du challenge actif
  const {
    loadChallengeProgress,
    updateProgress,
    getUserProgressById,
    participants,
  } = useProgressStore();

  // ===== État local =====
  const [currentPageInput, setCurrentPageInput] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);

  // Animations
  const numberScale = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // ===== Chargement des données au montage =====
  // Quand l'utilisateur est connecté, on charge tous ses challenges depuis Supabase.
  // loadUserChallenges sélectionne automatiquement le dernier challenge actif.
  useEffect(() => {
    if (user?.id) {
      loadUserChallenges(user.id);
    }
  }, [user?.id]);

  // Quand le challenge actif change, on charge ses participants et progressions.
  // C'est ça qui alimente la liste des participants et la barre de progression.
  useEffect(() => {
    if (activeChallenge?.id) {
      loadChallengeProgress(activeChallenge.id);
    }
  }, [activeChallenge?.id]);

  // ===== Données dérivées du challenge actif =====
  // On extrait les infos de progression de l'utilisateur connecté
  const myProgress = user ? getUserProgressById(user.id) : undefined;
  const lastSavedPage = myProgress?.current_page || 0;
  const totalPages = activeChallenge?.total_pages || 100;

  // Quand la page sauvegardée change (après un enregistrement), on met à jour l'input
  useEffect(() => {
    setCurrentPageInput(lastSavedPage);
  }, [lastSavedPage, activeChallenge?.id]);

  // Calculs de progression
  const pagesRead = Math.max(0, currentPageInput - lastSavedPage);

  // Moyenne de progression du groupe (tous les participants)
  const totalReadPages = participants.reduce((acc, p) => acc + p.progress.current_page, 0);
  const averagePercentage = participants.length > 0
    ? Math.round((totalReadPages / participants.length / totalPages) * 100)
    : 0;

  // ===== Retour haptique =====
  // Petite vibration quand on change de page (feedback tactile)
  const haptic = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
  };

  // Animation du compteur (petit rebond quand le chiffre change)
  const animateNumber = () => {
    Animated.sequence([
      Animated.timing(numberScale, { toValue: 1.08, duration: 60, useNativeDriver: true }),
      Animated.spring(numberScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  // ===== Changer de page (+ ou -) =====
  const changePage = (delta: number) => {
    const newValue = Math.max(0, Math.min(currentPageInput + delta, totalPages));
    if (newValue !== currentPageInput) {
      setCurrentPageInput(newValue);
      animateNumber();
      haptic();
    }
  };

  // ===== Enregistrer la progression =====
  // Sauvegarde dans Supabase via le progressStore.
  // Les triggers SQL calculent automatiquement le pourcentage, le streak, etc.
  const handleSave = async () => {
    if (pagesRead === 0 || !activeChallenge || !user) return;

    try {
      await updateProgress(activeChallenge.id, user.id, currentPageInput);
      // Feedback visuel de succès
      setShowSuccess(true);
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setShowSuccess(false);
        });
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // ===== Toggle du dropdown de projets =====
  // Utilise LayoutAnimation pour une transition fluide
  const toggleProjectList = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowProjectList(prev => !prev);
  }, []);

  // ===== Sélection d'un projet dans le dropdown =====
  const selectProject = useCallback((challenge: typeof activeChallenge) => {
    if (!challenge) return;
    setActiveChallenge(challenge);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowProjectList(false);
  }, [setActiveChallenge]);

  return (
    <View style={styles.container}>
      {/* Lignes de cahier en fond (effet visuel) */}
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
              source={resolveAvatarSource(user?.profile_photo_url)}
              style={styles.topBarAvatar}
            />
          </Pressable>

          <Pressable onPress={() => router.push('/activity')} style={styles.topBarIcon}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textDim} />
          </Pressable>
        </View>

        {/* ═══════════ BANDEAU LIVRE + PROGRESSION ═══════════ */}
        {activeChallenge ? (
          <View style={styles.bookSection}>
            {/* Bandeau principal : pressable pour ouvrir/fermer le dropdown */}
            <Pressable onPress={toggleProjectList} style={styles.bookBanner}>
              {/* Cover du livre à gauche */}
              <Image
                source={resolveImageSource(activeChallenge.cover_url)}
                style={styles.bookCover}
              />

              {/* Info du livre à droite */}
              <View style={styles.bookBannerRight}>
                {/* Auteur */}
                <Text style={styles.bookAuthor} numberOfLines={1}>
                  {activeChallenge.book_author || 'Auteur inconnu'}
                </Text>

                {/* Titre + Badge pages */}
                <View style={styles.bookTitleRow}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {activeChallenge.book_title}
                  </Text>
                  <View style={styles.pagesBadge}>
                    <Text style={styles.pagesBadgeText}>{totalPages}p</Text>
                  </View>
                </View>

                {/* Barre de progression moyenne du groupe */}
                <View style={styles.avgProgressContainer}>
                  <View style={styles.avgProgressBar}>
                    <View style={[styles.avgProgressFill, { width: `${averagePercentage}%` }]} />
                  </View>
                  <Text style={styles.avgProgressText}>{averagePercentage}%</Text>
                </View>
              </View>

              {/* Chevron pour indiquer que c'est cliquable */}
              <View style={styles.chevronContainer}>
                <Ionicons
                  name={showProjectList ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </View>
            </Pressable>

            {/* ═══════════ DROPDOWN LISTE DES PROJETS ═══════════ */}
            {showProjectList && (
              <View style={styles.projectDropdown}>
                {challenges.map((challenge) => {
                  const isActive = challenge.id === activeChallenge.id;
                  const progressPct = Math.round(challenge.average_progress_percentage || 0);

                  return (
                    <Pressable
                      key={challenge.id}
                      onPress={() => selectProject(challenge)}
                      style={[
                        styles.projectDropdownItem,
                        isActive && styles.projectDropdownItemActive,
                      ]}
                    >
                      <Image
                        source={resolveImageSource(challenge.cover_url)}
                        style={styles.projectDropdownCover}
                      />
                      <View style={styles.projectDropdownInfo}>
                        <Text style={styles.projectDropdownTitle} numberOfLines={1}>
                          {challenge.book_title}
                        </Text>
                        <Text style={styles.projectDropdownAuthor} numberOfLines={1}>
                          {challenge.book_author || 'Auteur inconnu'}
                        </Text>
                        {/* Mini barre de progression */}
                        <View style={styles.projectDropdownProgressRow}>
                          <View style={styles.projectDropdownProgressBg}>
                            <View style={[styles.projectDropdownProgressFill, { width: `${progressPct}%` }]} />
                          </View>
                          <Text style={styles.projectDropdownProgressText}>{progressPct}%</Text>
                        </View>
                      </View>
                      {isActive && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      )}
                    </Pressable>
                  );
                })}

                {/* Bouton "Nouveau projet" en bas du dropdown */}
                <Pressable
                  onPress={() => {
                    setShowProjectList(false);
                    router.push('/project/create');
                  }}
                  style={styles.newProjectButton}
                >
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.newProjectButtonText}>Nouveau projet</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}

        {/* ═══════════ ZONE PRINCIPALE : COMPTEUR DE PAGES ═══════════ */}
        {activeChallenge ? (
          <View style={styles.mainSection}>
            <View style={styles.counter}>
              {/* Bouton - (tap = -1, long press = -10) */}
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

              {/* Affichage du numéro de page avec animation de scale */}
              <Animated.View style={[styles.pageDisplay, { transform: [{ scale: numberScale }] }]}>
                <Text style={styles.pagePrefix}>p.</Text>
                <Text style={styles.bigNumber}>{currentPageInput}</Text>
              </Animated.View>

              {/* Bouton + (tap = +1, long press = +10) */}
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

            {/* Boutons d'ajout rapide (+5, +10, +25) */}
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

            {/* Boutons Annuler / Ajouter (visibles seulement si des pages ont été ajoutées) */}
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
          /* ═══════════ ÉTAT VIDE : AUCUN PROJET ═══════════ */
          <View style={styles.emptyStateContainer}>
            <Ionicons name="book-outline" size={80} color="#D0D0D0" style={{ marginBottom: 24 }} />
            <Text style={styles.emptyStateTitle}>Aucun projet de lecture</Text>
            <Text style={styles.emptyStateSubtitle}>
              Crée un projet ou rejoins celui de tes amis pour commencer
            </Text>

            <View style={styles.emptyStateButtons}>
              <Pressable 
                onPress={() => router.push('/project/create')}
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

        {/* ═══════════ STATS - LISTE DES PARTICIPANTS ═══════════ */}
        {activeChallenge && (
          <View style={styles.statsContainer}>
            {participants.length > 0 ? (
              <View style={styles.statsGrid}>
                {participants.map((p) => {
                  // Déterminer si c'est l'utilisateur connecté
                  const isMe = p.user.id === user?.id;
                  const progress = p.progress;
                  const percentage = Math.round((progress.current_page / totalPages) * 100);
                  const timeAgo = formatLastUpdate(progress.last_updated_at);

                  return (
                    <View
                      key={p.user.id}
                      style={styles.statRow}
                    >
                      <View style={styles.statHeader}>
                        <View style={styles.statHeaderLeft}>
                          <Image
                            source={resolveAvatarSource(p.user.profile_photo_url)}
                            style={styles.statAvatar}
                          />
                          <Text style={styles.statName}>
                            {isMe ? 'Toi' : p.user.first_name}
                          </Text>
                          {p.isLeader && <Ionicons name="trophy" size={14} color={COLORS.crown} style={{ marginLeft: 4 }} />}
                        </View>
                        <Text style={styles.timeAgoText}>{timeAgo}</Text>
                      </View>

                      <View style={styles.statPageRow}>
                        <Text style={styles.statPage}>{progress.current_page}</Text>
                        {progress.streak_count > 0 && (
                          <View style={styles.miniStreak}>
                            <Ionicons name="flame" size={12} color={COLORS.flame} />
                            <Text style={styles.miniStreakText}>{progress.streak_count}</Text>
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

      {/* ═══════════ TOAST DE SUCCÈS ═══════════ */}
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
    borderColor: COLORS.text,
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

  // Section livre (bandeau + dropdown)
  bookSection: {
    marginHorizontal: 16,
  },

  // Bandeau livre avec cover
  bookBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
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

  // Chevron sur le bandeau
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },

  // Dropdown liste des projets
  projectDropdown: {
    backgroundColor: COLORS.card,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  projectDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgLines,
  },
  projectDropdownItemActive: {
    backgroundColor: COLORS.primary + '08',
  },
  projectDropdownCover: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  projectDropdownInfo: {
    flex: 1,
  },
  projectDropdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  projectDropdownAuthor: {
    fontSize: 12,
    color: COLORS.textDim,
    marginBottom: 4,
  },
  projectDropdownProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectDropdownProgressBg: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.bgLines,
    borderRadius: 2,
    overflow: 'hidden',
  },
  projectDropdownProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  projectDropdownProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDim,
    minWidth: 28,
  },
  newProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  newProjectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
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

  // Grille des participants
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

  // Toast de succès
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

  // État vide
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
