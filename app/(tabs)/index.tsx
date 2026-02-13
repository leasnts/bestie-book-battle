/**
 * BESTIE BOOK BATTLE - Home Page (refonte Figma)
 * 
 * Page d'accueil de l'application, divisée en 4 sections :
 * 
 * 1. HEADER : avatar profil (gauche) | PopEyes mascotte (centre) | bouton notification (droite)
 * 2. SECTION LIVRES : pile de couvertures empilées + détails du livre actif + progression circulaire
 * 3. SÉLECTEUR DE PAGE : scroll horizontal pour choisir sa page + boutons undo/valider
 * 4. CARTE DE PROGRESSION : comparaison "Moi" vs "Ami.e" avec scores, streaks, barre duale
 * 
 * Le fond utilise une texture "noise" semi-transparente (comme l'onboarding),
 * remplaçant les anciennes lignes de cahier.
 * 
 * Données : tout vient de Supabase via les stores Zustand (authStore, projectStore, progressStore).
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
import IconRotateCcw from '../../components/icons/IconRotateCcw';
import BookStack from '../../components/ui/BookStack';
import NotificationButton from '../../components/ui/NotificationButton';
import PageScrollPicker from '../../components/ui/PageScrollPicker';
import ProgressCard from '../../components/ui/ProgressCard';
import { useAuthStore } from '../../stores/authStore';
import { useProgressStore } from '../../stores/progressStore';
import { useProjectStore } from '../../stores/projectStore';
import { colors, spacing, borderRadius } from '../../utils/constants';

// Texture de fond "noise" réutilisée depuis l'onboarding
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

/**
 * Résout la source d'un avatar utilisateur.
 * - URL http(s) → { uri: url }
 * - Ref locale connue → require()
 * - Sinon → fallback lea.png
 */
