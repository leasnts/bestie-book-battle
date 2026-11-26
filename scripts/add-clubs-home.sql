-- =====================================================
-- Clubs V1 bis (#238) : la maison du club
-- =====================================================
--
-- - Un code par club (6 caractères, sans 0/O ni 1/I) : lien, code, QR.
-- - Rejoindre : club « open » = on entre, « request » = en attente de l'admin.
-- - Créer un club de zéro (sans lecture).
-- - Aperçu d'un club par son code, pour qui n'en est pas encore membre.
-- - Retirer quelqu'un le retire aussi des lectures en cours du club.
-- - Le dernier admin qui part : le plus ancien membre le remplace ; club vide
--   = club supprimé (ses lectures restent, hors club).

CREATE OR REPLACE FUNCTION public.new_club_code()
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  FROM generate_series(1, 6);
$$;

ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS invite_code text;
UPDATE public.clubs SET invite_code = public.new_club_code() WHERE invite_code IS NULL;
ALTER TABLE public.clubs ALTER COLUMN invite_code SET DEFAULT public.new_club_code();
ALTER TABLE public.clubs ALTER COLUMN invite_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS clubs_invite_code_idx ON public.clubs (invite_code);

ALTER TABLE public.club_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending'));

-- Membre = membre ACTIF (une demande en attente ne voit rien du club)
CREATE OR REPLACE FUNCTION public.is_club_member(p_club_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM club_members WHERE club_id = p_club_id AND user_id = p_user_id AND status = 'active');
$$;
CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM club_members WHERE club_id = p_club_id AND user_id = p_user_id AND role = 'admin' AND status = 'active');
$$;

-- Je vois ma propre demande en attente
DROP POLICY IF EXISTS "Membres voient les membres" ON public.club_members;
CREATE POLICY "Membres voient les membres" ON public.club_members FOR SELECT
  USING (public.is_club_member(club_id, (SELECT auth.uid())) OR user_id = (SELECT auth.uid()));

-- Créer un club de zéro : moi admin
CREATE OR REPLACE FUNCTION public.create_club(p_name text)
RETURNS public.clubs LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_club public.clubs;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  INSERT INTO clubs (name, admin_id) VALUES (btrim(p_name), auth.uid()) RETURNING * INTO v_club;
  INSERT INTO club_members (club_id, user_id, role) VALUES (v_club.id, auth.uid(), 'admin');
  RETURN v_club;
END;
$$;

-- Aperçu d'un club par son code (avant de le rejoindre)
CREATE OR REPLACE FUNCTION public.get_club_preview(p_code text)
RETURNS TABLE (id uuid, name text, photo_url text, join_mode text, member_count bigint,
               book_title text, cover_url text, my_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT c.id, c.name, c.photo_url, c.join_mode,
    (SELECT count(*) FROM club_members m WHERE m.club_id = c.id AND m.status = 'active'),
    r.book_title, r.cover_url,
    (SELECT m.status FROM club_members m WHERE m.club_id = c.id AND m.user_id = auth.uid())
  FROM clubs c
  LEFT JOIN LATERAL (
    SELECT ch.book_title, ch.cover_url FROM challenges ch
    WHERE ch.club_id = c.id AND ch.status <> 'completed'
    ORDER BY ch.created_at DESC LIMIT 1
  ) r ON true
  WHERE c.invite_code = upper(btrim(p_code));
$$;

-- Rejoindre par le code : 'active' (club ouvert) ou 'pending' (sur demande)
CREATE OR REPLACE FUNCTION public.join_club(p_code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_club public.clubs; v_status text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  SELECT * INTO v_club FROM clubs WHERE invite_code = upper(btrim(p_code));
  IF v_club.id IS NULL THEN RAISE EXCEPTION 'Code inconnu'; END IF;
  v_status := CASE WHEN v_club.join_mode = 'request' THEN 'pending' ELSE 'active' END;
  INSERT INTO club_members (club_id, user_id, status) VALUES (v_club.id, auth.uid(), v_status)
    ON CONFLICT (club_id, user_id) DO NOTHING;
  SELECT status INTO v_status FROM club_members WHERE club_id = v_club.id AND user_id = auth.uid();
  RETURN v_status;
END;
$$;

-- Après un départ : retiré par quelqu'un d'autre = sorti des lectures en cours
-- du club ; plus d'admin = le plus ancien membre le devient ; plus personne =
-- le club disparaît (ses lectures restent, hors club)
CREATE OR REPLACE FUNCTION public.after_club_member_left()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  -- Le club lui-même est supprimé (cascade) : on ne touche à rien
  IF NOT EXISTS (SELECT 1 FROM clubs WHERE id = OLD.club_id) THEN RETURN OLD; END IF;
  IF auth.uid() IS DISTINCT FROM OLD.user_id THEN
    DELETE FROM challenge_participants p USING challenges c
      WHERE p.challenge_id = c.id AND c.club_id = OLD.club_id AND c.status <> 'completed'
        AND p.user_id = OLD.user_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM club_members WHERE club_id = OLD.club_id AND status = 'active') THEN
    DELETE FROM clubs WHERE id = OLD.club_id;
  ELSIF NOT EXISTS (SELECT 1 FROM club_members WHERE club_id = OLD.club_id AND role = 'admin' AND status = 'active') THEN
    UPDATE club_members SET role = 'admin'
      WHERE (club_id, user_id) = (
        SELECT club_id, user_id FROM club_members
        WHERE club_id = OLD.club_id AND status = 'active' ORDER BY joined_at LIMIT 1);
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS after_club_member_left ON public.club_members;
CREATE TRIGGER after_club_member_left AFTER DELETE ON public.club_members
  FOR EACH ROW EXECUTE FUNCTION public.after_club_member_left();

-- Les membres d'un club voient ses lectures, même sans les lire (page du club,
-- « Je lis aussi »)
DROP POLICY IF EXISTS "Club members view club challenges" ON public.challenges;
CREATE POLICY "Club members view club challenges" ON public.challenges FOR SELECT
  USING (club_id IS NOT NULL AND public.is_club_member(club_id, (SELECT auth.uid())));
