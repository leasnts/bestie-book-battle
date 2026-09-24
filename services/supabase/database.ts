/**
 * Service de base de données Supabase
 * 
 * Contient toutes les opérations CRUD pour :
 * - Challenges (projets de lecture)
 * - Participants
 * - Progression des utilisateurs
 * - Historique de lecture
 */

import { randomUUID } from 'expo-crypto';
import { supabase } from '../../supabaseConfig';
import { withTimeout } from '../../utils/withTimeout';
import {
    Challenge,
    ChallengeGoal,
    ChallengeGoalInsert,
    ChallengeGoalUpdate,
    ChallengeInsert,
    ChallengeParticipantInsert,
    ChallengeUpdate,
    ChallengeWithParticipants,
    MyBookProgress,
    ParticipantWithProgress,
    ProgressHistory,
    UserProgress,
    UserProgressUpdate
} from '../../types/supabase';

// =====================================================
// CHALLENGES
// =====================================================

/**
 * Créer un nouveau challenge
 * 
 * Crée automatiquement :
 * - Un code d'invitation unique (via trigger SQL)
 * - Une URL de deep link
 * - Ajoute le créateur comme premier participant
 * - Crée la progression initiale du créateur
 * 
 * IMPORTANT : Cette fonction vérifie d'abord que l'utilisateur a une session 
 * Supabase active, et utilise l'ID de cette session comme admin_id.
 * Cela garantit que la politique RLS (auth.uid() = admin_id) est satisfaite.
 * 
 * @param challengeData - Les données du challenge
 * @returns Le challenge créé avec toutes ses informations
 */
export async function createChallenge(
  challengeData: Omit<ChallengeInsert, 'invite_code' | 'invite_url'>
): Promise<Challenge> {
  try {
    // Étape 0 : Vérifier que la session Supabase est active
    // auth.uid() côté PostgreSQL correspond à session.user.id côté client
    // Si ces deux valeurs ne matchent pas, la politique RLS rejettera l'insertion
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Erreur session Supabase:', sessionError);
      throw new Error('Session invalide. Veuillez vous reconnecter.');
    }
    
    if (!session?.user) {
      console.error('Pas de session active. auth.uid() sera NULL côté Supabase.');
      throw new Error('Vous n\'êtes pas connecté. Veuillez vous reconnecter.');
    }

    // Sécurité : utiliser l'ID de la session comme admin_id
    // Même si challengeData.admin_id est différent (ex: bug dans le store),
    // on force l'utilisation de l'ID de la session pour que la RLS passe
    const safeAdminId = session.user.id;

    // Générer un ID côté client pour pouvoir référencer le challenge
    // après l'insertion (sans dépendre de .select() qui nécessite la policy SELECT)
    const challengeId = randomUUID();

    const safeData = {
      ...challengeData,
      id: challengeId,
      admin_id: safeAdminId,
    };

    // Étape 1 : Insérer le challenge SANS .select()
    // Pourquoi ? La policy SELECT sur challenges exige que l'utilisateur soit 
    // PARTICIPANT du challenge. Or il ne l'est pas encore à ce stade.
    // Faire .insert().select() échouerait car la row ne serait pas visible.
    const { error: challengeError } = await supabase
      .from('challenges')
      .insert(safeData);

    if (challengeError) throw challengeError;

    // Étape 2 : Ajouter le créateur comme premier participant
    // Le trigger SQL crée automatiquement la progression initiale
    await joinChallenge(challengeId, safeAdminId);

    // Étape 3 : Maintenant que l'utilisateur est participant,
    // la policy SELECT le laisse voir le challenge → on peut le lire
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select()
      .eq('id', challengeId)
      .single();

    if (fetchError) throw fetchError;

    return challenge;
  } catch (error: any) {
    console.error('Erreur lors de la création du challenge:', error);
    throw error;
  }
}

