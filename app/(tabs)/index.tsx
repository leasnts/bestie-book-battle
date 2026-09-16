/**
 * BESTIE BOOK BATTLE - Home Page (refonte Figma)
 * 
 * Page d'accueil de l'application : un en-tête et trois blocs.
 *
 * HEADER : bibliothèque (gauche) | PopEyes mascotte (centre) | notifications (droite)
 *   La bibliothèque ouvre /library, la liste de tous tes challenges rangés sur
 *   des étagères : c'est là qu'on change de livre ou qu'on en ajoute un.
 * 1. LE LIVRE EN COURS : couverture, auteur, titre, pages, deadline, progression
 * 2. SÉLECTEUR DE PAGE : scroll pour choisir sa page + boutons annuler/valider
 * 3. TOP 3 : le podium du challenge, plus ta ligne si tu n'y es pas
 * 
 * Le fond utilise une texture "noise" semi-transparente (comme l'onboarding),
 * remplaçant les anciennes lignes de cahier.
 * 
 * Données : tout vient de Supabase via les stores Zustand (authStore, projectStore, progressStore).
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    AppState,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PageTransition from '../../components/PageTransition';
import PopEyes from '../../components/PopEyes';
import BookSection from '../../components/ui/BookSection';
import CoverBackdrop from '../../components/ui/CoverBackdrop';
import HeaderIconButton from '../../components/ui/HeaderIconButton';
import NotificationButton from '../../components/ui/NotificationButton';
import PageSection from '../../components/ui/PageSection';
import LeaderboardSection from '../../components/ui/LeaderboardSection';
import { getAllUserPages } from '../../services/supabase/database';
import { updateWidgetData } from '../../utils/widget';
import { buildCaps, countAtCap, median } from '../../utils/track';
import { useCoverPalette } from '../../hooks/useCoverPalette';
import { useLeaderboardParticipants } from '../../hooks/useLeaderboardParticipants';
import { useNotificationScheduler } from '../../hooks/useNotificationScheduler';
import { useAuthStore } from '../../stores/authStore';
import { useGoalStore } from '../../stores/goalStore';
import { useProgressStore } from '../../stores/progressStore';
import { useAnnotationStore } from '../../stores/annotationStore';
import { useProjectStore } from '../../stores/projectStore';
import { colors, fonts, shadowAlpha, spacing } from '../../utils/constants';
import { getActiveStreak } from '../../utils/streak';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import { BookOpenIcon, CirclePlusIcon, LibraryBigIcon } from 'lucide-react-native';

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
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Place réservée sous le contenu pour la barre d'onglets flottante
  const tabBarInset = useTabBarInset();
  const { fontScale } = useWindowDimensions();
  const { user } = useAuthStore();

  // ===== Stores Supabase =====
  const {
    challenges,
    activeChallenge,
    setLastProgressChallengeId,
    loadUserChallenges,
    challengesLoading,
    _hasHydrated,
  } = useProjectStore();
  const coverPalette = useCoverPalette(activeChallenge);
  const loadAnnotations = useAnnotationStore((s) => s.loadAnnotations);

  const {
    loadChallengeProgress,
    updateProgress,
    getUserProgressById,
    participants,
  } = useProgressStore();

  const {
    secondaryGoal,
    history: goalHistory,
    loadActiveGoals,
    loadGoalHistory,
  } = useGoalStore();

  // Planifie les notifications (streak en danger, rappels objectifs, inactivité)
  useNotificationScheduler({
    challengeId: activeChallenge?.id ?? null,
    participantsLoaded: participants.length > 0,
    goalsLoaded: true, // loadActiveGoals est appelé en parallèle
  });


  // ===== État local =====
  const [currentPageInput, setCurrentPageInput] = useState(0);

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

  // Toast "feuille qui tombe" — affiche "+12" et descend doucement
  const [deltaText, setDeltaText] = useState('');
  const leafY = useSharedValue(0);
  const leafX = useSharedValue(0);
  const leafOpacity = useSharedValue(0);
  const leafRotate = useSharedValue(0);

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

  // Plus de glissement depuis les bords : le bord droit ouvrait Activité, mais
  // il chevauchait le sélecteur de page, maintenant posé dans un cadre plus
  // étroit. La cloche de l'en-tête suffit.

  // ===== Chargement des données au montage =====
  // loadUserChallenges est déjà appelé par _layout.tsx via useEffect [user?.id].
  // Pas besoin de le refaire ici.
  useEffect(() => {
    if (activeChallenge?.id) {
      Promise.all([
        loadChallengeProgress(activeChallenge.id),
        loadActiveGoals(activeChallenge.id),
        loadGoalHistory(activeChallenge.id),
        // Le carnet : les notes débloquées changent à chaque page enregistrée
        loadAnnotations(activeChallenge.id, user?.id),
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
          loadAnnotations(challengeId, user.id);
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

  // Ma série en jours, affichée dans le cadre « Ma page »
  const myStreak = getActiveStreak(
    myProgress?.streak_count ?? 0,
    myProgress?.last_streak_date ?? null,
  );

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
  // 2. Le compteur roulant et la barre animée du classement se déclenchent
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

  // ===== Membres du club, pour le cadre Classement =====
  // Même hook que le classement complet : mêmes prénoms, mêmes photos, mêmes %.
  const { participants: leaderboardParticipants, myUserId } = useLeaderboardParticipants();

  // ===== La piste du livre =====
  // Le club avance à la MÉDIANE des pourcentages : trois lectrices rapides ne
  // doivent pas donner l'impression que tout le monde est loin devant.
  const clubPercent = median(leaderboardParticipants.map((p) => p.percentage));
  const myPercent = leaderboardParticipants.find((p) => p.id === myUserId)?.percentage ?? 0;
  // L'édition de référence du challenge : c'est en elle que les caps sont posés
  const caps = buildCaps([secondaryGoal, ...goalHistory], activeChallenge?.total_pages ?? 0);
  const currentCap = caps.find((cap) => cap.state === 'current') ?? null;
  const membersAtCap = currentCap
    ? countAtCap(leaderboardParticipants.map((p) => p.percentage), currentCap.percent)
    : 0;



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

  return (
    <PageTransition>
    <View style={styles.container}>
      {/* Fond aux couleurs de la couverture du livre en cours */}
      <CoverBackdrop palette={coverPalette} />

      {/* Texture de fond "noise" semi-transparente */}
      <Image
        source={TEXTURE_IMAGE}
        style={styles.backgroundTexture}
        contentFit="cover"
      />

      {/* ═══════════ HEADER ═══════════ */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        {/* Bibliothèque — tous tes challenges, sur des étagères */}
        <HeaderIconButton
          icon={LibraryBigIcon}
          onPress={() => router.push('/library')}
          accessibilityLabel="Mes challenges"
        />

        {/* PopEyes mascotte — décoratif */}
        <PopEyes size="small" />

        {/* Bouton notification — navigue vers /activity */}
        <NotificationButton
          onPress={() => router.push('/activity')}
          hasUnread={false}
        />
      </View>

      {/*
        Les trois cadres, dans une ScrollView.

        À taille de texte normale, tout tient sans défiler (c'est la règle de
        l'accueil) : la ScrollView ne bouge pas. Aux gros corps de texte, les
        textes grandissent et les cadres poussent au lieu d'être écrasés — sans
        elle, chaque cadre se faisait comprimer et les lettres étaient coupées.
      */}
      <ScrollView
        style={styles.frames}
        contentContainerStyle={[styles.framesContent, { paddingBottom: tabBarInset + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
      {/* ═══════════ CADRE 1 : LE LIVRE ═══════════ */}
      {activeChallenge && (
        <View style={styles.bookSection}>
          <BookSection
            challenge={activeChallenge}
            clubPercent={clubPercent}
            myPercent={myPercent}
            myPhotoUrl={user?.profile_photo_url ?? null}
            myInitial={(user?.first_name ?? 'M').charAt(0).toUpperCase()}
            caps={caps}
            membersAtCap={membersAtCap}
            memberCount={leaderboardParticipants.length}
            onPress={() => router.push('/book')}
          />
        </View>
      )}

      {/* ═══════════ CADRE 2 : MA PAGE ═══════════ */}
      {activeChallenge ? (
        <View style={styles.pageSection}>
          <PageSection
            key={activeChallenge.id}
            currentPage={currentPageInput}
            savedPage={lastSavedPage}
            totalPages={totalPages}
            streakDays={myStreak}
            onPageChange={handlePageChange}
            onSave={handleSave}
            onUndo={handleUndo}
            onJournalPress={() => router.push(`/participant/${myUserId}`)}
          />
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
          <BookOpenIcon size={80} color={colors.border} style={{ marginBottom: 24 }} />
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
              icon={CirclePlusIcon}
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

      {/* ═══════════ BLOC 3 : TOP 3 DU CHALLENGE + MOI ═══════════ */}
      {activeChallenge && (
        <View style={styles.progressSection}>
          <LeaderboardSection
            participants={leaderboardParticipants}
            myUserId={myUserId}
            onPress={() => router.push('/leaderboard')}
          />
        </View>
      )}
      </ScrollView>

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

    </View>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  // ===== CONTAINER PRINCIPAL =====
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },

  // Texture de fond semi-transparente
  backgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },

  // ===== HEADER =====
  // En-tête resserré (72 → 56 pt) pour que les trois cadres tiennent sans défiler
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  // La zone défilable qui porte les trois cadres
  frames: {
    flex: 1,
  },
  framesContent: {
    flexGrow: 1,
  },

  // ===== CADRE 1 : LE LIVRE =====
  // Les trois cadres sont espacés de 12 pt, comme sur la maquette : l'accueil
  // doit tenir sans défiler.
  bookSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  // ===== SECTION SÉLECTEUR DE PAGE =====
  // flex: 1 + center pour que le numéro sélectionné soit au milieu de l'écran.
  // Le cadre « Ma page » occupe toute la largeur, comme les deux autres
  pageSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  // ===== CARTE DE PROGRESSION (bas) =====
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // ===== ÉTAT VIDE =====
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: fonts.body,
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
    backgroundColor: shadowAlpha(0.85),
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 9999,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  deltaToastText: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.white,
  },

});
