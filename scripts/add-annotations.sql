-- =====================================================
-- #45 — Le carnet partagé : notes, réactions, lectures
-- =====================================================
-- Une note est posée à une page, dans l'édition de son autrice, et stockée en
-- POSITION (0 → 1) : chacune lit une édition différente, seule la part du livre
-- se compare.
--
-- L'anti-spoil est côté serveur : une note posée plus loin que ma progression
-- n'arrive JAMAIS sur le téléphone. Un filtre côté app se contournerait, et
-- surtout le contenu aurait déjà voyagé.
--
-- À exécuter dans Supabase → SQL Editor (ou `supabase db query --linked -f`).
-- Relançable.
-- =====================================================

-- ─── Types ───────────────────────────────────────────────────────────

-- Six catégories nommées, imposées à tout le club : un bleu doit vouloir dire
-- la même chose pour tout le monde. Le nom s'affiche toujours (daltonisme).
DO $$ BEGIN
  CREATE TYPE public.annotation_category AS ENUM
    ('coup_de_coeur', 'spicy', 'larmes', 'mdr', 'theorie', 'a_retenir');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.annotation_visibility AS ENUM ('club', 'private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Les notes ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- La page telle que l'autrice l'a vue, et son édition : on garde les deux
  -- pour pouvoir réafficher « p. 230 » à l'autrice, exactement.
  page INTEGER NOT NULL CHECK (page >= 0),
  edition_total_pages INTEGER NOT NULL CHECK (edition_total_pages > 0),
  -- Position dans le livre, de 0 à 1 : c'est elle qui voyage entre éditions
  position NUMERIC(6, 5) NOT NULL CHECK (position >= 0 AND position <= 1),

  chapter TEXT,              -- V3
  quote TEXT,                -- V2 (citation par photo)
  body TEXT,
  audio_path TEXT,           -- chemin dans le bucket privé annotation-audio
  audio_seconds INTEGER CHECK (audio_seconds IS NULL OR audio_seconds > 0),
  emoji TEXT,

  category public.annotation_category NOT NULL DEFAULT 'a_retenir',
  visibility public.annotation_visibility NOT NULL DEFAULT 'club',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Une note dit forcément quelque chose : au minimum un emoji.
  CONSTRAINT annotation_has_content CHECK (
    emoji IS NOT NULL
    OR (body IS NOT NULL AND length(btrim(body)) > 0)
    OR audio_path IS NOT NULL
    OR (quote IS NOT NULL AND length(btrim(quote)) > 0)
  )
);

-- Le carnet se lit par livre, dans l'ordre du livre
CREATE INDEX IF NOT EXISTS annotations_challenge_position_idx
  ON public.annotations (challenge_id, position);
-- « Mes notes » et les politiques RLS qui filtrent sur l'autrice
CREATE INDEX IF NOT EXISTS annotations_challenge_user_idx
  ON public.annotations (challenge_id, user_id);

DROP TRIGGER IF EXISTS annotations_updated_at ON public.annotations;
CREATE TRIGGER annotations_updated_at
  BEFORE UPDATE ON public.annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Réactions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.annotation_reactions (
  annotation_id UUID NOT NULL REFERENCES public.annotations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (annotation_id, user_id, emoji)
);

-- ─── Notes lues ──────────────────────────────────────────────────────
-- Sert aux « notes à lire » et aux post-it qui se révèlent sur l'accueil.

CREATE TABLE IF NOT EXISTS public.annotation_reads (
  annotation_id UUID NOT NULL REFERENCES public.annotations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (annotation_id, user_id)
);

-- ─── Où j'en suis, pour l'anti-spoil ────────────────────────────────

/**
 * Ma progression dans un livre, de 0 à 1.
 *
 * SECURITY DEFINER : la politique de lecture des notes doit pouvoir lire MA
 * progression sans dépendre des politiques de user_progress, et un seul appel
 * indexé remplace un test ligne à ligne.
 */
CREATE OR REPLACE FUNCTION public.my_reading_position(p_challenge_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(MAX(
    CASE WHEN p.total_pages > 0 THEN p.current_page::numeric / p.total_pages ELSE 0 END
  ), 0)
  FROM public.user_progress p
  WHERE p.challenge_id = p_challenge_id
    AND p.user_id = (SELECT auth.uid());
$$;

/** Suis-je membre de ce club ? */
CREATE OR REPLACE FUNCTION public.is_challenge_member(p_challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.challenge_participants cp
    WHERE cp.challenge_id = p_challenge_id
      AND cp.user_id = (SELECT auth.uid())
  );
$$;

/**
 * La marge de déblocage : ≈ 1 % du livre, soit ≈ 6 pages sur 600.
 * Elle absorbe l'écart entre deux éditions (préface, sommaire, corps de texte).
 * Mieux vaut débloquer une note un peu tard qu'un peu tôt.
 */
CREATE OR REPLACE FUNCTION public.annotation_unlock_margin()
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT 0.01::numeric; $$;

-- ─── RLS ─────────────────────────────────────────────────────────────

ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotation_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotation_reads ENABLE ROW LEVEL SECURITY;

-- Lecture : les miennes toujours ; celles du club seulement une fois que j'ai
-- dépassé leur position. Une note privée n'est jamais visible par les autres.
DROP POLICY IF EXISTS "Notes visibles selon ma progression" ON public.annotations;
CREATE POLICY "Notes visibles selon ma progression" ON public.annotations
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR (
      visibility = 'club'
      AND (SELECT public.is_challenge_member(annotations.challenge_id))
      AND (SELECT public.my_reading_position(annotations.challenge_id))
          >= position + public.annotation_unlock_margin()
    )
  );

