-- =====================================================
-- Clubs V1 (#238) : un groupe de lecture qui dure
-- =====================================================
--
-- Un club = un nom (20 caractères), une photo, des membres, et ses lectures à
-- la suite (challenges.club_id). Optionnel : une lecture sans club reste comme
-- avant. Un groupe devient un club depuis la fiche du livre
-- (create_club_from_challenge) : tous ses lecteurs en deviennent membres.
-- Rejoindre une lecture d'un club = rejoindre le club (trigger).

CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 20),
  photo_url text,
  admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Rejoindre : 'open' = le lien suffit, 'request' = l'admin valide (plus tard)
  join_mode text NOT NULL DEFAULT 'open' CHECK (join_mode IN ('open', 'request')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_members (
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);
CREATE INDEX IF NOT EXISTS club_members_user_idx ON public.club_members (user_id);

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS challenges_club_idx ON public.challenges (club_id);

-- Qui est membre, sans repasser par les règles de club_members (sinon elles
-- s'appellent elles-mêmes)
CREATE OR REPLACE FUNCTION public.is_club_member(p_club_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM club_members WHERE club_id = p_club_id AND user_id = p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM club_members WHERE club_id = p_club_id AND user_id = p_user_id AND role = 'admin');
$$;

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membres voient leur club" ON public.clubs;
CREATE POLICY "Membres voient leur club" ON public.clubs FOR SELECT
  USING (public.is_club_member(id, (SELECT auth.uid())));
DROP POLICY IF EXISTS "Admins modifient leur club" ON public.clubs;
CREATE POLICY "Admins modifient leur club" ON public.clubs FOR UPDATE
  USING (public.is_club_admin(id, (SELECT auth.uid())));
DROP POLICY IF EXISTS "Admins suppriment leur club" ON public.clubs;
CREATE POLICY "Admins suppriment leur club" ON public.clubs FOR DELETE
  USING (public.is_club_admin(id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Membres voient les membres" ON public.club_members;
CREATE POLICY "Membres voient les membres" ON public.club_members FOR SELECT
  USING (public.is_club_member(club_id, (SELECT auth.uid())));
-- Partir soi-même, ou un admin qui retire quelqu'un
DROP POLICY IF EXISTS "Partir ou retirer" ON public.club_members;
CREATE POLICY "Partir ou retirer" ON public.club_members FOR DELETE
  USING (user_id = (SELECT auth.uid()) OR public.is_club_admin(club_id, (SELECT auth.uid())));
DROP POLICY IF EXISTS "Admins nomment" ON public.club_members;
CREATE POLICY "Admins nomment" ON public.club_members FOR UPDATE
  USING (public.is_club_admin(club_id, (SELECT auth.uid())));

-- Les membres d'un club se voient (photo, prénom), même sans lecture commune
DROP POLICY IF EXISTS "Users can view club co-members" ON public.users;
CREATE POLICY "Users can view club co-members" ON public.users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.club_members m
    WHERE m.user_id = users.id AND public.is_club_member(m.club_id, (SELECT auth.uid()))
  ));

-- Faire un club d'un groupe : seul l'admin de la lecture ; tous ses lecteurs
-- deviennent membres, l'admin du club c'est moi. Retourne le club.
CREATE OR REPLACE FUNCTION public.create_club_from_challenge(p_challenge_id uuid, p_name text)
RETURNS public.clubs LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_club public.clubs;
  v_me uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM challenges WHERE id = p_challenge_id AND admin_id = v_me AND club_id IS NULL) THEN
    RAISE EXCEPTION 'Seul l''admin d''une lecture sans club peut en faire un club';
  END IF;
  INSERT INTO clubs (name, admin_id) VALUES (btrim(p_name), v_me) RETURNING * INTO v_club;
  INSERT INTO club_members (club_id, user_id, role)
    SELECT v_club.id, p.user_id, CASE WHEN p.user_id = v_me THEN 'admin' ELSE 'member' END
    FROM challenge_participants p WHERE p.challenge_id = p_challenge_id
    ON CONFLICT DO NOTHING;
  INSERT INTO club_members (club_id, user_id, role) VALUES (v_club.id, v_me, 'admin')
    ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'admin';
  UPDATE challenges SET club_id = v_club.id WHERE id = p_challenge_id;
  RETURN v_club;
END;
$$;

-- Rejoindre une lecture d'un club = rejoindre le club
CREATE OR REPLACE FUNCTION public.join_club_with_challenge()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO club_members (club_id, user_id)
    SELECT c.club_id, NEW.user_id FROM challenges c WHERE c.id = NEW.challenge_id AND c.club_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS join_club_with_challenge ON public.challenge_participants;
CREATE TRIGGER join_club_with_challenge AFTER INSERT ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION public.join_club_with_challenge();

-- Photo du club : bucket public, dossier = id du club, seuls ses admins écrivent
INSERT INTO storage.buckets (id, name, public) VALUES ('club-photos', 'club-photos', true)
  ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Photos des clubs visibles" ON storage.objects;
CREATE POLICY "Photos des clubs visibles" ON storage.objects FOR SELECT
  USING (bucket_id = 'club-photos');
DROP POLICY IF EXISTS "Admins envoient la photo du club" ON storage.objects;
CREATE POLICY "Admins envoient la photo du club" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'club-photos' AND public.is_club_admin(((storage.foldername(name))[1])::uuid, (SELECT auth.uid())));
DROP POLICY IF EXISTS "Admins changent la photo du club" ON storage.objects;
CREATE POLICY "Admins changent la photo du club" ON storage.objects FOR UPDATE
  USING (bucket_id = 'club-photos' AND public.is_club_admin(((storage.foldername(name))[1])::uuid, (SELECT auth.uid())));
DROP POLICY IF EXISTS "Admins suppriment la photo du club" ON storage.objects;
CREATE POLICY "Admins suppriment la photo du club" ON storage.objects FOR DELETE
  USING (bucket_id = 'club-photos' AND public.is_club_admin(((storage.foldername(name))[1])::uuid, (SELECT auth.uid())));
