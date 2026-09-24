-- =====================================================
-- Mon édition : couverture et éditeur par participant
-- =====================================================
-- Chacun lit son édition (poche, broché, Kindle…). Le nombre de pages est déjà
-- par participant (migrate-per-user-total-pages.sql) ; la couverture et
-- l'éditeur le deviennent aussi.
--
-- NULL = même couverture que le bbb (challenges.cover_url) : l'app retombe
-- dessus. Rien à recopier pour les membres existants.
--
-- À exécuter dans Supabase → SQL Editor (copier-coller ce fichier).
-- Sans risque pour les données existantes : ajoute deux colonnes vides et
-- trois règles de stockage.
-- Relançable sans erreur.
--
-- Droits sur user_progress : la policy « Users can update own progress » laisse déjà chacun
-- modifier sa propre ligne, rien à ajouter.
-- =====================================================

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS cover_url text;

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS publisher text;

-- Stockage : chaque membre envoie la couverture de SON édition, un seul
-- fichier à son nom dans le dossier du bbb : book-covers/{challengeId}/{userId}.jpg
-- (la couverture du bbb, cover.jpg, reste réservée à l'admin).
DROP POLICY IF EXISTS "Members can upload their edition cover" ON storage.objects;
CREATE POLICY "Members can upload their edition cover" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'book-covers'
    AND storage.filename(name) = (SELECT auth.uid())::text || '.jpg'
    AND EXISTS (
      SELECT 1 FROM public.challenge_participants AS p
      WHERE p.challenge_id::text = (storage.foldername(name))[1]
        AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can update their edition cover" ON storage.objects;
CREATE POLICY "Members can update their edition cover" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'book-covers'
    AND storage.filename(name) = (SELECT auth.uid())::text || '.jpg'
    AND EXISTS (
      SELECT 1 FROM public.challenge_participants AS p
      WHERE p.challenge_id::text = (storage.foldername(name))[1]
        AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can delete their edition cover" ON storage.objects;
CREATE POLICY "Members can delete their edition cover" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'book-covers'
    AND storage.filename(name) = (SELECT auth.uid())::text || '.jpg'
  );
