-- =====================================================
-- Envies sur le compte (et plus seulement sur le téléphone)
-- =====================================================
--
-- Les envies d'Explorer (les livres gardés pour plus tard) vivaient dans
-- AsyncStorage : changer de téléphone ou réinstaller l'app les effaçait. Elles
-- vont sur le compte, comme les livres : on se reconnecte, tout est là.
--
-- book : le livre tel que l'app l'affiche (BookSearchResult : titre, auteur·ice,
-- couverture, pages, éditeur…), gardé tel quel : une envie n'est pas un livre
-- de la bibliothèque, on ne la normalise pas.
-- Privées : chacun ne voit et ne touche que les siennes.

CREATE TABLE IF NOT EXISTS public.wishes (
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id    text        NOT NULL,
  book       jsonb       NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id)
);

-- La liste s'affiche de la plus récente à la plus ancienne
CREATE INDEX IF NOT EXISTS wishes_user_created_idx ON public.wishes (user_id, created_at DESC);

ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishes_select_own" ON public.wishes;
CREATE POLICY "wishes_select_own" ON public.wishes
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "wishes_insert_own" ON public.wishes;
CREATE POLICY "wishes_insert_own" ON public.wishes
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "wishes_update_own" ON public.wishes;
CREATE POLICY "wishes_update_own" ON public.wishes
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "wishes_delete_own" ON public.wishes;
CREATE POLICY "wishes_delete_own" ON public.wishes
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