/**
 * Obtenir un challenge par son ID
 * 
 * @param challengeId - L'ID du challenge
 * @returns Le challenge avec tous ses détails
 */
export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération du challenge:', error);
    throw error;
  }
}

/**
 * Obtenir un challenge par son code d'invitation
 *
 * Utilise une RPC car les policies RLS bloquent la lecture des challenges
 * où l'utilisateur n'est ni admin ni participant (cas "rejoindre par code").
 *
 * @param inviteCode - Le code d'invitation (6 caractères)
 * @returns Le challenge correspondant, ou null si non trouvé
 */
export async function getChallengeByInviteCode(
  inviteCode: string
): Promise<Challenge | null> {
  try {
    const { data: rows, error } = await supabase.rpc('get_challenge_by_invite_code', {
      p_code: inviteCode.trim().toUpperCase(),
    });

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!row) return null;

    // La RPC retourne la ligne complète + admin_first_name, admin_last_name
    const { admin_first_name: _a1, admin_last_name: _a2, ...challenge } = row as Record<string, unknown>;
    return challenge as unknown as Challenge;
  } catch (error: any) {
    console.error('Erreur lors de la récupération du challenge par code:', error);
    throw error;
  }
}

/**
 * Obtenir tous les challenges d'un utilisateur
 * 
 * Retourne les challenges auxquels l'utilisateur participe,
 * triés par date de création (plus récent en premier)
 * 
 * @param userId - L'ID de l'utilisateur
 * @returns La liste des challenges de l'utilisateur
 */
export async function getUserChallenges(userId: string): Promise<Challenge[]> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('challenges')
        .select(`
          *,
          challenge_participants!inner(user_id)
        `)
        .eq('challenge_participants.user_id', userId)
        .order('created_at', { ascending: false }),
      10_000
    );

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erreur lors de la récupération des challenges de l\'utilisateur:', error);
    throw error;
  }
}

/**
 * Ma progression sur chacun de mes livres
 *
 * Une ligne par livre où j'ai une progression : sert à la bibliothèque pour
 * afficher l'état de chaque couverture (pas commencé, en cours, terminé) et
 * pour la trier (lus récemment, plus anciens).
 *
 * @param userId - L'ID de l'utilisateur
 */
export async function getMyBookProgress(userId: string): Promise<MyBookProgress[]> {
  const { data, error } = await withTimeout(
    supabase
      .from('user_progress')
      .select('challenge_id, current_page, progress_percentage, last_updated_at, created_at, cover_url')
      .eq('user_id', userId),
    10_000
  );

  if (error) throw error;
  return data || [];
}

/**
 * Mettre à jour un challenge
 * 
 * Seul l'admin du challenge peut le mettre à jour (vérifié par RLS)
 * 
 * @param challengeId - L'ID du challenge
 * @param updates - Les champs à mettre à jour
 * @returns Le challenge mis à jour
 */
export async function updateChallenge(
  challengeId: string,
  updates: ChallengeUpdate
): Promise<Challenge> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .update(updates)
      .eq('id', challengeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du challenge:', error);
    throw error;
  }
}

/**
 * Enregistrer les couleurs de la couverture d'un challenge (fond de l'accueil)
 *
 * Passe par la fonction SQL `set_cover_palette` : n'importe quel membre du club
 * peut enregistrer la palette, mais seulement si elle n'existe pas encore
 * (scripts/add-cover-palette.sql). Sans effet sinon, et sans erreur.
 */
export async function saveCoverPalette(challengeId: string, palette: string[]): Promise<void> {
  const { error } = await supabase.rpc('set_cover_palette', {
    p_challenge_id: challengeId,
    p_palette: palette,
  });
  if (error) throw error;
}

/**
 * Supprimer un challenge
 *
 * Seul l'admin du challenge peut le supprimer (vérifié par RLS)
 * La suppression cascade automatiquement vers :
 * - challenge_participants
 * - user_progress
 * - progress_history
 * 
 * @param challengeId - L'ID du challenge
 */
