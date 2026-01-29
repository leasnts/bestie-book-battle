/**
 * Service de base de données Supabase
 * 
 * Contient toutes les opérations CRUD pour :
 * - Challenges (projets de lecture)
 * - Participants
 * - Progression des utilisateurs
 * - Historique de lecture
 */

import { supabase } from '../../supabaseConfig';
import {
  Challenge,
  ChallengeInsert,
  ChallengeUpdate,
  ChallengeParticipant,
  ChallengeParticipantInsert,
  UserProgress,
  UserProgressUpdate,
  ProgressHistory,
  User,
  ParticipantWithProgress,
  ChallengeWithParticipants,
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
 * @param challengeData - Les données du challenge
 * @returns Le challenge créé avec toutes ses informations
 */
export async function createChallenge(
  challengeData: Omit<ChallengeInsert, 'invite_code' | 'invite_url'>
): Promise<Challenge> {
  try {
    // Créer le challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert(challengeData)
      .select()
      .single();

    if (challengeError) throw challengeError;

    // Ajouter le créateur comme premier participant
    await joinChallenge(challenge.id, challengeData.admin_id);

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
 * Utilisé quand un utilisateur veut rejoindre un challenge via un code
 * 
 * @param inviteCode - Le code d'invitation (6 caractères)
 * @returns Le challenge correspondant, ou null si non trouvé
 */
export async function getChallengeByInviteCode(
  inviteCode: string
): Promise<Challenge | null> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
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
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenge_participants!inner(user_id)
      `)
      .eq('challenge_participants.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erreur lors de la récupération des challenges de l\'utilisateur:', error);
    throw error;
  }
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
      // Si l'erreur est une violation de contrainte unique, l'utilisateur est déjà participant
      if (error.code === '23505') {
        console.log('L\'utilisateur est déjà participant de ce challenge');
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

    // Récupérer tous les participants avec leur progression
    const { data, error } = await supabase
      .from('challenge_participants')
      .select(`
        user_id,
        users!inner(*),
        user_progress!inner(*)
      `)
      .eq('challenge_id', challengeId);

    if (error) throw error;
    if (!data) return [];

    // Transformer les données et calculer les classements
    const participants: ParticipantWithProgress[] = data.map((item: any) => ({
      user: item.users,
      progress: item.user_progress[0], // Il y a toujours exactement 1 progression par participant
      history: [], // L'historique sera chargé séparément si nécessaire
      percentage: item.user_progress[0]?.progress_percentage || 0,
      isLeader: false, // Sera calculé après
      rank: 0, // Sera calculé après
    }));

    // Trier par page actuelle (du plus avancé au moins avancé)
    participants.sort((a, b) => b.progress.current_page - a.progress.current_page);

    // Assigner les rangs et déterminer le leader
    participants.forEach((participant, index) => {
      participant.rank = index + 1;
      participant.isLeader = index === 0 && participant.progress.current_page > 0;
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
