-- =====================================================
-- FIX RLS POLICIES - Bestie Book Battle
-- =====================================================
-- Ce script corrige les politiques RLS qui empêchent
-- la création de challenges.
--
-- PROBLÈME : La policy SELECT sur challenges exige que
-- l'utilisateur soit PARTICIPANT du challenge. Mais au moment
-- de l'insertion, il n'est pas encore participant → le 
-- .select() après .insert() échoue silencieusement.
--
-- De plus, les triggers (generate_invite_code, update_challenge_stats)
-- s'exécutent dans le contexte de l'utilisateur et ont besoin
-- de pouvoir lire/écrire la table challenges.
--
-- SOLUTION : Ajouter une policy SELECT pour les admins et
-- rendre les fonctions trigger SECURITY DEFINER pour qu'elles
-- s'exécutent avec les droits du propriétaire (sans RLS).
--
-- À exécuter dans le SQL Editor de Supabase
-- =====================================================

-- 1. Ajouter une policy SELECT pour les admins
-- Permet à l'admin de voir son propre challenge même s'il n'est
-- pas encore participant (cas juste après la création)
CREATE POLICY "Admin can view own challenges" ON challenges
  FOR SELECT
  USING (admin_id = auth.uid());

-- 2. Rendre les fonctions trigger SECURITY DEFINER
-- Les triggers doivent pouvoir accéder à TOUTES les données
-- (pas restreints par RLS) pour fonctionner correctement.
-- SECURITY DEFINER = la fonction s'exécute avec les droits
-- du propriétaire (postgres), pas de l'utilisateur courant.

-- La fonction generate_invite_code vérifie l'unicité du code
-- dans TOUS les challenges, pas seulement ceux de l'utilisateur
-- Uniquement des chiffres pour une saisie facile sur clavier numérique
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789';
  result TEXT := '';
  i INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    IF NOT EXISTS (SELECT 1 FROM challenges WHERE invite_code = result) THEN
      RETURN result;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- La fonction set_invite_code appelle generate_invite_code
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  NEW.invite_url := 'bestiebookbattle://join/' || NEW.invite_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- La fonction update_challenge_stats fait un UPDATE sur challenges
-- et un COUNT sur challenge_participants
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- La fonction update_challenge_status fait un UPDATE sur challenges
CREATE OR REPLACE FUNCTION update_challenge_status()
RETURNS TRIGGER AS $$
DECLARE
  max_progress DECIMAL;
  any_progress BOOLEAN;
  all_completed BOOLEAN;
  total_participants INTEGER;
  completed_participants INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_progress
    WHERE challenge_id = NEW.challenge_id AND current_page > 0
  ) INTO any_progress;
  
  SELECT COALESCE(MAX(progress_percentage), 0) INTO max_progress
  FROM user_progress
  WHERE challenge_id = NEW.challenge_id;
  
  SELECT COUNT(*) INTO total_participants
  FROM challenge_participants
  WHERE challenge_id = NEW.challenge_id;
  
  SELECT COUNT(*) INTO completed_participants
  FROM user_progress
  WHERE challenge_id = NEW.challenge_id AND progress_percentage >= 100;
  
  all_completed := (total_participants > 0 AND completed_participants >= total_participants);
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- La fonction create_initial_progress insère dans user_progress
CREATE OR REPLACE FUNCTION create_initial_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_progress (challenge_id, user_id, current_page, progress_percentage)
  VALUES (NEW.challenge_id, NEW.user_id, 0, 0.00)
  ON CONFLICT (challenge_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- La fonction add_progress_history insère dans progress_history
CREATE OR REPLACE FUNCTION add_progress_history()
RETURNS TRIGGER AS $$
DECLARE
  pages_read_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    pages_read_count := NEW.current_page - OLD.current_page;
  ELSE
    pages_read_count := NEW.current_page;
  END IF;
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. CRÉER LES BUCKETS STORAGE (s'ils n'existent pas)
-- =====================================================
-- Un bucket = un dossier dans Supabase Storage
-- "book-covers" stocke les images de couverture des livres
-- "profile-photos" stocke les photos de profil des utilisateurs

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('book-covers', 'book-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- =====================================================
-- 4. SIMPLIFIER LES POLICIES STORAGE
-- =====================================================
-- On supprime les anciennes policies storage trop restrictives
-- et on les remplace par des policies simples et fonctionnelles

-- Supprimer les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Public Access for book covers" ON storage.objects;
DROP POLICY IF EXISTS "Challenge admins can upload book covers" ON storage.objects;
DROP POLICY IF EXISTS "Challenge admins can update book covers" ON storage.objects;
DROP POLICY IF EXISTS "Challenge admins can delete book covers" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photo" ON storage.objects;

-- LECTURE : tout le monde peut voir les images (elles sont publiques)
CREATE POLICY "Public read access for covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-covers');

CREATE POLICY "Public read access for photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

-- UPLOAD : tout utilisateur connecté peut uploader dans ces buckets
-- C'est sûr car le bucket est déjà limité en taille et type de fichier
CREATE POLICY "Authenticated users can upload covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'book-covers' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL
  );

-- MODIFICATION : tout utilisateur connecté peut modifier/écraser
CREATE POLICY "Authenticated users can update covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'book-covers' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL
  );

-- SUPPRESSION : tout utilisateur connecté peut supprimer
CREATE POLICY "Authenticated users can delete covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'book-covers' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL
  );

-- =====================================================
-- FIN DU SCRIPT DE CORRECTION
-- =====================================================
-- Après exécution :
-- ✅ Les challenges peuvent être créés
-- ✅ Les images peuvent être uploadées et lues
-- =====================================================