export async function deleteChallenge(challengeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Erreur lors de la suppression du challenge:', error);
    throw error;
  }
}

// =====================================================
// PARTICIPANTS
// =====================================================

/**
 * Rejoindre un challenge
 * 
 * Ajoute l'utilisateur comme participant du challenge.
 * Crée automatiquement une entrée de progression initiale (via trigger SQL).
 * 
 * @param challengeId - L'ID du challenge à rejoindre
 * @param userId - L'ID de l'utilisateur qui rejoint
 */
export async function joinChallenge(
  challengeId: string,
  userId: string
): Promise<void> {
  try {
    const participantData: ChallengeParticipantInsert = {
      challenge_id: challengeId,
      user_id: userId,
    };

    const { error } = await supabase
      .from('challenge_participants')
      .insert(participantData);

    if (error) {
      if (error.code === '23505') {
        return;
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Erreur lors de la jonction au challenge:', error);
    throw error;
  }
}

/**
 * Quitter un challenge
 * 
 * Retire l'utilisateur du challenge.
 * Supprime également sa progression et son historique (cascade).
 * 
 * @param challengeId - L'ID du challenge
 * @param userId - L'ID de l'utilisateur qui quitte
 */
export async function leaveChallenge(
  challengeId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('challenge_participants')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Erreur lors de la sortie du challenge:', error);
    throw error;
  }
}

/**
 * Obtenir tous les participants d'un challenge avec leur progression
 * 
 * Retourne la liste complète des participants avec :
 * - Leurs informations de profil
 * - Leur progression actuelle
 * - Leur classement
 * - S'ils sont le leader
 * 
 * @param challengeId - L'ID du challenge
 * @returns La liste des participants avec leur progression
 */
export async function getChallengeParticipants(
  challengeId: string
): Promise<ParticipantWithProgress[]> {
  try {
    // Récupérer le challenge pour connaître le nombre total de pages
    const challenge = await getChallengeById(challengeId);
    if (!challenge) throw new Error('Challenge non trouvé');

    // Récupérer les progressions avec les infos utilisateur.
    // On interroge directement user_progress (qui a des FK vers users et challenges)
    // au lieu de passer par challenge_participants (qui n'a pas de FK vers user_progress).
    // Chaque participant a une entrée user_progress créée automatiquement par le trigger
    // create_initial_progress() quand il rejoint le challenge.
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        users!inner(*)
      `)
      .eq('challenge_id', challengeId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Transformer les données et calculer les classements
    const participants: ParticipantWithProgress[] = data.map((item: any) => ({
      user: item.users,
      progress: {
        id: item.id,
        challenge_id: item.challenge_id,
        user_id: item.user_id,
        current_page: item.current_page,
        progress_percentage: item.progress_percentage,
        total_pages: item.total_pages,
        cover_url: item.cover_url ?? null,
        publisher: item.publisher ?? null,
        streak_count: item.streak_count,
        last_streak_date: item.last_streak_date,
        last_updated_at: item.last_updated_at,
        created_at: item.created_at,
      },
      history: [], // L'historique sera chargé séparément si nécessaire
      percentage: item.progress_percentage || 0,
      isLeader: false, // Sera calculé après
      rank: 0, // Sera calculé après
    }));

    // Trier par pourcentage de progression (du plus avancé au moins avancé)
    // Le pourcentage tient compte du total_pages propre à chaque participant
    participants.sort((a, b) => b.percentage - a.percentage);

    // Assigner les rangs et déterminer le leader
    participants.forEach((participant, index) => {
      participant.rank = index + 1;
      participant.isLeader = index === 0 && participant.percentage > 0;
    });

    return participants;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des participants:', error);
    throw error;
  }
}

// =====================================================
// PROGRESSION
// =====================================================

/**
 * Mettre à jour la progression d'un utilisateur
 * 
 * Met à jour le nombre de pages lues.
 * Déclenche automatiquement (via triggers SQL) :
 * - Le calcul du pourcentage de progression
 * - La mise à jour du streak
 * - L'ajout d'une entrée dans l'historique
 * - La mise à jour des statistiques du challenge
 * - La mise à jour du statut du challenge
 * 
 * @param challengeId - L'ID du challenge
 * @param userId - L'ID de l'utilisateur
 * @param currentPage - Le nouveau numéro de page actuel
 * @returns La progression mise à jour
 */
export async function updateUserProgress(
  challengeId: string,
  userId: string,
  currentPage: number
): Promise<UserProgress> {
  try {
    const updates: UserProgressUpdate = {
      current_page: currentPage,
      last_updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_progress')
      .update(updates)
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    throw error;
  }
}

/**
 * Enregistrer mon édition d'un livre : pages, couverture, éditeur
 *
 * Seuls les champs fournis sont modifiés. `cover_url: null` = revenir à la
 * couverture du bbb. Le trigger recalcule le pourcentage si les pages changent.
 *
 * @param challengeId - L'ID du challenge
 * @param userId - L'ID de l'utilisateur
 * @param edition - Les champs de mon édition à enregistrer
 */
export async function updateMyEdition(
  challengeId: string,
  userId: string,
  edition: Pick<UserProgressUpdate, 'total_pages' | 'cover_url' | 'publisher'>
): Promise<UserProgress> {
  const { data, error } = await supabase
    .from('user_progress')
    .update({ ...edition, last_updated_at: new Date().toISOString() })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error("Erreur lors de l'enregistrement de mon édition:", error);
    throw error;
  }
  return data;
}

/**
 * Obtenir la progression d'un utilisateur dans un challenge
 *
 * @param challengeId - L'ID du challenge
 * @param userId - L'ID de l'utilisateur
 * @returns La progression de l'utilisateur
 */
export async function getUserProgress(
  challengeId: string,
  userId: string
): Promise<UserProgress | null> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la progression:', error);
    throw error;
  }
}

/**
 * Obtenir la page actuelle d'un utilisateur pour tous ses challenges.
 * Requête légère (2 colonnes) utilisée au démarrage pour pré-peupler
 * le cache du PageScrollPicker et éviter un reset à 0 lors du switch.
 *
 * @param userId - L'ID de l'utilisateur
 * @returns Map challengeId → current_page
 */
export async function getAllUserPages(
  userId: string
): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('challenge_id, current_page')
      .eq('user_id', userId);

    if (error) throw error;

    const map: Record<string, number> = {};
    for (const row of data ?? []) {
      map[row.challenge_id] = row.current_page;
    }
    return map;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des pages utilisateur:', error);
    return {};
  }
}

/**
 * Obtenir toutes les progressions d'un challenge
 * 
 * @param challengeId - L'ID du challenge
 * @returns La liste de toutes les progressions
 */
export async function getChallengeProgress(
  challengeId: string
): Promise<UserProgress[]> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('current_page', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erreur lors de la récupération des progressions du challenge:', error);
    throw error;
  }
}

// =====================================================
// HISTORIQUE
// =====================================================

/**
 * Obtenir l'historique de lecture d'un utilisateur dans un challenge
 * 
 * Retourne toutes les entrées d'historique, triées par date
 * (plus récent en premier)
 * 
 * @param challengeId - L'ID du challenge
 * @param userId - L'ID de l'utilisateur
 * @returns L'historique de lecture
 */
export async function getUserHistory(
  challengeId: string,
  userId: string
): Promise<ProgressHistory[]> {
  try {
    const { data, error } = await supabase
      .from('progress_history')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    throw error;
  }
}

/**
 * Obtenir l'historique complet d'un challenge (tous les utilisateurs)
 * 
 * Retourne toutes les entrées d'historique du challenge,
 * avec les informations de l'utilisateur, triées par date
 * 
 * @param challengeId - L'ID du challenge
 * @returns L'historique complet du challenge
 */
export async function getChallengeHistory(
  challengeId: string
): Promise<ProgressHistory[]> {
  try {
    const { data, error } = await supabase
      .from('progress_history')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'historique du challenge:', error);
    throw error;
  }
}

/**
 * Obtenir l'historique d'un utilisateur sur une période spécifique
 * 
 * @param challengeId - L'ID du challenge
 * @param userId - L'ID de l'utilisateur
 * @param startDate - Date de début (YYYY-MM-DD)
 * @param endDate - Date de fin (YYYY-MM-DD)
 * @returns L'historique sur la période
 */
export async function getUserHistoryByDateRange(
  challengeId: string,
  userId: string,
  startDate: string,
  endDate: string
): Promise<ProgressHistory[]> {
  try {
    const { data, error } = await supabase
      .from('progress_history')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .gte('created_date', startDate)
      .lte('created_date', endDate)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'historique par période:', error);
    throw error;
  }
}

// =====================================================
// REQUÊTES COMPOSÉES
// =====================================================

/**
 * Obtenir un challenge complet avec tous ses participants
 * 
 * Retourne le challenge avec :
 * - Toutes les informations du challenge
 * - La liste complète des participants
 * - Les informations de l'admin
 * 
 * @param challengeId - L'ID du challenge
 * @returns Le challenge avec tous ses participants
 */
export async function getChallengeWithParticipants(
  challengeId: string
): Promise<ChallengeWithParticipants | null> {
  try {
    const challenge = await getChallengeById(challengeId);
    if (!challenge) return null;

    const participants = await getChallengeParticipants(challengeId);

    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('id', challenge.admin_id)
      .single();

    if (adminError) throw adminError;

    return {
      ...challenge,
      participants: participants.map((p) => p.user),
      admin,
    };
  } catch (error: any) {
    console.error('Erreur lors de la récupération du challenge complet:', error);
    throw error;
  }
}

// =====================================================
// OBJECTIFS DE LECTURE (GOALS)
// =====================================================

/**
 * Récupérer les objectifs actifs d'un challenge.
 * Retourne au maximum 2 objectifs (1 primary + 1 secondary).
 */
export async function getActiveGoals(challengeId: string): Promise<ChallengeGoal[]> {
  const { data, error } = await supabase
    .from('challenge_goals')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('status', 'active')
    .order('type', { ascending: true }); // primary first

  if (error) throw error;
  return data || [];
}

/**
 * Récupérer l'historique des objectifs secondaires d'un challenge.
 * Inclut les objectifs terminés (completed/failed/archived), triés du plus récent au plus ancien.
 */
export async function getGoalHistory(challengeId: string): Promise<ChallengeGoal[]> {
  const { data, error } = await supabase
    .from('challenge_goals')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('type', 'secondary')
    .neq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Créer un nouvel objectif.
 * Si un objectif du même type est déjà actif, il est archivé automatiquement.
 */
export async function createGoal(goalData: ChallengeGoalInsert): Promise<ChallengeGoal> {
  // Archiver l'ancien objectif actif du même type s'il existe
  const { error: archiveError } = await supabase
    .from('challenge_goals')
    .update({ status: 'archived' } as ChallengeGoalUpdate)
    .eq('challenge_id', goalData.challenge_id)
    .eq('type', goalData.type)
    .eq('status', 'active');

  if (archiveError) throw archiveError;

  // Créer le nouvel objectif
  const { data, error } = await supabase
    .from('challenge_goals')
    .insert(goalData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mettre à jour un objectif (modifier target_pages, deadline, status, results).
 */
export async function updateGoal(
  goalId: string,
  updates: ChallengeGoalUpdate
): Promise<ChallengeGoal> {
  const { data, error } = await supabase
    .from('challenge_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Supprimer un objectif.
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from('challenge_goals')
    .delete()
    .eq('id', goalId);

  if (error) throw error;
}
