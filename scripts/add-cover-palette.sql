-- =====================================================
-- #40 : couleurs de la couverture, stockées sur le challenge
-- =====================================================
-- Le fond de l'accueil reprend les couleurs de la couverture du livre en cours.
-- Elles sont extraites une fois par l'app (utils/coverPalette.ts) et stockées
-- ici : tout le club voit le même fond, sans recalcul.
--
-- À exécuter dans Supabase → SQL Editor (copier-coller ce fichier).
-- Sans risque pour les données existantes : ajoute une colonne vide, une fonction
-- et un trigger. Relançable sans erreur.
-- =====================================================

-- 1. La colonne
--    NULL      = pas encore calculée
--    []        = calculée, couverture sans couleur (noir et blanc) → fond noyer
--    ["#…", …] = 1 à 3 couleurs hex, de la plus présente à la moins présente
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS cover_palette jsonb;

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS cover_palette_hex_colors;
ALTER TABLE public.challenges
  ADD CONSTRAINT cover_palette_hex_colors CHECK (
    cover_palette IS NULL OR (
      jsonb_typeof(cover_palette) = 'array'
      AND jsonb_array_length(cover_palette) <= 3
      AND NOT jsonb_path_exists(
        cover_palette,
        '$[*] ? (@.type() != "string" || !(@ like_regex "^#[0-9a-f]{6}$"))'
      )
    )
  );

-- 2. Enregistrer la palette d'une couverture existante
--    Seule l'admin peut modifier un challenge (RLS). Or c'est la première
--    personne du club à ouvrir l'accueil qui calcule la palette : cette
--    fonction laisse n'importe quel membre l'enregistrer, mais seulement si
--    elle n'existe pas encore. Elle ne touche à rien d'autre.
CREATE OR REPLACE FUNCTION public.set_cover_palette(p_challenge_id uuid, p_palette jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.challenges AS c
  SET cover_palette = p_palette
  WHERE c.id = p_challenge_id
    AND c.cover_palette IS NULL
    AND (
      c.admin_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.challenge_participants AS p
        WHERE p.challenge_id = c.id
          AND p.user_id = (SELECT auth.uid())
      )
    );
$$;

REVOKE ALL ON FUNCTION public.set_cover_palette(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_cover_palette(uuid, jsonb) TO authenticated;

-- 3. Nouvelle couverture = palette à recalculer
--    Si cover_url change sans qu'une nouvelle palette soit fournie dans la même
--    mise à jour, l'ancienne palette est effacée. L'app la recalcule ensuite.
CREATE OR REPLACE FUNCTION public.reset_cover_palette()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.cover_url IS DISTINCT FROM OLD.cover_url
     AND NEW.cover_palette IS NOT DISTINCT FROM OLD.cover_palette THEN
    NEW.cover_palette := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reset_cover_palette ON public.challenges;
CREATE TRIGGER reset_cover_palette
  BEFORE UPDATE OF cover_url ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_cover_palette();
