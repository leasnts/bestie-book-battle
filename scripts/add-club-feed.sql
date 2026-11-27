-- =====================================================
-- Le fil du club (#246) : les actus des membres
-- =====================================================
--
-- Rien de nouveau à saisir : le fil lit ce que les membres font déjà.
--   - note        : une note visible du club (verrouillée si elle est plus loin
--                   que ma page, ou si je ne lis pas ce livre : qui + page, jamais
--                   le texte, comme annotations_ahead)
--   - cap         : un membre passe 25, 50 ou 75 % (progress_history)
--   - finished    : un membre finit le livre
--   - joined      : quelqu'un arrive dans le club
--   - club_done   : le club a fini une lecture
-- Pas de « passe devant » (trop souvent), pas de message libre (Lea, 2026-11-27).
--
-- On réagit aux posts avec un emoji : les notes gardent annotation_reactions,
-- les autres posts ont club_feed_reactions (clé stable de l'événement).

CREATE TABLE IF NOT EXISTS public.club_feed_reactions (
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  -- « cap:<lecture>:<membre>:50 », « finished:<lecture>:<membre> »,
  -- « joined:<membre> », « club_done:<lecture> »
  event_key text NOT NULL CHECK (char_length(event_key) <= 120),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (char_length(emoji) <= 16),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, event_key, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS club_feed_reactions_user_idx ON public.club_feed_reactions (user_id);

ALTER TABLE public.club_feed_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membres voient les réactions du fil" ON public.club_feed_reactions;
CREATE POLICY "Membres voient les réactions du fil" ON public.club_feed_reactions FOR SELECT
  USING (public.is_club_member(club_id, (SELECT auth.uid())));
DROP POLICY IF EXISTS "Je réagis dans le fil" ON public.club_feed_reactions;
CREATE POLICY "Je réagis dans le fil" ON public.club_feed_reactions FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_club_member(club_id, (SELECT auth.uid())));
DROP POLICY IF EXISTS "Je retire ma réaction du fil" ON public.club_feed_reactions;
CREATE POLICY "Je retire ma réaction du fil" ON public.club_feed_reactions FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.get_club_feed(p_club_id uuid, p_limit int DEFAULT 40)
RETURNS TABLE (
  kind text,
  event_key text,
  at timestamptz,
  user_id uuid,
  first_name text,
  profile_photo_url text,
  challenge_id uuid,
  book_title text,
  cover_url text,
  cap int,
  annotation_id uuid,
  page int,
  locked boolean,
  reactions jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH me AS (SELECT auth.uid() AS id),
  allowed AS (
    SELECT public.is_club_member(p_club_id, (SELECT id FROM me)) AS ok
  ),
  reads AS (
    SELECT c.* FROM challenges c WHERE c.club_id = p_club_id
  ),
  -- Les notes du club, verrouillées ou non
  notes AS (
    SELECT
      'note'::text AS kind,
      'note:' || a.id AS event_key,
      a.created_at AS at,
      a.user_id,
      a.challenge_id,
      a.id AS annotation_id,
      -- La page dans MON édition ; même édition (ou je ne lis pas) : la page de la note
      CASE WHEN COALESCE(NULLIF(mine.total_pages, 0), a.edition_total_pages) = a.edition_total_pages THEN a.page
           ELSE GREATEST(1, ROUND(a.position * mine.total_pages))::int END AS page,
      NOT (
        a.user_id = (SELECT id FROM me)
        OR (mine.user_id IS NOT NULL
            AND CASE WHEN mine.total_pages > 0 THEN mine.current_page::numeric / mine.total_pages ELSE 0 END
                >= a.position + public.annotation_unlock_margin())
      ) AS locked,
      NULL::int AS cap
    FROM annotations a
    JOIN reads r ON r.id = a.challenge_id
    LEFT JOIN user_progress mine ON mine.challenge_id = a.challenge_id AND mine.user_id = (SELECT id FROM me)
    WHERE a.visibility = 'club'
  ),
  -- Le premier moment où chacun passe chaque cap
  crossings AS (
    SELECT h.challenge_id, h.user_id, t.cap, MIN(h.recorded_at) AS at
    FROM progress_history h
    JOIN reads r ON r.id = h.challenge_id
    JOIN user_progress p ON p.challenge_id = h.challenge_id AND p.user_id = h.user_id
    CROSS JOIN (VALUES (25), (50), (75), (100)) t(cap)
    WHERE h.page_number::numeric >= t.cap / 100.0 * COALESCE(NULLIF(p.total_pages, 0), r.total_pages)
      -- Une lecture finie par le club : « Le club a fini » suffit, pas un post
      -- par membre ni ses vieux caps
      AND r.status <> 'completed'
    GROUP BY 1, 2, 3
  ),
  -- Un grand bond (0 → 80 %) ne fait qu'un post : le cap le plus haut
  caps AS (
    SELECT DISTINCT ON (x.challenge_id, x.user_id, x.at)
      CASE WHEN x.cap = 100 THEN 'finished' ELSE 'cap' END AS kind,
      CASE WHEN x.cap = 100 THEN 'finished:' || x.challenge_id || ':' || x.user_id
           ELSE 'cap:' || x.challenge_id || ':' || x.user_id || ':' || x.cap END AS event_key,
      x.at, x.user_id, x.challenge_id, NULL::uuid AS annotation_id, NULL::int AS page, false AS locked,
      x.cap
    FROM crossings x
    ORDER BY x.challenge_id, x.user_id, x.at, x.cap DESC
  ),
  -- Les arrivées (pas la créatrice, le jour où elle crée le club)
  joins AS (
    SELECT 'joined'::text, 'joined:' || m.user_id, m.joined_at, m.user_id, NULL::uuid, NULL::uuid,
      NULL::int, false, NULL::int
    FROM club_members m
    JOIN clubs c ON c.id = m.club_id
    WHERE m.club_id = p_club_id AND m.status = 'active'
      AND NOT (m.user_id = c.admin_id AND m.joined_at < c.created_at + interval '1 minute')
  ),
  done AS (
    SELECT 'club_done'::text, 'club_done:' || r.id, r.completed_at, NULL::uuid, r.id, NULL::uuid,
      NULL::int, false, NULL::int
    FROM reads r
    -- Une actu, pas l'historique : les plus anciennes sont sur l'étagère du club
    WHERE r.status = 'completed' AND r.completed_at > now() - interval '30 days'
  ),
  events AS (
    SELECT kind, event_key, at, user_id, challenge_id, annotation_id, page, locked, cap FROM notes
    UNION ALL SELECT kind, event_key, at, user_id, challenge_id, annotation_id, page, locked, cap FROM caps
    UNION ALL SELECT * FROM joins
    UNION ALL SELECT * FROM done
  )
  SELECT
    e.kind, e.event_key, e.at, e.user_id, u.first_name, u.profile_photo_url,
    e.challenge_id, r.book_title, r.cover_url, e.cap, e.annotation_id, e.page, e.locked,
    CASE
      WHEN e.kind = 'note' THEN NULL
      ELSE COALESCE((
        SELECT jsonb_agg(jsonb_build_object('user_id', fr.user_id, 'emoji', fr.emoji, 'created_at', fr.created_at))
        FROM club_feed_reactions fr
        WHERE fr.club_id = p_club_id AND fr.event_key = e.event_key
      ), '[]'::jsonb)
    END
  FROM events e
  LEFT JOIN users u ON u.id = e.user_id
  LEFT JOIN reads r ON r.id = e.challenge_id
  WHERE (SELECT ok FROM allowed)
    AND e.at > now() - interval '120 days'
  ORDER BY e.at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;

REVOKE ALL ON FUNCTION public.get_club_feed(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_club_feed(uuid, int) TO authenticated;

-- La piste de la lecture en cours (onglet Clubs) : où en est chaque lecteur,
-- en %, même pour un membre du club qui ne lit pas encore ce livre
CREATE OR REPLACE FUNCTION public.get_club_reading_track(p_challenge_id uuid)
RETURNS TABLE (user_id uuid, first_name text, profile_photo_url text, percent numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id, u.first_name, u.profile_photo_url,
    LEAST(100, ROUND(100.0 * p.current_page / NULLIF(COALESCE(NULLIF(p.total_pages, 0), c.total_pages), 0), 1))
  FROM user_progress p
  JOIN challenges c ON c.id = p.challenge_id
  JOIN users u ON u.id = p.user_id
  WHERE p.challenge_id = p_challenge_id
    AND (public.is_challenge_member(p_challenge_id)
         OR (c.club_id IS NOT NULL AND public.is_club_member(c.club_id, auth.uid())))
  ORDER BY 4 DESC;
$$;

REVOKE ALL ON FUNCTION public.get_club_reading_track(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_club_reading_track(uuid) TO authenticated;
