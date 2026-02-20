/**
 * Types TypeScript générés depuis le schéma Supabase
 * 
 * Ces types correspondent exactement à la structure de la base de données PostgreSQL.
 * Ils permettent d'avoir l'autocomplétion et la vérification de types lors des requêtes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Préférences de notification d'un utilisateur
 * Stockées en JSONB dans la base de données
 */
export interface NotificationPreferences {
  enabled: boolean;
  daily_reminder: boolean;
  daily_reminder_time: string; // Format "HH:mm"
  competitive_alerts: boolean;      // Dépassement + écart qui se creuse
  milestone_alerts: boolean;
  streak_alerts: boolean;          // Streak en danger
  goal_reminders: boolean;         // Rappels d'objectifs (deadline demain)
  friend_activity: boolean;        // L'autre vient de mettre à jour
  inactivity_alerts: boolean;      // Pas de mise à jour depuis X jours
  other_finished_book: boolean;    // L'autre a fini le livre
}

/**
 * Interface pour la base de données Supabase
 * Définit la structure de toutes les tables
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID
          apple_user_id: string | null;
          email: string;
          first_name: string;
          last_name: string | null;
          profile_photo_url: string | null;
          notification_token: string | null;
          notification_preferences: NotificationPreferences;
          created_at: string; // ISO timestamp
          last_login_at: string | null; // ISO timestamp
          updated_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          apple_user_id?: string | null;
          email: string;
          first_name: string;
          last_name?: string | null;
          profile_photo_url?: string | null;
          notification_token?: string | null;
          notification_preferences?: NotificationPreferences;
          created_at?: string;
          last_login_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          apple_user_id?: string | null;
          email?: string;
          first_name?: string;
          last_name?: string | null;
          profile_photo_url?: string | null;
          notification_token?: string | null;
          notification_preferences?: NotificationPreferences;
          created_at?: string;
          last_login_at?: string | null;
          updated_at?: string;
        };
      };
      challenges: {
        Row: {
          id: string; // UUID
          invite_code: string;
          invite_url: string;
          book_title: string;
          book_author: string | null;
          total_pages: number;
          cover_url: string | null;
          admin_id: string; // UUID référence users(id)
          status: 'pending' | 'active' | 'completed';
          created_at: string; // ISO timestamp
          started_at: string | null; // ISO timestamp
          target_end_date: string | null; // ISO timestamp
          completed_at: string | null; // ISO timestamp
          average_progress_percentage: number; // Decimal(5,2)
          participant_count: number;
          updated_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          invite_code?: string;
          invite_url?: string;
          book_title: string;
          book_author?: string | null;
          total_pages: number;
          cover_url?: string | null;
          admin_id: string;
          status?: 'pending' | 'active' | 'completed';
          created_at?: string;
          started_at?: string | null;
          target_end_date?: string | null;
          completed_at?: string | null;
          average_progress_percentage?: number;
          participant_count?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invite_code?: string;
          invite_url?: string;
          book_title?: string;
          book_author?: string | null;
          total_pages?: number;
          cover_url?: string | null;
          admin_id?: string;
          status?: 'pending' | 'active' | 'completed';
          created_at?: string;
          started_at?: string | null;
          target_end_date?: string | null;
          completed_at?: string | null;
          average_progress_percentage?: number;
          participant_count?: number;
          updated_at?: string;
        };
      };
      challenge_participants: {
        Row: {
          id: string; // UUID
          challenge_id: string; // UUID référence challenges(id)
          user_id: string; // UUID référence users(id)
          joined_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string; // UUID
          challenge_id: string; // UUID référence challenges(id)
          user_id: string; // UUID référence users(id)
          current_page: number;
          progress_percentage: number; // Decimal(5,2)
          streak_count: number;
          last_streak_date: string | null; // Date only (YYYY-MM-DD)
          last_updated_at: string; // ISO timestamp
          created_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          current_page?: number;
          progress_percentage?: number;
          streak_count?: number;
          last_streak_date?: string | null;
          last_updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          user_id?: string;
          current_page?: number;
          progress_percentage?: number;
          streak_count?: number;
          last_streak_date?: string | null;
          last_updated_at?: string;
          created_at?: string;
        };
      };
      progress_history: {
        Row: {
          id: string; // UUID
          user_progress_id: string; // UUID référence user_progress(id)
          user_id: string; // UUID référence users(id)
          challenge_id: string; // UUID référence challenges(id)
          page_number: number;
          pages_read: number;
          recorded_at: string; // ISO timestamp
          created_date: string; // Date only (YYYY-MM-DD), généré automatiquement
        };
        Insert: {
          id?: string;
          user_progress_id: string;
          user_id: string;
          challenge_id: string;
          page_number: number;
          pages_read: number;
          recorded_at?: string;
          // created_date est généré automatiquement, pas besoin de le fournir
        };
        Update: {
          id?: string;
          user_progress_id?: string;
          user_id?: string;
          challenge_id?: string;
          page_number?: number;
          pages_read?: number;
          recorded_at?: string;
          // created_date est généré automatiquement, pas besoin de le fournir
        };
      };
      challenge_goals: {
        Row: {
          id: string; // UUID
          challenge_id: string; // UUID référence challenges(id)
          type: 'primary' | 'secondary';
          target_pages: number;
          deadline: string; // ISO timestamp
          created_by: string; // UUID référence users(id)
          status: 'active' | 'completed' | 'failed' | 'archived';
          results: Json | null; // { userId: { achieved: boolean, pages: number } }
          created_at: string; // ISO timestamp
          updated_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          challenge_id: string;
          type: 'primary' | 'secondary';
          target_pages: number;
          deadline: string;
          created_by: string;
          status?: 'active' | 'completed' | 'failed' | 'archived';
          results?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          type?: 'primary' | 'secondary';
          target_pages?: number;
          deadline?: string;
          created_by?: string;
          status?: 'active' | 'completed' | 'failed' | 'archived';
          results?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

/**
 * Types helpers pour faciliter l'utilisation
 */