const resolveAvatarSource = (ref: string | null | undefined) => {
  if (!ref) return require('../../assets/images/lea.png');
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return { uri: ref };
  }
  switch (ref) {
    case 'lea': return require('../../assets/images/lea.png');
    case 'zoe': return require('../../assets/images/zoe.png');
    default: return require('../../assets/images/lea.png');
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  // ===== Stores Supabase =====
  const {
    challenges,
    activeChallenge,
    setActiveChallenge,
    loadUserChallenges,
    isLoading: projectsLoading,
  } = useProjectStore();

  const {
    loadChallengeProgress,
    updateProgress,
    getUserProgressById,
    participants,
  } = useProgressStore();

  // ===== État local =====
  const [currentPageInput, setCurrentPageInput] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animations
  const successAnim = useRef(new Animated.Value(0)).current;

  // ===== Chargement des données au montage =====
  useEffect(() => {
    if (user?.id) {
      loadUserChallenges(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeChallenge?.id) {
      loadChallengeProgress(activeChallenge.id);
    }
  }, [activeChallenge?.id]);

  // ===== Données dérivées =====
  const myProgress = user ? getUserProgressById(user.id) : undefined;
  const lastSavedPage = myProgress?.current_page || 0;
  const totalPages = activeChallenge?.total_pages || 100;

  // Sync input avec page sauvegardée
  useEffect(() => {
    setCurrentPageInput(lastSavedPage);
  }, [lastSavedPage, activeChallenge?.id]);

  // Savoir si l'utilisateur a bougé le scroll
  const hasChanged = currentPageInput !== lastSavedPage;

  // Progression moyenne du groupe
  const totalReadPages = participants.reduce((acc, p) => acc + p.progress.current_page, 0);
  const averagePercentage = participants.length > 0
    ? Math.round((totalReadPages / participants.length / totalPages) * 100)
    : 0;

  // ===== Callback quand l'utilisateur scrolle le picker de pages =====
  const handlePageChange = useCallback((page: number) => {
    setCurrentPageInput(page);
  }, []);

  // ===== Enregistrer la progression (bouton check ✓) =====
  const handleSave = async () => {
    if (!hasChanged || !activeChallenge || !user) return;

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

  // ===== Annuler le changement (bouton undo ↩) =====
  const handleUndo = useCallback(() => {
    setCurrentPageInput(lastSavedPage);
  }, [lastSavedPage]);

  // ===== Données participants pour la ProgressCard =====
  const meParticipant = participants.find(p => p.user.id === user?.id);
  const friendParticipant = participants.find(p => p.user.id !== user?.id);

  const meData = meParticipant ? {
    id: meParticipant.user.id,
    name: 'Moi',
    photoUrl: meParticipant.user.profile_photo_url || null,
    score: meParticipant.progress.current_page,
    streak: meParticipant.progress.streak_count || 0,
    isLeader: meParticipant.isLeader,
  } : {
    id: user?.id || '',
    name: 'Moi',
    photoUrl: user?.profile_photo_url || null,
    score: 0,
    streak: 0,
    isLeader: false,
  };

  const friendData = friendParticipant ? {
    id: friendParticipant.user.id,
    name: friendParticipant.user.first_name || 'Ami.e',
    photoUrl: friendParticipant.user.profile_photo_url || null,
    score: friendParticipant.progress.current_page,
    streak: friendParticipant.progress.streak_count || 0,
    isLeader: friendParticipant.isLeader,
  } : null;

  // Covers des autres challenges (pour le BookStack)
  const otherCovers = challenges
    .filter(c => c.id !== activeChallenge?.id)
    .map(c => c.cover_url)
    .slice(0, 3);

  // ===== Callback navigation étagère de livres =====
  const handleBookStackPress = useCallback(() => {
    // TODO: ouvrir l'étagère de livres (composant à venir)
    // Pour l'instant, on pourrait afficher un bottomsheet ou naviguer
  }, []);

  // ===== Callback historique participant =====
  const handleParticipantPress = useCallback((participantId: string) => {
    // TODO: ouvrir le modal d'historique du participant
  }, []);

  return (
    <View style={styles.container}>
      {/* Texture de fond "noise" semi-transparente */}
      <Image
        source={TEXTURE_IMAGE}
        style={styles.backgroundTexture}
        contentFit="cover"
      />

      {/* ═══════════ HEADER ═══════════ */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        {/* Avatar profil — navigue vers /profile */}
        <Pressable onPress={() => router.push('/profile')}>
          <Image
            source={resolveAvatarSource(user?.profile_photo_url)}
            style={styles.headerAvatar}
            contentFit="cover"
          />
        </Pressable>

        {/* PopEyes mascotte — décoratif */}
        <PopEyes size="small" />

        {/* Bouton notification — navigue vers /activity */}
        <NotificationButton
          onPress={() => router.push('/activity')}
          hasUnread={false}
        />
      </View>

      {/* ═══════════ SECTION LIVRE (pile de couvertures) ═══════════ */}
      {activeChallenge && (
        <View style={styles.bookSection}>
          <BookStack
            bookTitle={activeChallenge.book_title}
            bookAuthor={activeChallenge.book_author || ''}
            totalPages={totalPages}
            progressPercentage={averagePercentage}
            coverUrl={activeChallenge.cover_url}
            otherCovers={otherCovers}
            onPress={handleBookStackPress}
          />
        </View>
      )}

      {/* ═══════════ ZONE CENTRALE : SÉLECTEUR DE PAGE ═══════════
        Hauteur FIXE : les boutons apparaissent/disparaissent sans que les chiffres
        bougent. On réserve toujours la place des boutons (placeholder invisible
        quand hasChanged=false) pour éviter tout décalage vertical.
      */}
      {activeChallenge ? (
        <View style={styles.pageSection}>
          <View style={styles.pageSectionInner}>
            <PageScrollPicker
              currentPage={currentPageInput}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              savedPage={lastSavedPage}
            />

            {/* Zone boutons : hauteur fixe (56px boutons + 29px gap) pour éviter
                tout mouvement vertical quand hasChanged change. */}
            <View style={styles.actionButtonsWrapper}>
              {hasChanged ? (
                <View style={styles.actionButtons}>
                  <Button3D
                    variant="secondary"
                    iconOnly
                    size="compact"
                    iconComponent={<IconRotateCcw size={24} color={colors.dark900} />}
                    onPress={handleUndo}
                  />
                  <Button3D
                    variant="primary"
                    iconOnly
                    size="compact"
                    icon="checkmark"
                    onPress={handleSave}
                  />
                </View>
              ) : null}
            </View>
          </View>
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
            <Button3D
              onPress={() => router.push('/project/create')}
              variant="primary"
              icon="add-circle-outline"
              iconPosition="left"
              style={{ width: '100%' }}
            >
              Créer un projet
            </Button3D>

            <Button3D
              onPress={() => router.push('/project/join')}
              variant="secondary"
              style={{ width: '100%' }}
            >
              Rejoindre un projet
            </Button3D>
          </View>
        </View>
      )}

      {/* ═══════════ CARTE DE PROGRESSION (bas de page) ═══════════ */}
      {activeChallenge && (
        <View style={[styles.progressSection, { paddingBottom: insets.bottom + spacing['4xl'] }]}>
          <ProgressCard
            me={meData}
            friend={friendData}
            onParticipantPress={handleParticipantPress}
          />
        </View>
      )}

      {/* ═══════════ TOAST DE SUCCÈS ═══════════ */}
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, { opacity: successAnim }]}>
          <Ionicons name="checkmark-circle" size={22} color={colors.dark900} />
          <Text style={styles.successText}>Enregistré !</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ===== CONTAINER PRINCIPAL =====
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Texture de fond semi-transparente
  backgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // ===== SECTION LIVRE =====
  bookSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  // ===== SECTION SÉLECTEUR DE PAGE =====
  // flex: 1 + center pour que le numéro sélectionné soit au milieu de l'écran.
  pageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Conteneur avec hauteur fixe, pleine largeur pour le centrage.
  pageSectionInner: {
    width: '100%',
    alignItems: 'center',
    minHeight: 280,
  },
  // Wrapper de hauteur fixe (29 gap + 40 bouton) pour que le layout ne bouge pas.
  actionButtonsWrapper: {
    minHeight: 69, // 29 (gap) + 40 (Button3D compact)
    marginTop: 29, // gap Figma entre picker et boutons
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Les boutons undo + check, gap 29px (Figma)
  actionButtons: {
    flexDirection: 'row',
    gap: 29,
    alignItems: 'center',
  },

  // ===== CARTE DE PROGRESSION (bas) =====
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // ===== ÉTAT VIDE =====
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontFamily: 'Rokkitt_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  emptyStateButtons: {
    width: '100%',
    gap: 16,
  },

  // ===== TOAST SUCCÈS =====
  successOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: colors.white,
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
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
});
