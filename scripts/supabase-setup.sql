-- =====================================================
-- BESTIE BOOK BATTLE - SUPABASE SETUP SCRIPT
-- =====================================================
-- Ce script configure toute la base de données Supabase :
-- - Tables et relations
-- - Row Level Security (RLS) policies
-- - Triggers et fonctions automatiques
-- - Indexes pour les performances
-- 
-- À exécuter dans le SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- 1. CRÉATION DES TABLES
-- =====================================================

-- Table des utilisateurs
-- Stocke les informations de profil des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  profile_photo_url TEXT,
  notification_token TEXT,
  notification_preferences JSONB DEFAULT '{
    "enabled": true,
    "daily_reminder": true,
    "daily_reminder_time": "20:00",
    "competitive_alerts": true,
    "milestone_alerts": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des challenges (projets de lecture)
-- Un challenge représente un livre que plusieurs utilisateurs lisent ensemble
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,
  invite_url TEXT UNIQUE NOT NULL,
  
  -- Informations sur le livre
  book_title TEXT NOT NULL,
  book_author TEXT,
  total_pages INTEGER NOT NULL CHECK (total_pages > 0),
  cover_url TEXT,
  
  -- Métadonnées du challenge
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  
  -- Dates importantes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  target_end_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Statistiques calculées automatiquement
  average_progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  participant_count INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de jointure pour les participants des challenges
-- Gère la relation many-to-many entre users et challenges
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un user ne peut rejoindre un challenge qu'une seule fois
  UNIQUE(challenge_id, user_id)
);

-- Table de progression des utilisateurs
-- Stocke la progression actuelle de chaque utilisateur dans chaque challenge
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  current_page INTEGER DEFAULT 0 CHECK (current_page >= 0),
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  streak_count INTEGER DEFAULT 0,
  last_streak_date DATE,
  
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un user ne peut avoir qu'une seule progression par challenge
  UNIQUE(challenge_id, user_id)
);

-- Table d'historique des progressions
-- Garde un historique complet de toutes les mises à jour de pages
CREATE TABLE IF NOT EXISTS progress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_progress_id UUID NOT NULL REFERENCES user_progress(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  
  page_number INTEGER NOT NULL CHECK (page_number >= 0),
  pages_read INTEGER NOT NULL CHECK (pages_read >= 0),
  
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Colonne générée pour faciliter les requêtes par date
  created_date DATE GENERATED ALWAYS AS (DATE(recorded_at)) STORED
);

-- =====================================================
-- 2. INDEXES POUR LES PERFORMANCES
-- =====================================================

-- Index sur les emails pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_apple_user_id ON users(apple_user_id);

-- Index sur les codes d'invitation pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_challenges_invite_code ON challenges(invite_code);
CREATE INDEX IF NOT EXISTS idx_challenges_admin_id ON challenges(admin_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

-- Index sur les participants pour les jointures
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);