// Type pour une Row (lecture)
export type User = Database['public']['Tables']['users']['Row'];
export type Challenge = Database['public']['Tables']['challenges']['Row'];
export type ChallengeParticipant = Database['public']['Tables']['challenge_participants']['Row'];
export type UserProgress = Database['public']['Tables']['user_progress']['Row'];
export type ProgressHistory = Database['public']['Tables']['progress_history']['Row'];
export type ChallengeGoal = Database['public']['Tables']['challenge_goals']['Row'];

// Type pour Insert (création)
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ChallengeInsert = Database['public']['Tables']['challenges']['Insert'];
export type ChallengeParticipantInsert = Database['public']['Tables']['challenge_participants']['Insert'];
export type UserProgressInsert = Database['public']['Tables']['user_progress']['Insert'];
export type ProgressHistoryInsert = Database['public']['Tables']['progress_history']['Insert'];
export type ChallengeGoalInsert = Database['public']['Tables']['challenge_goals']['Insert'];

// Type pour Update (mise à jour)
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type ChallengeUpdate = Database['public']['Tables']['challenges']['Update'];
export type ChallengeParticipantUpdate = Database['public']['Tables']['challenge_participants']['Update'];
export type UserProgressUpdate = Database['public']['Tables']['user_progress']['Update'];
export type ProgressHistoryUpdate = Database['public']['Tables']['progress_history']['Update'];
export type ChallengeGoalUpdate = Database['public']['Tables']['challenge_goals']['Update'];

/**
 * Types composés pour l'affichage dans l'UI
 * Ces types combinent plusieurs tables via des jointures
 */

export interface ChallengeWithParticipants extends Challenge {
  participants: User[];
  admin: User;
}

export interface UserProgressWithUser extends UserProgress {
  user: User;
}

export interface ProgressHistoryWithDetails extends ProgressHistory {
  user: User;
  challenge: Challenge;
}

export interface ChallengeGoalWithCreator extends ChallengeGoal {
  creator: User;
}

export interface ParticipantWithProgress {
  user: User;
  progress: UserProgress;
  history: ProgressHistory[];
  percentage: number;
  isLeader: boolean;
  rank: number;
}
