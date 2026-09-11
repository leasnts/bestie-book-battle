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
    ActivityIndicator,
    Alert,
    AppState,
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
import { getAllUserPages, getUserHistory } from '../../services/supabase/database';
import { uploadBookCover } from '../../services/supabase/storage';
import { updateWidgetData } from '../../utils/widget';
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
  const { width: screenWidth, fontScale } = useWindowDimensions();
  const { user } = useAuthStore();

  // ===== Stores Supabase =====
  const {
    challenges,
    activeChallenge,
    setActiveChallenge,
    setLastProgressChallengeId,
    loadUserChallenges,
    leaveActiveChallenge,
    updateActiveChallenge,
    challengesLoading,
    challengesLoaded,
    _hasHydrated,
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

  // Cache des pages sauvegardées par challenge.
  // Quand on switch de challenge, les données du store sont rechargées (async).
  // Sans ce cache, le picker afficherait 0 pendant le chargement.
  // Avec le cache, on affiche immédiatement la dernière page connue.
  const savedPagesByChallenge = useRef<Record<string, number>>({});

  // Pré-charge les pages de TOUS les challenges au montage (1 requête légère).
  // Comme ça quand on switch de challenge, le cache a déjà la bonne page.
  useEffect(() => {
    if (user?.id) {
      getAllUserPages(user.id).then((pages) => {
        savedPagesByChallenge.current = { ...savedPagesByChallenge.current, ...pages };
      });
    }
  }, [user?.id]);

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
  // loadUserChallenges est déjà appelé par _layout.tsx via useEffect [user?.id].
  // Pas besoin de le refaire ici.
  useEffect(() => {
    if (activeChallenge?.id) {
      Promise.all([
        loadChallengeProgress(activeChallenge.id),
        loadActiveGoals(activeChallenge.id),
        loadGoalHistory(activeChallenge.id),
      ]);
    }
  }, [activeChallenge?.id]);

  // ===== Refresh silencieux au retour du foreground =====
  // Comme Instagram : on refresh TOUJOURS quand l'app revient au premier plan.
  // Le cache est déjà affiché (pas de spinner), les données fraîches le remplacent
  // silencieusement. La protection dans loadUserChallenges empêche l'écrasement
  // du cache par des résultats vides (token expiré + RLS).
  // On refresh aussi la progression + objectifs pour voir les updates des amis.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && user?.id) {
        loadUserChallenges(user.id);
        const challengeId = useProjectStore.getState().activeChallenge?.id;
        if (challengeId) {
          loadChallengeProgress(challengeId);
          loadActiveGoals(challengeId);
          loadGoalHistory(challengeId);
        }
      }
    });
    return () => sub.remove();
  }, [user?.id, loadUserChallenges, loadChallengeProgress, loadActiveGoals, loadGoalHistory]);

  // ===== Données dérivées =====
  // totalPages du challenge = édition de référence (pour widget, goals, etc.)
  const challengeTotalPages = activeChallenge?.total_pages || 100;

  // IMPORTANT : on vérifie que les participants correspondent bien au challenge actif.
  // Sans ce guard, quand on switch de livre, participants contient encore les données
  // de l'ancien challenge pendant un cycle de rendu (le temps que loadChallengeProgress
  // recharge les nouvelles données), ce qui provoque des données croisées
  // (ex: current_page de l'ancien livre divisé par totalPages du nouveau → % faux).
  const participantsMatchChallenge = participants.length > 0 &&
    participants[0].progress.challenge_id === activeChallenge?.id;

  const myProgress = participantsMatchChallenge && user
    ? getUserProgressById(user.id)
    : undefined;

  // totalPages du user = son édition personnelle (pour le picker et l'affichage)
  const totalPages = myProgress?.total_pages ?? challengeTotalPages;

  // Détecter si les participants ont des éditions différentes (total_pages différent)
  // → dans ce cas, le leaderboard affichera des pourcentages au lieu de pages brutes
  const hasDifferentEditions = participantsMatchChallenge && participants.length > 1
    && new Set(participants.map(p => p.progress.total_pages ?? challengeTotalPages)).size > 1;

  // Quand on a les bonnes données, on met en cache la page par challenge
  if (myProgress && activeChallenge?.id) {
    savedPagesByChallenge.current[activeChallenge.id] = myProgress.current_page;
  }

  // lastSavedPage : données fraîches si dispo, sinon cache du dernier passage
  const lastSavedPage = myProgress?.current_page
    ?? (activeChallenge?.id ? savedPagesByChallenge.current[activeChallenge.id] : undefined)
    ?? 0;

  // Sync le picker avec la page sauvegardée quand le challenge change ou les données arrivent
  useEffect(() => {
    setCurrentPageInput(lastSavedPage);
  }, [lastSavedPage, activeChallenge?.id]);

  // Savoir si l'utilisateur a bougé le scroll
  const hasChanged = currentPageInput !== lastSavedPage;

  // Progression moyenne du groupe (basée sur les pourcentages individuels)
  const averagePercentage = participantsMatchChallenge
    ? Math.round(
        participants.reduce((acc, p) => acc + (p.percentage || 0), 0) / participants.length
      )
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
      setLastProgressChallengeId(activeChallenge.id);

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
  // Pour "moi", toujours utiliser authStore (user) pour la photo : les participants
  // du progressStore sont chargés une fois et ne se mettent pas à jour quand on
  // change sa photo de profil. authStore est mis à jour immédiatement.
  const mePhotoUrl = user?.profile_photo_url || null;
  const mePhotoUrlWithCacheBust = mePhotoUrl && user?.updated_at
    ? `${mePhotoUrl}${mePhotoUrl.includes('?') ? '&' : '?'}v=${new Date(user.updated_at).getTime()}`
    : mePhotoUrl;

  // Construire les données de TOUS les participants pour le ProgressCard
  const allParticipantsData = participantsMatchChallenge
    ? participants.map(p => {
        const isMe = p.user.id === user?.id;
        // Pour "moi", utiliser la photo de authStore (toujours à jour)
        let photoUrl: string | null;
        if (isMe) {
          photoUrl = mePhotoUrlWithCacheBust;
        } else {
          const url = p.user.profile_photo_url || null;
          photoUrl = url && p.user.updated_at
            ? `${url}${url.includes('?') ? '&' : '?'}v=${new Date(p.user.updated_at).getTime()}`
            : url;
        }

        return {
          id: p.user.id,
          name: isMe ? 'Moi' : (p.user.first_name || 'Participant'),
          photoUrl,
          score: p.progress.current_page,
          percentage: p.percentage || 0,
          streak: getActiveStreak(p.progress.streak_count, p.progress.last_streak_date),
          isLeader: p.isLeader,
          streakAtRisk: isStreakAtRisk(p.progress.last_streak_date),
        };
      })
    : [{
        id: user?.id || '',
        name: 'Moi',
        photoUrl: mePhotoUrlWithCacheBust,
        score: 0,
        percentage: 0,
        streak: 0,
        isLeader: false,
        streakAtRisk: false,
      }];

  // ===== Mise à jour automatique du widget iOS =====
  useEffect(() => {
    if (!activeChallenge || !participantsMatchChallenge) return;

    const sorted = [...participants].sort(
      (a, b) => b.percentage - a.percentage
    );
    const top1 = sorted[0];
    const top2 = sorted.length > 1 ? sorted[1] : null;

    // Utiliser les pourcentages individuels (chaque participant a son propre total_pages)
    const avgProgress = participants.reduce(
      (acc, p) => acc + (p.percentage || 0), 0
    ) / (participants.length * 100);

    updateWidgetData({
      totalPages: challengeTotalPages,
      averageProgress: Math.min(avgProgress, 1),
      participant1Name: top1.user.first_name || 'Joueur 1',
      participant1Page: top1.progress.current_page,
      participant2Name: top2?.user.first_name ?? null,
      participant2Page: top2?.progress.current_page ?? null,
      lastUpdated: new Date().toISOString(),
    });
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
          // Calculer la baseline (page moyenne actuelle des participants)
          const totalPages = participants.reduce(
            (sum, p) => sum + (p.progress?.current_page ?? 0),
            0
          );
          const currentBaseline = participants.length > 0
            ? Math.round(totalPages / participants.length)
            : 0;

          if (secondaryGoal) {
            // Quand on change l'objectif, on recalcule toujours la baseline
            // pour mesurer la progression depuis la position actuelle.
            const updates: any = {
              target_pages: targetPages,
              deadline: deadline.toISOString(),
              results: { baseline: currentBaseline },
            };
            await editGoal(secondaryGoal.id, updates);
          } else {
            await addGoal({
              challenge_id: activeChallenge.id,
              type: 'secondary',
              target_pages: targetPages,
              deadline: deadline.toISOString(),
              created_by: user.id,
              results: { baseline: currentBaseline },
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
      participants,
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
          style={[
            styles.pageSection,
            showBookShelf && styles.pageSectionDisabled,
          ]}
          pointerEvents={showBookShelf ? 'none' : 'auto'}
        >
          <View
            style={[
              styles.pageSectionInner,
              fontScale >= 1.35 && styles.pageSectionInnerCompact,
            ]}
          >
            <PageScrollPicker
              key={activeChallenge.id}
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
                    accessibilityLabel="Annuler"
                    accessibilityHint="Revient à ta dernière page enregistrée"
                    onPress={handleUndo}
                  />
                  <Button3D
                    variant="primary"
                    iconOnly
                    size="compact"
                    icon="checkmark"
                    accessibilityLabel="Enregistrer ma page"
                    onPress={handleSave}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : !_hasHydrated || (challenges.length === 0 && challengesLoading) ? (
        /* ═══════════ ÉTAT CHARGEMENT : persist pas encore prêt OU fetch en cours sans cache ═══════════ */
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
            participants={allParticipantsData}
            myUserId={user?.id || ''}
            onParticipantPress={handleParticipantPress}
            onSeeAllPress={() => router.push('/leaderboard')}
            showPercentage={hasDifferentEditions}
            intermediateGoal={
              secondaryGoal
                ? {
                    target_pages: secondaryGoal.target_pages,
                    deadline: secondaryGoal.deadline,
                    baseline: (secondaryGoal.results as any)?.baseline ?? 0,
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
            : (participants.find(p => p.user.id === selectedParticipantId)
                ?.user.first_name || 'Participant')
        }
        participantPhoto={
          selectedParticipantId === user?.id
            ? mePhotoUrlWithCacheBust
            : (participants.find(p => p.user.id === selectedParticipantId)
                ?.user.profile_photo_url || null)
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
  /*
    En gros corps de texte, la carte du livre au-dessus prend plus de place.
    Garder 280 pt réservés ici pousserait le classement hors de l'écran :
    on laisse la zone se comprimer, le sélecteur garde sa taille propre.
  */
  pageSectionInnerCompact: {
    minHeight: 0,
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
    fontFamily: 'Rokkitt_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
  },

});
