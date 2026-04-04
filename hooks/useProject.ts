/**
 * Hook personnalisé pour gérer un projet de lecture
 * 
 * Ce hook encapsule la logique de récupération et d'écoute
 * des changements d'un projet spécifique.
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useProgressStore } from '../stores/progressStore';
import { Project, ParticipantWithProgress } from '../types';

interface UseProjectResult {
  project: Project | null;
  participants: ParticipantWithProgress[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook pour charger et suivre un projet par son ID
 * 
 * @param projectId - L'ID du projet à charger
 * @returns Les données du projet et des participants
 */
export function useProject(projectId: string | undefined): UseProjectResult {
  const { user } = useAuthStore();
  const { 
    currentChallenge: currentProject, 
    loadChallenge: selectProject, 
    isLoading: projectLoading,
    error: projectError 
  } = useProjectStore();
  
  const { 
    participants, 
    subscribeToProgress,
    isLoading: progressLoading,
    error: progressError 
  } = useProgressStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Charge le projet au montage
  useEffect(() => {
    if (projectId) {
      selectProject(projectId).then(() => {
        setIsInitialized(true);
      });
    }
  }, [projectId]);
  
  // S'abonne aux changements de progression quand le projet est chargé (+ notifications)
  useEffect(() => {
    if (currentProject && isInitialized && user?.id) {
      const totalPages = currentProject.total_pages ?? 100;
      const bookTitle = currentProject.book_title ?? 'Le livre';
      const unsubscribe = subscribeToProgress(currentProject.id, {
        currentUserId: user.id,
        totalPages,
        bookTitle,
      });
      return () => unsubscribe();
    }
  }, [currentProject?.id, isInitialized, user?.id]);
  
  // Fonction de rafraîchissement
  const refresh = () => {
    if (projectId) {
      selectProject(projectId);
    }
  };
  
  return {
    project: currentProject,
    participants,
    isLoading: projectLoading || progressLoading,
    error: projectError || progressError,
    refresh,
  };
}

