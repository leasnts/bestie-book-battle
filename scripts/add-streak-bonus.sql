-- =====================================================
-- Marque-pages : garder sa série malgré un jour manqué
-- =====================================================
--
-- Chaque lectrice a 3 marque-pages par livre. Un jour sans lecture casse la
-- série ; le lendemain, un marque-page posé sur ce jour manqué la garde
-- (la série ne grandit pas ce jour-là, elle ne retombe pas à 1).
--
-- streak_bonus_dates : les jours couverts par un marque-page, sur ce livre.
-- Le nombre de marque-pages utilisés = sa longueur.

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS streak_bonus_dates date[] NOT NULL DEFAULT '{}';

-- Poser un marque-page sur hier.
-- Possible seulement si la dernière lecture date d'avant-hier (un seul jour
-- manqué), que la série existe et qu'il en reste. Retourne la ligne mise à
-- jour, ou rien si ce n'est pas possible.
--
-- Le trigger update_streak ne se déclenche que sur current_page : changer
-- last_streak_date ici ne le relance pas.
CREATE OR REPLACE FUNCTION public.use_streak_bonus(p_challenge_id uuid)
RETURNS SETOF public.user_progress
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.user_progress
  SET last_streak_date = CURRENT_DATE - 1,
      streak_bonus_dates = array_append(streak_bonus_dates, CURRENT_DATE - 1)
  WHERE user_id = auth.uid()
    AND challenge_id = p_challenge_id
    AND streak_count > 0
    AND last_streak_date = CURRENT_DATE - 2
    AND cardinality(streak_bonus_dates) < 3
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.use_streak_bonus(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.use_streak_bonus(uuid) TO authenticated;
