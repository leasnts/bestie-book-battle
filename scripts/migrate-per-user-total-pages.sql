-- =====================================================
-- Migration : total_pages par participant
-- =====================================================
-- Permet à chaque participant d'avoir son propre nombre de pages
-- (édition différente : Kindle, poche, broché, etc.)
-- Le classement se fait par pourcentage au lieu du numéro de page absolu.
-- =====================================================

-- 1. Ajouter la colonne total_pages à user_progress
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS total_pages INTEGER DEFAULT NULL;

-- 2. Backfill : copier le total_pages du challenge vers chaque participant existant
UPDATE user_progress up
SET total_pages = c.total_pages
FROM challenges c
WHERE up.challenge_id = c.id
  AND up.total_pages IS NULL;

-- 3. Modifier le trigger de calcul du pourcentage
-- Utilise user_progress.total_pages avec fallback sur challenges.total_pages
CREATE OR REPLACE FUNCTION calculate_progress_percentage()
RETURNS TRIGGER AS $$
DECLARE
  effective_total INTEGER;
BEGIN
  effective_total := NEW.total_pages;

  -- Fallback sur le total du challenge si non défini
  IF effective_total IS NULL OR effective_total <= 0 THEN
    SELECT c.total_pages INTO effective_total
    FROM challenges c
    WHERE c.id = NEW.challenge_id;
  END IF;

  IF effective_total > 0 THEN
    NEW.progress_percentage := ROUND((NEW.current_page::DECIMAL / effective_total::DECIMAL) * 100, 2);
  ELSE
    NEW.progress_percentage := 0.00;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recréer le trigger pour surveiller aussi total_pages
DROP TRIGGER IF EXISTS user_progress_percentage_trigger ON user_progress;
CREATE TRIGGER user_progress_percentage_trigger
  BEFORE INSERT OR UPDATE OF current_page, total_pages ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION calculate_progress_percentage();

-- 5. Modifier create_initial_progress pour copier le total du challenge
CREATE OR REPLACE FUNCTION create_initial_progress()
RETURNS TRIGGER AS $$
DECLARE
  challenge_total_pages INTEGER;
BEGIN
  SELECT c.total_pages INTO challenge_total_pages
  FROM challenges c
  WHERE c.id = NEW.challenge_id;

  INSERT INTO user_progress (challenge_id, user_id, current_page, progress_percentage, total_pages)
  VALUES (NEW.challenge_id, NEW.user_id, 0, 0.00, challenge_total_pages)
  ON CONFLICT (challenge_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Recalculer les pourcentages existants (le UPDATE déclenche le trigger)
UPDATE user_progress SET total_pages = total_pages;