DROP POLICY IF EXISTS "J'écris mes notes" ON public.annotations;
CREATE POLICY "J'écris mes notes" ON public.annotations
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT public.is_challenge_member(challenge_id))
  );

DROP POLICY IF EXISTS "Je modifie mes notes" ON public.annotations;
CREATE POLICY "Je modifie mes notes" ON public.annotations
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Je supprime mes notes" ON public.annotations;
CREATE POLICY "Je supprime mes notes" ON public.annotations
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Réactions et lectures : seulement sur une note que j'ai le droit de voir.
-- Le EXISTS repasse par la politique de lecture ci-dessus.
DROP POLICY IF EXISTS "Réactions des notes visibles" ON public.annotation_reactions;
CREATE POLICY "Réactions des notes visibles" ON public.annotation_reactions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.annotations a WHERE a.id = annotation_id));

DROP POLICY IF EXISTS "Je réagis" ON public.annotation_reactions;
CREATE POLICY "Je réagis" ON public.annotation_reactions
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.annotations a
      WHERE a.id = annotation_id AND a.visibility = 'club'
    )
  );

DROP POLICY IF EXISTS "Je retire ma réaction" ON public.annotation_reactions;
CREATE POLICY "Je retire ma réaction" ON public.annotation_reactions
  FOR DELETE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Mes lectures" ON public.annotation_reads;
CREATE POLICY "Mes lectures" ON public.annotation_reads
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Je marque comme lu" ON public.annotation_reads;
CREATE POLICY "Je marque comme lu" ON public.annotation_reads
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.annotations a WHERE a.id = annotation_id)
  );

-- ─── « Il y a des notes plus loin » ──────────────────────────────────

/**
 * Ce qu'on a le droit de savoir d'une note encore verrouillée : QUI l'a écrite
 * et À QUELLE PAGE. Jamais le contenu, ni la catégorie, ni l'emoji — la couleur
 * d'un post-it en dirait déjà trop.
 *
 * Renvoie les positions converties dans MON édition, pour afficher « ≈ p. 230 ».
 */
CREATE OR REPLACE FUNCTION public.annotations_ahead(p_challenge_id UUID)
-- `position` est un mot réservé dans une liste de colonnes de retour : la
-- colonne s'appelle donc book_position ici.
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name TEXT,
  profile_photo_url TEXT,
  book_position NUMERIC,
  my_page INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    a.id,
    a.user_id,
    u.first_name,
    u.profile_photo_url,
    a.position AS book_position,
    CEIL(a.position * COALESCE(NULLIF(mine.total_pages, 0), c.total_pages))::int AS my_page
  FROM public.annotations a
  JOIN public.users u ON u.id = a.user_id
  JOIN public.challenges c ON c.id = a.challenge_id
  LEFT JOIN public.user_progress mine
    ON mine.challenge_id = a.challenge_id AND mine.user_id = (SELECT auth.uid())
  WHERE a.challenge_id = p_challenge_id
    AND a.visibility = 'club'
    AND a.user_id <> (SELECT auth.uid())
    AND (SELECT public.is_challenge_member(p_challenge_id))
    AND (SELECT public.my_reading_position(p_challenge_id))
        < a.position + public.annotation_unlock_margin()
  ORDER BY a.position;
$$;

REVOKE ALL ON FUNCTION public.annotations_ahead(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.annotations_ahead(UUID) TO authenticated;

-- ─── Les vocaux ─────────────────────────────────────────────────────
-- Bucket PRIVÉ : un vocal se lit par URL signée, et seulement si la note qui le
-- porte m'est visible. Le fichier est rangé sous {challenge_id}/{annotation_id}.

INSERT INTO storage.buckets (id, name, public)
VALUES ('annotation-audio', 'annotation-audio', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Vocaux des notes visibles" ON storage.objects;
CREATE POLICY "Vocaux des notes visibles" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'annotation-audio'
    AND EXISTS (
      SELECT 1 FROM public.annotations a WHERE a.audio_path = storage.objects.name
    )
  );

DROP POLICY IF EXISTS "J'envoie mes vocaux" ON storage.objects;
CREATE POLICY "J'envoie mes vocaux" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'annotation-audio' AND owner = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Je supprime mes vocaux" ON storage.objects;
CREATE POLICY "Je supprime mes vocaux" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'annotation-audio' AND owner = (SELECT auth.uid()));
