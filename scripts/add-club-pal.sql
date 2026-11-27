-- =====================================================
-- La PAL du club (#238, étape 2) : proposer, voter, choisir le prochain
-- =====================================================
--
-- Validé par Lea le 2026-11-27 (canvas « V1 des clubs ») :
--   - tout membre propose un livre à la PAL du club et met des cœurs, à tout moment
--   - l'admin choisit le prochain quand il veut, même avant la fin du livre en
--     cours : « Je choisis », « Le plus voté » ou « Tirage au sort » (le tirage
--     se fait sur le téléphone, animé ; la base reçoit le livre tiré)
--   - le livre choisi s'affiche « Ensuite » et démarre à la date de fin du livre
--     en cours (challenges.starts_on) ; chacun le rejoint (« Rejoindre la lecture »)

-- Le jour où une lecture de club commence ; nul = déjà commencée (ou hors club)
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS starts_on date;

CREATE TABLE IF NOT EXISTS public.club_pal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  book_title text NOT NULL CHECK (char_length(btrim(book_title)) BETWEEN 1 AND 300),
  book_author text,
  cover_url text,
  total_pages integer CHECK (total_pages IS NULL OR total_pages > 0),
  isbn text,
  proposed_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Choisi : la lecture du club qu'il est devenu (il quitte la PAL)
  chosen_challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS club_pal_club_idx ON public.club_pal (club_id);
-- Un même livre une seule fois dans la PAL (tant qu'il n'est pas choisi)
CREATE UNIQUE INDEX IF NOT EXISTS club_pal_once_idx
  ON public.club_pal (club_id, lower(btrim(book_title))) WHERE chosen_challenge_id IS NULL;

CREATE TABLE IF NOT EXISTS public.club_pal_votes (
  pal_id uuid NOT NULL REFERENCES public.club_pal(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pal_id, user_id)
);
CREATE INDEX IF NOT EXISTS club_pal_votes_user_idx ON public.club_pal_votes (user_id);

ALTER TABLE public.club_pal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_pal_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membres voient la PAL" ON public.club_pal;
CREATE POLICY "Membres voient la PAL" ON public.club_pal FOR SELECT
  USING (public.is_club_member(club_id, (SELECT auth.uid())));
DROP POLICY IF EXISTS "Membres proposent" ON public.club_pal;
CREATE POLICY "Membres proposent" ON public.club_pal FOR INSERT
  WITH CHECK (proposed_by = (SELECT auth.uid()) AND public.is_club_member(club_id, (SELECT auth.uid())));
DROP POLICY IF EXISTS "Retirer sa proposition" ON public.club_pal;
CREATE POLICY "Retirer sa proposition" ON public.club_pal FOR DELETE
  USING (proposed_by = (SELECT auth.uid()) OR public.is_club_admin(club_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Membres voient les cœurs" ON public.club_pal_votes;
CREATE POLICY "Membres voient les cœurs" ON public.club_pal_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.club_pal p WHERE p.id = pal_id));
DROP POLICY IF EXISTS "Je mets un cœur" ON public.club_pal_votes;
CREATE POLICY "Je mets un cœur" ON public.club_pal_votes FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.club_pal p WHERE p.id = pal_id));
DROP POLICY IF EXISTS "Je retire mon cœur" ON public.club_pal_votes;
CREATE POLICY "Je retire mon cœur" ON public.club_pal_votes FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- L'admin choisit le prochain livre dans la PAL : il devient une lecture du
-- club qui démarre à la fin de celle en cours (aujourd'hui s'il n'y en a pas,
-- ou si elle est finie). Un seul « Ensuite » à la fois.
CREATE OR REPLACE FUNCTION public.choose_club_next(p_pal_id uuid)
RETURNS public.challenges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pal public.club_pal;
  v_current public.challenges;
  v_starts date;
  v_new public.challenges;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  SELECT * INTO v_pal FROM club_pal WHERE id = p_pal_id;
  IF v_pal.id IS NULL OR v_pal.chosen_challenge_id IS NOT NULL THEN RAISE EXCEPTION 'Livre introuvable'; END IF;
  IF NOT public.is_club_admin(v_pal.club_id, auth.uid()) THEN RAISE EXCEPTION 'Réservé à l''admin du book club'; END IF;
  IF EXISTS (SELECT 1 FROM challenges WHERE club_id = v_pal.club_id AND starts_on > current_date) THEN
    RAISE EXCEPTION 'Le prochain livre est déjà choisi';
  END IF;

  SELECT * INTO v_current FROM challenges
    WHERE club_id = v_pal.club_id AND status <> 'completed' AND (starts_on IS NULL OR starts_on <= current_date)
    ORDER BY created_at DESC LIMIT 1;
  v_starts := CASE
    WHEN v_current.id IS NULL OR v_current.target_end_date IS NULL
      OR v_current.target_end_date::date <= current_date THEN current_date
    ELSE v_current.target_end_date::date + 1
  END;

  INSERT INTO challenges (book_title, book_author, cover_url, total_pages, admin_id, status, club_id, starts_on, invite_code)
  VALUES (v_pal.book_title, v_pal.book_author, v_pal.cover_url,
          -- Sans nombre de pages connu : chacun donne celui de son édition en rejoignant
          COALESCE(v_pal.total_pages, 300),
          auth.uid(), 'pending', v_pal.club_id, v_starts, '')
  RETURNING * INTO v_new;

  UPDATE club_pal SET chosen_challenge_id = v_new.id WHERE id = v_pal.id;
  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.choose_club_next(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.choose_club_next(uuid) TO authenticated;