-- Index sur les progressions pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_progress_challenge_id ON user_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Index sur l'historique pour les requêtes par date
CREATE INDEX IF NOT EXISTS idx_progress_history_user_progress_id ON progress_history(user_progress_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_challenge_id ON progress_history(challenge_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_user_id ON progress_history(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_created_date ON progress_history(created_date);

-- =====================================================
-- 3. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour générer un code d'invitation aléatoire de 6 caractères
-- Utilise uniquement des caractères facilement lisibles (pas de O, I, 0, 1)
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Essayer de générer un code unique
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Vérifier si le code existe déjà
    IF NOT EXISTS (SELECT 1 FROM challenges WHERE invite_code = result) THEN
      RETURN result;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour définir le code d'invitation et l'URL
-- Appelée automatiquement avant l'insertion d'un nouveau challenge
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  NEW.invite_url := 'bestiebookbattle://join/' || NEW.invite_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le pourcentage de progression
-- Appelée automatiquement quand la page actuelle change
CREATE OR REPLACE FUNCTION calculate_progress_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_pages INTEGER;
BEGIN
  SELECT c.total_pages INTO total_pages
  FROM challenges c
  WHERE c.id = NEW.challenge_id;
  
  IF total_pages > 0 THEN
    NEW.progress_percentage := ROUND((NEW.current_page::DECIMAL / total_pages::DECIMAL) * 100, 2);
  ELSE
    NEW.progress_percentage := 0.00;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques du challenge
-- Calcule la moyenne de progression et le nombre de participants
CREATE OR REPLACE FUNCTION update_challenge_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE challenges
  SET 
    average_progress_percentage = COALESCE((
      SELECT ROUND(AVG(progress_percentage), 2)
      FROM user_progress
      WHERE challenge_id = NEW.challenge_id
    ), 0.00),
    participant_count = (
      SELECT COUNT(*)
      FROM challenge_participants
      WHERE challenge_id = NEW.challenge_id
    ),
    updated_at = NOW()
  WHERE id = NEW.challenge_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le statut du challenge
-- Détermine si le challenge est pending, active, ou completed
CREATE OR REPLACE FUNCTION update_challenge_status()
RETURNS TRIGGER AS $$
DECLARE
  max_progress DECIMAL;
  any_progress BOOLEAN;
  all_completed BOOLEAN;
  total_participants INTEGER;
  completed_participants INTEGER;
BEGIN
  -- Vérifier si quelqu'un a commencé à lire
  SELECT EXISTS(
    SELECT 1 FROM user_progress
    WHERE challenge_id = NEW.challenge_id AND current_page > 0
  ) INTO any_progress;
  
  -- Obtenir la progression maximale
  SELECT COALESCE(MAX(progress_percentage), 0) INTO max_progress
  FROM user_progress
  WHERE challenge_id = NEW.challenge_id;
  
  -- Compter les participants et ceux qui ont terminé
  SELECT COUNT(*) INTO total_participants
  FROM challenge_participants
  WHERE challenge_id = NEW.challenge_id;
  
  SELECT COUNT(*) INTO completed_participants
  FROM user_progress
  WHERE challenge_id = NEW.challenge_id AND progress_percentage >= 100;
  
  -- Déterminer si tous ont terminé
  all_completed := (total_participants > 0 AND completed_participants >= total_participants);
  
  -- Mettre à jour le statut
  UPDATE challenges
  SET 
    status = CASE
      WHEN all_completed THEN 'completed'
      WHEN any_progress THEN 'active'
      ELSE 'pending'
    END,
    started_at = CASE
      WHEN started_at IS NULL AND any_progress THEN NOW()
      ELSE started_at
    END,
    completed_at = CASE
      WHEN status != 'completed' AND all_completed THEN NOW()
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE id = NEW.challenge_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour gérer le streak (série de jours consécutifs)
-- Met à jour le compteur de streak quand l'utilisateur lit
CREATE OR REPLACE FUNCTION update_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
BEGIN
  last_date := OLD.last_streak_date;
  
  -- Si c'est le même jour, ne rien changer
  IF last_date = CURRENT_DATE THEN
    RETURN NEW;
  END IF;
  
  -- Si c'est le lendemain, incrémenter le streak
  IF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    NEW.streak_count := OLD.streak_count + 1;
  -- Si c'est le premier jour ou après une pause, recommencer à 1
  ELSIF last_date IS NULL OR last_date < CURRENT_DATE - INTERVAL '1 day' THEN
    NEW.streak_count := 1;
  END IF;
  
  NEW.last_streak_date := CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour automatiquement le timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer automatiquement l'entrée de progression quand un user rejoint
CREATE OR REPLACE FUNCTION create_initial_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_progress (challenge_id, user_id, current_page, progress_percentage)
  VALUES (NEW.challenge_id, NEW.user_id, 0, 0.00)
  ON CONFLICT (challenge_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter une entrée dans l'historique quand la progression change
CREATE OR REPLACE FUNCTION add_progress_history()
RETURNS TRIGGER AS $$
DECLARE
  pages_read_count INTEGER;
BEGIN
  -- Calculer le nombre de pages lues (différence avec l'ancienne valeur)
  IF TG_OP = 'UPDATE' THEN
    pages_read_count := NEW.current_page - OLD.current_page;
  ELSE
    pages_read_count := NEW.current_page;
  END IF;
  
  -- Ne créer une entrée que si des pages ont été lues
  IF pages_read_count > 0 THEN
    INSERT INTO progress_history (
      user_progress_id,
      user_id,
      challenge_id,
      page_number,
      pages_read
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.challenge_id,
      NEW.current_page,
      pages_read_count
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Trigger pour générer le code d'invitation
CREATE TRIGGER challenges_invite_code_trigger
  BEFORE INSERT ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

-- Trigger pour calculer le pourcentage de progression
CREATE TRIGGER user_progress_percentage_trigger
  BEFORE INSERT OR UPDATE OF current_page ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION calculate_progress_percentage();

-- Trigger pour mettre à jour les stats du challenge après update de progression
CREATE TRIGGER update_challenge_stats_trigger
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_stats();

-- Trigger pour mettre à jour le statut du challenge
CREATE TRIGGER challenge_status_trigger
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_status();

-- Trigger pour gérer le streak
CREATE TRIGGER streak_trigger
  BEFORE UPDATE OF current_page ON user_progress
  FOR EACH ROW
  WHEN (NEW.current_page > OLD.current_page)
  EXECUTE FUNCTION update_streak();

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour créer la progression initiale quand un user rejoint
CREATE TRIGGER create_initial_progress_trigger
  AFTER INSERT ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_progress();

-- Trigger pour ajouter une entrée dans l'historique
CREATE TRIGGER add_progress_history_trigger
  AFTER INSERT OR UPDATE OF current_page ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION add_progress_history();

-- Trigger pour mettre à jour les stats du challenge après ajout de participant
CREATE TRIGGER update_challenge_stats_on_participant_trigger
  AFTER INSERT OR DELETE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_stats();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies pour la table USERS
-- =====================================================

-- Les users peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Les users peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Les users peuvent voir les profils des participants de leurs challenges
CREATE POLICY "Users can view challenge participants" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp1
      JOIN challenge_participants cp2 ON cp1.challenge_id = cp2.challenge_id
      WHERE cp1.user_id = auth.uid() AND cp2.user_id = users.id
    )
  );

-- Permettre l'insertion de nouveaux profils (pour le signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- Policies pour la table CHALLENGES
-- =====================================================

-- Les users peuvent voir les challenges auxquels ils participent
CREATE POLICY "Users can view their challenges" ON challenges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_id = challenges.id AND user_id = auth.uid()
    )
  );

-- Les users authentifiés peuvent créer des challenges
CREATE POLICY "Authenticated users can create challenges" ON challenges
  FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- Seul l'admin peut mettre à jour le challenge
CREATE POLICY "Admin can update challenge" ON challenges
  FOR UPDATE
  USING (admin_id = auth.uid());

-- Seul l'admin peut supprimer le challenge
CREATE POLICY "Admin can delete challenge" ON challenges
  FOR DELETE
  USING (admin_id = auth.uid());

-- =====================================================
-- Policies pour la table CHALLENGE_PARTICIPANTS
-- =====================================================

-- Les users peuvent voir les participants de leurs challenges
CREATE POLICY "Users can view participants of their challenges" ON challenge_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = challenge_participants.challenge_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Les users peuvent rejoindre des challenges
CREATE POLICY "Users can join challenges" ON challenge_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les users peuvent quitter leurs challenges (ou l'admin peut retirer quelqu'un)
CREATE POLICY "Users can leave challenges or admin can remove" ON challenge_participants
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM challenges 
      WHERE id = challenge_participants.challenge_id 
      AND admin_id = auth.uid()
    )
  );

