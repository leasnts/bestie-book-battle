-- =====================================================
-- Palier de série : relancer sa série avec un objectif (#236)
-- =====================================================
--
-- Quand la série est finie (trop de jours manqués pour les marque-pages), on
-- la relance en visant un palier : 3, 7, 14 jours… La gélule de l'accueil
-- montre « 2/7 » ; palier atteint, on propose le suivant.
--
-- streak_goal : le palier visé sur ce livre, null = pas d'objectif.
-- Changé par la lectrice elle-même (RLS d'update de user_progress) ; le
-- trigger update_streak ne regarde que current_page, il n'y touche pas.

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS streak_goal smallint
  CHECK (streak_goal IS NULL OR streak_goal BETWEEN 1 AND 365);
