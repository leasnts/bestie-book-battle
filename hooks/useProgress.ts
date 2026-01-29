/**
 * Hook personnalisé pour gérer la progression de l'utilisateur
 * 
 * Ce hook fournit des fonctions utilitaires pour :
 * - Récupérer la progression de l'utilisateur courant
 * - Calculer des statistiques
 * - Vérifier les milestones
 */

import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { milestones } from '../utils/constants';
import { getStreakMessage } from '../utils/streak';

interface UseProgressResult {
  currentPage: number;
  totalPagesRead: number;
  streak: number;
  streakMessage: string;
  percentage: number;
  nextMilestone: number | null;
  pagesToNextMilestone: number;
  isLeader: boolean;
  rank: number;
}

/**
 * Hook pour accéder à la progression de l'utilisateur courant dans un projet
 * 
 * @param totalPages - Le nombre total de pages du livre
 * @returns Les données de progression et statistiques
 */
export function useProgress(totalPages: number): UseProgressResult {
  const { user } = useAuthStore();
  const { participants } = useProgressStore();
  
  // Trouve la progression de l'utilisateur courant
  const currentUserProgress = useMemo(() => {
    return participants.find(p => p.user.id === user?.id);
  }, [participants, user?.id]);
  
  // Calcule les statistiques
  return useMemo(() => {
    const currentPage = currentUserProgress?.progress.currentPage || 0;
    const streak = currentUserProgress?.progress.streak || 0;
    const percentage = currentUserProgress?.percentage || 0;
    const isLeader = currentUserProgress?.isLeader || false;
    const rank = currentUserProgress?.rank || 0;
    
    // Calcule le total de pages lues (depuis l'historique)
    const totalPagesRead = currentUserProgress?.progress.history.reduce(
      (sum, entry) => sum + (entry.pagesRead > 0 ? entry.pagesRead : 0),
      0
    ) || 0;
    
    // Trouve le prochain milestone
    const nextMilestone = milestones.find(m => m > currentPage) || null;
    const pagesToNextMilestone = nextMilestone 
      ? nextMilestone - currentPage 
      : totalPages - currentPage;
    
    // Message d'encouragement pour le streak
    const streakMessage = getStreakMessage(streak);
    
    return {
      currentPage,
      totalPagesRead,
      streak,
      streakMessage,
      percentage,
      nextMilestone,
      pagesToNextMilestone,
      isLeader,
      rank,
    };
  }, [currentUserProgress, totalPages]);
}

/**
 * Hook pour vérifier si un milestone est atteint
 * 
 * @param previousPage - La page précédente
 * @param newPage - La nouvelle page
 * @returns true si un milestone est franchi
 */
export function checkMilestoneReached(
  previousPage: number,
  newPage: number
): boolean {
  return milestones.some(
    milestone => previousPage < milestone && newPage >= milestone
  );
}

/**
 * Hook pour obtenir le milestone le plus proche atteint
 * 
 * @param page - La page actuelle
 * @returns Le milestone atteint ou null
 */
export function getReachedMilestone(page: number): number | null {
  // Retourne le milestone le plus élevé qui est <= à la page actuelle
  const reached = [...milestones].reverse().find(m => page >= m);
  return reached || null;
}