-- =====================================================
-- Policies pour la table USER_PROGRESS
-- =====================================================

-- Les users peuvent voir les progressions de leur challenge
CREATE POLICY "Users can view progress in their challenges" ON user_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_id = user_progress.challenge_id 
      AND user_id = auth.uid()
    )
  );

-- Les users peuvent mettre à jour leur propre progression
CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Permettre l'insertion automatique de progression (via trigger)
CREATE POLICY "Allow insert progress for participants" ON user_progress
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_id = user_progress.challenge_id 
      AND user_id = user_progress.user_id
    )
  );

-- =====================================================
-- Policies pour la table PROGRESS_HISTORY
-- =====================================================

-- Les users peuvent voir l'historique de leur challenge
CREATE POLICY "Users can view history in their challenges" ON progress_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_id = progress_history.challenge_id 
      AND user_id = auth.uid()
    )
  );

-- Permettre l'insertion automatique d'historique (via trigger)
CREATE POLICY "Allow insert history for progress updates" ON progress_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_id = progress_history.challenge_id 
      AND user_id = progress_history.user_id
    )
  );

-- =====================================================
-- 6. STORAGE BUCKETS (à exécuter manuellement dans l'interface)
-- =====================================================

-- Ces commandes doivent être exécutées dans l'interface Storage de Supabase :
--
-- 1. Créer le bucket "profile-photos" :
--    - Public: true
--    - File size limit: 2MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- 2. Créer le bucket "book-covers" :
--    - Public: true
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- RLS Policies pour Storage (à ajouter via SQL Editor) :

-- Policy pour profile-photos : tout le monde peut lire, seul le propriétaire peut upload
CREATE POLICY "Public Access for profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own profile photo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own profile photo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy pour book-covers : tout le monde peut lire, participants peuvent upload
CREATE POLICY "Public Access for book covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-covers');

CREATE POLICY "Challenge admins can upload book covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'book-covers'
    AND EXISTS (
      SELECT 1 FROM challenges 
      WHERE id::text = (storage.foldername(name))[1]
      AND admin_id = auth.uid()
    )
  );

CREATE POLICY "Challenge admins can update book covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'book-covers'
    AND EXISTS (
      SELECT 1 FROM challenges 
      WHERE id::text = (storage.foldername(name))[1]
      AND admin_id = auth.uid()
    )
  );

CREATE POLICY "Challenge admins can delete book covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'book-covers'
    AND EXISTS (
      SELECT 1 FROM challenges 
      WHERE id::text = (storage.foldername(name))[1]
      AND admin_id = auth.uid()
    )
  );

-- =====================================================
-- 7. ENABLE REALTIME
-- =====================================================

-- Activer Realtime pour les tables qui nécessitent des updates en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE user_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE progress_history;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Pour vérifier que tout est bien créé :
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
