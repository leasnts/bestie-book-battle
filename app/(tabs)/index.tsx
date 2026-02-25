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
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PageTransition from '../../components/PageTransition';
import PopEyes from '../../components/PopEyes';
import IconRotateCcw from '../../components/icons/IconRotateCcw';
import BookStack from '../../components/ui/BookStack';
import DeadlineEditSheet from '../../components/ui/DeadlineEditSheet';
import EditBookSheet from '../../components/ui/EditBookSheet';
import GoalFormSheet from '../../components/ui/GoalFormSheet';
import NotificationButton from '../../components/ui/NotificationButton';
import PageScrollPicker from '../../components/ui/PageScrollPicker';
import ParticipantHistorySheet from '../../components/ui/ParticipantHistorySheet';
import ProgressCard from '../../components/ui/ProgressCard';
import { getUserHistory } from '../../services/supabase/database';
import { uploadBookCover } from '../../services/supabase/storage';
import { updateWidgetData, profilePhotoToBase64 } from '../../utils/widget';
import { useNotificationScheduler } from '../../hooks/useNotificationScheduler';
import { useAuthStore } from '../../stores/authStore';
import { useGoalStore } from '../../stores/goalStore';
import { useProgressStore } from '../../stores/progressStore';
import { useProjectStore } from '../../stores/projectStore';
import { ProgressHistory } from '../../types/supabase';
import { colors, spacing } from '../../utils/constants';
import { getActiveStreak, isStreakAtRisk } from '../../utils/streak';

// Texture de fond "noise" réutilisée depuis l'onboarding
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

/**
 * Résout la source d'un avatar utilisateur.
 * - URL http(s) → { uri: url } avec cache busting si updatedAt fourni
 * - Ref locale connue → require()
 * - Sinon → fallback image BBB par défaut
 *
 * Le cache busting (?v=timestamp) force expo-image à recharger l'image
 * au lieu d'afficher une version en cache quand la photo a changé.
 */
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/profile_picture_default.png');

const resolveAvatarSource = (
  ref: string | null | undefined,
  updatedAt?: string | null
) => {
  if (!ref) return DEFAULT_PROFILE_IMAGE;
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    let url = ref;
    if (updatedAt) {
      const sep = url.includes('?') ? '&' : '?';
      const v = new Date(updatedAt).getTime();
      url = `${url}${sep}v=${v}`;
    }
    return { uri: url };
  }
  switch (ref) {
    case 'lea': return require('../../assets/images/lea.png');
    case 'zoe': return require('../../assets/images/zoe.png');
    default: return DEFAULT_PROFILE_IMAGE;
  }
};

