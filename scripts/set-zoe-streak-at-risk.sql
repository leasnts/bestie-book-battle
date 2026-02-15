/**
 * Script SQL pour mettre le streak de Zoé en danger
 * 
 * On met last_streak_date à HIER (CURRENT_DATE - INTERVAL '1 day')
 * pour que l'app détecte que le streak est en danger.
 * 
 * USAGE :
 * 1. Va dans le SQL Editor de Supabase
 * 2. Copie-colle ce script
 * 3. Remplace <CHALLENGE_ID> par l'ID du challenge "A Little Life"
 * 4. Exécute le script
 */

-- UUID fixe de Zoé
DO $$
DECLARE
  zoe_id UUID := '00000000-0000-0000-0000-00000000z0e1'::UUID;
  -- ⚠️ REMPLACE CETTE VALEUR par l'ID du challenge "A Little Life"
  target_challenge_id UUID := '<CHALLENGE_ID>'::UUID;
BEGIN

  -- Met à jour last_streak_date à HIER pour que le streak soit en danger
  UPDATE user_progress
  SET 
    last_streak_date = CURRENT_DATE - INTERVAL '1 day',
    last_updated_at = NOW()
  WHERE challenge_id = target_challenge_id
    AND user_id = zoe_id;

  RAISE NOTICE '✅ Streak de Zoé maintenant en danger (last_streak_date = hier)';

END $$;
