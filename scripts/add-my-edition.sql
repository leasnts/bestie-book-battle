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
-- Sans risque pour les données existantes : ajoute deux colonnes vides.
-- Relançable sans erreur.
--
-- Droits : la policy « Users can update own progress » laisse déjà chacun
-- modifier sa propre ligne, rien à ajouter.
-- =====================================================

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS cover_url text;

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS publisher text;
