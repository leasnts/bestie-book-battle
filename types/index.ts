/**
 * Types TypeScript pour l'application Bestie Book Battle
 * 
 * Ces interfaces définissent la structure des données utilisées dans l'app :
 * - User : les informations d'un utilisateur
 * - Project : un projet de lecture partagé
 * - UserProgress : la progression d'un utilisateur dans un projet
 * - ProgressEntry : une entrée dans l'historique de lecture
 */

// Représente un utilisateur de l'application
export interface User {
  id: string;                    // Identifiant unique Supabase
  name: string;                  // Nom affiché
  email: string;                 // Email de connexion
  profilePhotoUrl?: string | number; // URL ou image locale (require retourne un nombre)
  notificationToken?: string;    // Token pour les notifications push
  createdAt: Date;               // Date de création du compte
}

// Représente un projet de lecture partagé entre amis
export interface Project {
  id: string;                    // Identifiant unique du projet
  bookTitle: string;             // Titre du livre
  bookAuthor?: string;           // Auteur du livre (optionnel)
  bookCoverUrl?: string;         // URL de la couverture (optionnel)
  totalPages: number;            // Nombre total de pages
  startDate: Date;               // Date de début du projet
  endDate?: Date;                // Date de fin prévue (optionnel)
  creatorId: string;             // ID de l'utilisateur qui a créé le projet
  participants: string[];        // Liste des IDs des participants
  inviteCode: string;            // Code unique pour rejoindre le projet
  isCompleted: boolean;          // Projet terminé ou non
  createdAt: Date;               // Date de création
}

// Représente la progression d'un utilisateur dans un projet
export interface UserProgress {
  id: string;                    // Format: {projectId}_{userId}
  userId: string;                // ID de l'utilisateur
  projectId: string;             // ID du projet
  currentPage: number;           // Page actuelle
  lastUpdated: Date;             // Dernière mise à jour
  streak: number;                // Jours consécutifs de lecture
  lastStreakDate?: Date;         // Date du dernier jour de streak
  history: ProgressEntry[];      // Historique des entrées
}

// Une entrée dans l'historique de progression
export interface ProgressEntry {
  date: Date;                    // Date de l'entrée
  pageNumber: number;            // Numéro de page atteint
  pagesRead: number;             // Pages lues ce jour-là (calculé)
}

// Données d'un participant avec sa progression (pour l'affichage)
export interface ParticipantWithProgress {
  user: User;
  progress: UserProgress;
  percentage: number;            // Pourcentage de progression
  isLeader: boolean;             // Est le leader (le plus avancé)
  rank: number;                  // Position dans le classement
}

// État d'authentification
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Entrée d'activité pour le feed
export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  projectId: string;
  projectTitle: string;
  type: 'progress_update' | 'project_joined' | 'project_created' | 'milestone';
  data: {
    pagesRead?: number;
    currentPage?: number;
    milestone?: number;
  };
  createdAt: Date;
}

// Paramètres de notification
export interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string;     // Format "HH:mm"
  competitiveAlerts: boolean;    // Alertes quand quelqu'un te dépasse
  milestoneAlerts: boolean;      // Alertes pour les milestones
}

// Types pour les formulaires
export interface CreateProjectForm {
  bookTitle: string;
  bookAuthor?: string;
  totalPages: number;
  startDate: Date;
}

export interface UpdateProgressForm {
  currentPage: number;
  projectId: string;
}