// Zone de détection du bord d'écran (en pixels)
// Le swipe doit démarrer dans les 50px depuis le bord gauche ou droit
const EDGE_ZONE = 50;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuthStore();

  // ===== Stores Supabase =====
  const {
    challenges,
    activeChallenge,
    setActiveChallenge,
    loadUserChallenges,
    leaveActiveChallenge,
    updateActiveChallenge,
    isLoading: projectsLoading,
    challengesLoaded,
  } = useProjectStore();

  const {
    loadChallengeProgress,
    updateProgress,
    getUserProgressById,
    participants,
  } = useProgressStore();

  const {
    primaryGoal,
    secondaryGoal,
    loadActiveGoals,
    loadGoalHistory,
    addGoal,
    editGoal,
  } = useGoalStore();

  // Planifie les notifications (streak en danger, rappels objectifs, inactivité)
  useNotificationScheduler({
    challengeId: activeChallenge?.id ?? null,
    participantsLoaded: participants.length > 0,
    goalsLoaded: true, // loadActiveGoals est appelé en parallèle
  });


  // ===== État local =====
  const [currentPageInput, setCurrentPageInput] = useState(0);
  const [showBookShelf, setShowBookShelf] = useState(false);

  // Modals
  const [deadlineModalVisible, setDeadlineModalVisible] = useState(false);
  const [editBookModalVisible, setEditBookModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // Historique du participant sélectionné (pour la modal timeline)
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [participantHistory, setParticipantHistory] = useState<ProgressHistory[]>([]);

  // Toast "feuille qui tombe" — affiche "+12" et descend doucement
  const [deltaText, setDeltaText] = useState('');
  const leafY = useSharedValue(0);
  const leafX = useSharedValue(0);
  const leafOpacity = useSharedValue(0);
  const leafRotate = useSharedValue(0);

  // ===== Swipe de navigation latéral (bord d'écran) =====
  // Shared value pour mémoriser la position X initiale du doigt
  const swipeStartX = useSharedValue(0);

  // Ces callbacks sont appelés depuis un worklet Reanimated (thread UI),
  // donc runOnJS est obligatoire pour traverser vers le thread JS.
  const navigateToProfile = useCallback(() => {
    router.push('/profile');
  }, [router]);

  const navigateToActivity = useCallback(() => {
    router.push('/activity');
  }, [router]);

  // Style animé : combine la descente (Y), le balancement (X),
  // la rotation et l'opacité en un seul transform fluide.
  const leafAnimStyle = useAnimatedStyle(() => ({
    opacity: leafOpacity.value,
    transform: [
      { translateY: leafY.value },
      { translateX: leafX.value },
      { rotate: `${leafRotate.value}deg` },
    ],
  }));

  // Gesture de glissement horizontal depuis les bords de l'écran.
  //
  // Comment ça fonctionne :
  // 1. onBegin → on enregistre la position X initiale du doigt
  // 2. activeOffsetX → le gesture ne s'active qu'après 25px de mouvement horizontal
  //    (évite les conflits avec les taps et les micro-mouvements)
  // 3. onEnd → si le doigt a démarré dans la zone du bord ET que le swipe est
  //    assez long (>60px) ET assez rapide (>250px/s), on navigue
  //
  // La vérification du bord (swipeStartX < EDGE_ZONE) est la clé :
  // elle empêche tout conflit avec le PageScrollPicker au centre de l'écran.
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-25, 25])
    .onBegin((event) => {
      swipeStartX.set(event.x);
    })
    .onEnd((event) => {
      const startX = swipeStartX.get();
      const tx = event.translationX;
      const vx = event.velocityX;

      // Bord gauche → swipe vers la droite → Profil
      if (startX < EDGE_ZONE && tx > 60 && vx > 250) {
        runOnJS(navigateToProfile)();
      }
      // Bord droit → swipe vers la gauche → Activité
      else if (startX > screenWidth - EDGE_ZONE && tx < -60 && vx < -250) {
        runOnJS(navigateToActivity)();
      }
    });

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

  useEffect(() => {
    if (activeChallenge?.id) {
      loadActiveGoals(activeChallenge.id);
      loadGoalHistory(activeChallenge.id);
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
  // Après la sauvegarde :
  // 1. Toast "feuille" affiche "+12" et descend doucement vers le bas
  // 2. Le compteur roulant et la barre animée dans ProgressCard se déclenchent
  const handleSave = async () => {
    if (!hasChanged || !activeChallenge || !user) return;

    // Capture le delta AVANT la sauvegarde (après, lastSavedPage va changer)
    const delta = currentPageInput - lastSavedPage;

    try {
      await updateProgress(activeChallenge.id, user.id, currentPageInput);

      // Lance le toast "feuille qui tombe" avec le delta
      if (delta !== 0) {
        setDeltaText(delta > 0 ? `+${delta}` : `${delta}`);

        // ── Opacité : apparaît vite, reste visible, puis s'efface doucement ──
        // 0→1 (150ms) → maintien 1.3s → 1→0 (1s)
        leafOpacity.value = withSequence(
          withTiming(0, { duration: 50 }),
          withTiming(1, { duration: 150 }),
          withDelay(1300, withTiming(0, { duration: 1000 })),
        );

        // ── Chute verticale : descend ~130px avec décélération ──
        // Easing.out(quad) = rapide au début, ralentit à la fin
        // → la feuille "arrive doucement au sol"
        leafY.value = withSequence(
          withTiming(0, { duration: 50 }),
          withTiming(130, { duration: 2500, easing: Easing.out(Easing.quad) }),
        );

        // ── Balancement latéral (le vent) : amplitude décroissante ──
        // 0 → +14 → -10 → +6 → 0 = oscillation qui se calme
        leafX.value = withSequence(
          withTiming(0, { duration: 50 }),
          withTiming(14, { duration: 650 }),
          withTiming(-10, { duration: 750 }),
          withTiming(6, { duration: 600 }),
          withTiming(0, { duration: 500 }),
        );

        // ── Rotation qui suit le balancement ──
        // Inclinaison légère dans le sens du mouvement latéral
        leafRotate.value = withSequence(
          withTiming(0, { duration: 50 }),
          withTiming(5, { duration: 650 }),
          withTiming(-3, { duration: 750 }),
          withTiming(2, { duration: 600 }),
          withTiming(0, { duration: 500 }),
        );
      }
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

  // Pour "moi", toujours utiliser authStore (user) pour la photo : les participants
  // du progressStore sont chargés une fois et ne se mettent pas à jour quand on
  // change sa photo de profil. authStore est mis à jour immédiatement.
  const mePhotoUrl = user?.profile_photo_url || meParticipant?.user.profile_photo_url || null;
  const mePhotoUrlWithCacheBust = mePhotoUrl && user?.updated_at
    ? `${mePhotoUrl}${mePhotoUrl.includes('?') ? '&' : '?'}v=${new Date(user.updated_at).getTime()}`
    : mePhotoUrl;
  const meData = meParticipant ? {
    id: meParticipant.user.id,
    name: 'Moi',
    photoUrl: mePhotoUrlWithCacheBust,
    score: meParticipant.progress.current_page,
    streak: getActiveStreak(meParticipant.progress.streak_count, meParticipant.progress.last_streak_date),
    isLeader: meParticipant.isLeader,
    streakAtRisk: isStreakAtRisk(meParticipant.progress.last_streak_date),
  } : {
    id: user?.id || '',
    name: 'Moi',
    photoUrl: user?.profile_photo_url && user?.updated_at
      ? `${user.profile_photo_url}${user.profile_photo_url.includes('?') ? '&' : '?'}v=${new Date(user.updated_at).getTime()}`
      : user?.profile_photo_url || null,
    score: 0,
    streak: 0,
    isLeader: false,
    streakAtRisk: false,
  };

  const friendPhotoUrl = friendParticipant?.user.profile_photo_url || null;
  const friendPhotoUrlWithCacheBust = friendPhotoUrl && friendParticipant?.user.updated_at
    ? `${friendPhotoUrl}${friendPhotoUrl.includes('?') ? '&' : '?'}v=${new Date(friendParticipant.user.updated_at).getTime()}`
    : friendPhotoUrl;
  const friendData = friendParticipant ? {
    id: friendParticipant.user.id,
    name: friendParticipant.user.first_name || 'Ami.e',
    photoUrl: friendPhotoUrlWithCacheBust,
    score: friendParticipant.progress.current_page,
    streak: getActiveStreak(friendParticipant.progress.streak_count, friendParticipant.progress.last_streak_date),
    isLeader: friendParticipant.isLeader,
    streakAtRisk: isStreakAtRisk(friendParticipant.progress.last_streak_date),
  } : null;

  // ===== Mise à jour automatique du widget iOS =====
  // Se déclenche dès que les participants ou le challenge changent.
  // 1. Trie les participants par pages lues (décroissant)
  // 2. Télécharge + encode en base64 les photos des 2 premiers
  // 3. Calcule la progression moyenne du groupe
  // 4. Envoie tout dans l'App Group pour le widget Swift
  useEffect(() => {
    if (!activeChallenge || participants.length === 0) return;

    const sorted = [...participants].sort(
      (a, b) => b.progress.current_page - a.progress.current_page
    );
    const top1 = sorted[0];
    const top2 = sorted.length > 1 ? sorted[1] : null;

    const avgProgress = participants.reduce(
      (acc, p) => acc + p.progress.current_page, 0
    ) / (participants.length * totalPages);

    (async () => {
      const [photo1, photo2] = await Promise.all([
        profilePhotoToBase64(top1.user.profile_photo_url),
        top2 ? profilePhotoToBase64(top2.user.profile_photo_url) : null,
      ]);

      await updateWidgetData({
        totalPages,
        averageProgress: Math.min(avgProgress, 1),
        participant1Name: top1.user.first_name || 'Joueur 1',
        participant1Page: top1.progress.current_page,
        participant1Photo: photo1,
        participant2Name: top2?.user.first_name ?? null,
        participant2Page: top2?.progress.current_page ?? null,
        participant2Photo: photo2 ?? null,
        lastUpdated: new Date().toISOString(),
      });
    })();
  }, [participants, activeChallenge?.id, totalPages]);

  // ===== Callback : basculer l'étagère ouverte/fermée =====
  const handleBookStackToggle = useCallback(() => {
    setShowBookShelf((prev) => !prev);
  }, []);

  // ===== Callback : sélectionner un livre dans l'étagère =====
  const handleSelectChallenge = useCallback(
    (challenge: NonNullable<typeof activeChallenge>) => {
      setActiveChallenge(challenge);
      setShowBookShelf(false);  // Referme l'étagère après sélection
    },
    [setActiveChallenge]
  );

  // ===== Callback : ajouter un nouveau livre =====
  // Réutilise les écrans onboarding (role, create, pages, cover, complete)
  // en mode addChallenge : pas de notifications, flow direct jusqu'au partage
  const handleAddBook = useCallback(() => {
    setShowBookShelf(false);
    router.push({
      pathname: '/onboarding/role',
      params: {
        firstName: user?.first_name || 'Lecteur',
        addChallenge: 'true',
      },
    });
  }, [router, user?.first_name]);

  // ===== Callback : quitter le livre actif =====
  const handleDeleteBook = useCallback(async () => {
    if (!activeChallenge || !user?.id) return;

    try {
      await leaveActiveChallenge(user.id);

      // Après avoir quitté, s'il ne reste plus de challenges on redirige vers l'ajout
      const remaining = challenges.filter((c) => c.id !== activeChallenge.id);
      if (remaining.length === 0) {
        router.push({
          pathname: '/onboarding/role',
          params: {
            firstName: user?.first_name || 'Lecteur',
            addChallenge: 'true',
          },
        });
      }
    } catch (error: any) {
      console.error('Erreur en quittant le challenge:', error);
      Alert.alert('Erreur', 'Impossible de quitter ce livre. Réessaie.');
    }
  }, [activeChallenge, challenges, user, leaveActiveChallenge, router]);

  // ===== Callback : inviter un ami =====
  const handleInviteFriend = useCallback(() => {
    if (!activeChallenge) return;
    // Navigue vers l'écran d'invitation avec le code du challenge
    router.push({
      pathname: '/project/invite',
      params: {
        code: activeChallenge.invite_code,
        challengeId: activeChallenge.id,
      },
    });
  }, [activeChallenge, router]);

  // ===== Callback : modifier le livre =====
  const handleEditBook = useCallback(() => {
    if (!activeChallenge) return;
    setEditBookModalVisible(true);
  }, [activeChallenge]);

  const handleSaveBookEdit = useCallback(
    async (data: {
      title: string;
      author: string;
      totalPages: number;
      coverUri?: string;
    }) => {
      if (!activeChallenge) return;

      try {
        // 1. Upload la nouvelle cover si elle a changé
        let coverUrl = activeChallenge.cover_url;
        if (data.coverUri) {
          const { url } = await uploadBookCover(activeChallenge.id, data.coverUri);
          coverUrl = url;
        }

        // 2. Met à jour les infos du livre
        await updateActiveChallenge({
          book_title: data.title,
          book_author: data.author,
          total_pages: data.totalPages,
          cover_url: coverUrl,
        });

        // Recharge les challenges pour afficher les nouvelles données
        if (user?.id) {
          await loadUserChallenges(user.id);
        }
      } catch (error) {
        console.error('Erreur sauvegarde livre:', error);
        throw error;
      }
    },
    [activeChallenge, updateActiveChallenge, user?.id, loadUserChallenges]
  );

  // ===== Callback : modifier la deadline =====
  const handleEditDeadline = useCallback(() => {
    setDeadlineModalVisible(true);
  }, []);

  const handleSaveDeadline = useCallback(
    async (date: Date) => {
      try {
        await updateActiveChallenge({ target_end_date: date.toISOString() });
      } catch (error) {
        console.error('Erreur mise à jour deadline:', error);
        throw error;
      }
    },
    [updateActiveChallenge]
  );

  // ===== Callback : définir un objectif intermédiaire =====
  const handleSetIntermediateGoal = useCallback(() => {
    setGoalModalVisible(true);
  }, []);

  const handleSaveGoal = useCallback(
    async (type: 'primary' | 'secondary', targetPages: number, deadline: Date) => {
      if (!activeChallenge || !user?.id) return;

      try {
        if (type === 'primary') {
          await updateActiveChallenge({ target_end_date: deadline.toISOString() });
        } else {
          if (secondaryGoal) {
            await editGoal(secondaryGoal.id, {
              target_pages: targetPages,
              deadline: deadline.toISOString(),
            });
          } else {
            await addGoal({
              challenge_id: activeChallenge.id,
              type: 'secondary',
              target_pages: targetPages,
              deadline: deadline.toISOString(),
              created_by: user.id,
            });
          }
        }
        setGoalModalVisible(false);
      } catch (error) {
        console.error('Erreur sauvegarde objectif:', error);
        throw error;
      }
    },
    [
      activeChallenge,
      user?.id,
      secondaryGoal,
      updateActiveChallenge,
      addGoal,
      editGoal,
    ]
  );

  // ===== Callback historique participant =====
  /**
   * Quand on clique sur un participant dans la ProgressCard :
   * 1. On enregistre l'ID du participant sélectionné
   * 2. On charge son historique depuis Supabase (table progress_history)
   * 3. On ouvre la modal timeline qui affiche chaque import (date, heure, pages)
   *
   * Le chargement est async : la modal s'ouvre tout de suite (UX réactive),
   * et l'historique s'affiche dès qu'il est chargé.
   */
  const handleParticipantPress = useCallback(async (participantId: string) => {
    if (!activeChallenge) return;

    setSelectedParticipantId(participantId);
    setHistoryModalVisible(true);
    setParticipantHistory([]); // Reset pour montrer le loading

    try {
      const history = await getUserHistory(activeChallenge.id, participantId);
      setParticipantHistory(history);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  }, [activeChallenge]);

  return (
    <PageTransition>
    <GestureDetector gesture={swipeGesture}>
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
            source={resolveAvatarSource(user?.profile_photo_url, user?.updated_at)}
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

      {/* ═══════════ SECTION LIVRE (fermé = pile empilée / ouvert = étagère scroll) ═══════════ */}
      {activeChallenge && (
        <View style={styles.bookSection}>
          <BookStack
            activeChallenge={activeChallenge}
            allChallenges={challenges}
            progressPercentage={averagePercentage}
            participants={participants}
            isOpen={showBookShelf}
            onToggle={handleBookStackToggle}
            onSelectChallenge={handleSelectChallenge}
            onAddBook={handleAddBook}
            onDeleteBook={handleDeleteBook}
            onInviteFriend={handleInviteFriend}
            onEditBook={handleEditBook}
            onEditDeadline={handleEditDeadline}
            onSetIntermediateGoal={handleSetIntermediateGoal}
          />
        </View>
      )}

      {/* ═══════════ ZONE CENTRALE : SÉLECTEUR DE PAGE ═══════════
        Hauteur FIXE : les boutons apparaissent/disparaissent sans que les chiffres
        bougent. On réserve toujours la place des boutons (placeholder invisible
        quand hasChanged=false) pour éviter tout décalage vertical.
      */}
      {activeChallenge ? (
        <View
          style={[styles.pageSection, showBookShelf && styles.pageSectionDisabled]}
          pointerEvents={showBookShelf ? 'none' : 'auto'}
        >
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
      ) : !challengesLoaded || projectsLoading ? (
        /* ═══════════ ÉTAT CHARGEMENT : challenges pas encore chargés ═══════════ */
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyStateSubtitle, { marginTop: 16 }]}>
            Chargement de tes projets…
          </Text>
        </View>
      ) : (
        /* ═══════════ ÉTAT VIDE : AUCUN PROJET (chargement confirmé, vraiment vide) ═══════════ */
        <View style={styles.emptyStateContainer}>
          <Ionicons name="book-outline" size={80} color="#D0D0D0" style={{ marginBottom: 24 }} />
          <Text style={styles.emptyStateTitle}>Aucun projet de lecture</Text>
          <Text style={styles.emptyStateSubtitle}>
            Crée un projet ou rejoins celui de tes amis pour commencer
          </Text>

          <View style={styles.emptyStateButtons}>
            <Button3D
              onPress={() => router.push({
                pathname: '/onboarding/role',
                params: {
                  firstName: user?.first_name || 'Lecteur',
                  addChallenge: 'true',
                },
              })}
              variant="primary"
              icon="add-circle-outline"
              iconPosition="left"
              style={{ width: '100%' }}
            >
              Créer un projet
            </Button3D>

            <Button3D
              onPress={() => router.push({
                pathname: '/onboarding/join',
                params: {
                  firstName: user?.first_name || 'Lecteur',
                  addChallenge: 'true',
                },
              })}
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
        <View style={[styles.progressSection, { paddingBottom: insets.bottom + spacing.md }]}>
          <ProgressCard
            me={meData}
            friend={friendData}
            onParticipantPress={handleParticipantPress}
            intermediateGoal={
              secondaryGoal
                ? {
                    target_pages: secondaryGoal.target_pages,
                    deadline: secondaryGoal.deadline,
                  }
                : null
            }
            onGoalPress={handleSetIntermediateGoal}
          />
        </View>
      )}

      {/* ═══════════ TOAST DELTA — FEUILLE QUI TOMBE ═══════════
        Toujours monté dans le DOM mais invisible (opacity: 0 par défaut).
        Quand on sauvegarde, les shared values animent :
        - leafY : descente verticale (0 → 130px)
        - leafX : balancement latéral (vent)
        - leafRotate : légère inclinaison qui suit le mouvement
        - leafOpacity : apparition → maintien → fondu
        pointerEvents none = ne bloque jamais les interactions.
      */}
      <Animated.View style={[styles.deltaToast, leafAnimStyle]} pointerEvents="none">
        <Text style={styles.deltaToastText}>{deltaText}</Text>
      </Animated.View>

      {/* ═══════════ MODAL DEADLINE ═══════════ */}
      <DeadlineEditSheet
        visible={deadlineModalVisible}
        onClose={() => setDeadlineModalVisible(false)}
        currentDate={activeChallenge?.target_end_date ?? null}
        onSave={handleSaveDeadline}
      />

      {/* ═══════════ MODAL OBJECTIF INTERMÉDIAIRE ═══════════ */}
      {activeChallenge && (
        <GoalFormSheet
          visible={goalModalVisible}
          onClose={() => setGoalModalVisible(false)}
          currentGoal={secondaryGoal}
          onSaveGoal={handleSaveGoal}
          totalPages={activeChallenge.total_pages}
        />
      )}

      {/* ═══════════ MODAL MODIFIER LE LIVRE ═══════════ */}
      {activeChallenge && (
        <EditBookSheet
          visible={editBookModalVisible}
          onClose={() => setEditBookModalVisible(false)}
          currentBook={{
            title: activeChallenge.book_title,
            author: activeChallenge.book_author || '',
            totalPages: activeChallenge.total_pages,
            coverUrl: activeChallenge.cover_url,
          }}
          onSave={handleSaveBookEdit}
        />
      )}

      {/* ═══════════ MODAL HISTORIQUE PARTICIPANT ═══════════
        Affiche la timeline des imports de pages d'un participant.
        On détermine le nom et la photo à partir de l'ID sélectionné :
        - Si c'est l'utilisateur connecté → "Moi" + sa photo depuis authStore
        - Sinon → prénom de l'ami + sa photo depuis participants
      */}
      <ParticipantHistorySheet
        visible={historyModalVisible}
        onClose={() => {
          setHistoryModalVisible(false);
          setSelectedParticipantId(null);
        }}
        participantName={
          selectedParticipantId === user?.id
            ? 'Moi'
            : (friendParticipant?.user.first_name || 'Participant')
        }
        participantPhoto={
          selectedParticipantId === user?.id
            ? mePhotoUrlWithCacheBust
            : (friendPhotoUrlWithCacheBust || null)
        }
        history={participantHistory}
      />

    </View>
    </GestureDetector>
    </PageTransition>
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
  // overflow: visible pour que les covers de l'étagère puissent
  // déborder visuellement quand on scrolle (pas coupées par le conteneur)
  bookSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    overflow: 'visible',
    zIndex: 10,
  },

  // ===== SECTION SÉLECTEUR DE PAGE =====
  // flex: 1 + center pour que le numéro sélectionné soit au milieu de l'écran.
  pageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Quand l'étagère est ouverte, on ne peut pas scroller les pages :
  // - opacity réduite = signal visuel "section désactivée"
  // - pointerEvents: 'none' est appliqué côté JSX (pas en stylesheet)
  pageSectionDisabled: {
    opacity: 0.25,
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

  // ===== TOAST DELTA — FEUILLE QUI TOMBE =====
  // Positionné juste en dessous de la zone des boutons undo/check (~58% de l'écran).
  // Le translateY de l'animation le fait descendre de 130px vers la section progression.
  deltaToast: {
    position: 'absolute',
    top: '58%',
    alignSelf: 'center',
    backgroundColor: 'rgba(10, 13, 18, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  deltaToastText: {
    fontFamily: 'Rokkitt_Bold',
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 28,
  },

});
