-- =====================================================
-- BESTIE BOOK BATTLE - SCRIPT AMI FICTIF DE TEST
-- =====================================================
-- 
-- Ce script crée un utilisateur fictif "Zoé" dans la base de données
-- et l'ajoute comme participante à un challenge existant.
-- 
-- USAGE :
-- 1. Va dans le SQL Editor de Supabase
-- 2. Copie-colle ce script
-- 3. Remplace <CHALLENGE_ID> par l'ID du challenge auquel tu veux ajouter Zoé
-- 4. Exécute le script
--
-- NETTOYAGE (avant TestFlight/prod) :
-- Exécute la section "NETTOYAGE" en bas de ce fichier
-- pour supprimer Zoé et toutes ses données associées.
-- =====================================================

-- UUID fixe pour Zoé, facile à retrouver/supprimer
-- On utilise un UUID fixe au lieu de gen_random_uuid() pour pouvoir
-- référencer Zoé dans plusieurs commandes et la supprimer facilement
DO $$
DECLARE
  zoe_id UUID := '00000000-0000-0000-0000-00000000z0e1'::UUID;
  -- ⚠️ REMPLACE CETTE VALEUR par l'ID de ton challenge
  target_challenge_id UUID := '<CHALLENGE_ID>'::UUID;
  zoe_progress_id UUID;
BEGIN

  -- =====================================================
  -- ÉTAPE 1 : Créer l'utilisateur Zoé
  -- =====================================================
  -- On insère Zoé dans la table users.
  -- ON CONFLICT : si Zoé existe déjà, on ne fait rien (idempotent)
  INSERT INTO users (id, email, first_name, last_name, profile_photo_url)
  VALUES (
    zoe_id,
    'zoe@test.bestie-book-battle.com',
    'Zoé',
    'Dupont',
    NULL  -- Pas de photo, l'app utilisera le fallback lea.png
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Zoé créée (ou déjà existante) avec ID: %', zoe_id;

  -- =====================================================
  -- ÉTAPE 2 : Ajouter Zoé comme participante du challenge
  -- =====================================================
  -- On l'insère dans challenge_participants.
  -- Le trigger SQL create_initial_progress() va automatiquement
  -- créer une entrée dans user_progress avec current_page = 0
  INSERT INTO challenge_participants (challenge_id, user_id)
  VALUES (target_challenge_id, zoe_id)
  ON CONFLICT (challenge_id, user_id) DO NOTHING;

  RAISE NOTICE 'Zoé ajoutée au challenge: %', target_challenge_id;

  -- =====================================================
  -- ÉTAPE 3 : Donner une progression à Zoé
  -- =====================================================
  -- On simule que Zoé a lu quelques pages.
  -- Le trigger calculate_progress_percentage() calculera automatiquement le %.
  -- Le trigger update_challenge_stats() mettra à jour les stats du challenge.
  UPDATE user_progress
  SET 
    current_page = 143,
    streak_count = 5,
    last_streak_date = CURRENT_DATE,
    last_updated_at = NOW() - INTERVAL '2 hours'
  WHERE challenge_id = target_challenge_id
    AND user_id = zoe_id;

  -- Récupérer l'ID de la progression de Zoé pour l'historique
  SELECT id INTO zoe_progress_id
  FROM user_progress
  WHERE challenge_id = target_challenge_id AND user_id = zoe_id;

  -- =====================================================
  -- ÉTAPE 4 : Ajouter de l'historique de lecture pour Zoé
  -- =====================================================
  -- Quelques entrées d'historique pour simuler une activité réelle
  IF zoe_progress_id IS NOT NULL THEN
    INSERT INTO progress_history (user_progress_id, user_id, challenge_id, page_number, pages_read, recorded_at)
    VALUES
      (zoe_progress_id, zoe_id, target_challenge_id, 45, 45, NOW() - INTERVAL '4 days'),
      (zoe_progress_id, zoe_id, target_challenge_id, 78, 33, NOW() - INTERVAL '3 days'),
      (zoe_progress_id, zoe_id, target_challenge_id, 110, 32, NOW() - INTERVAL '2 days'),
      (zoe_progress_id, zoe_id, target_challenge_id, 130, 20, NOW() - INTERVAL '1 day'),
      (zoe_progress_id, zoe_id, target_challenge_id, 143, 13, NOW() - INTERVAL '2 hours')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Historique de lecture ajouté pour Zoé';
  END IF;

  RAISE NOTICE '✅ Zoé est prête ! Elle a lu 143 pages avec un streak de 5 jours.';

END $$;


-- =====================================================
-- NETTOYAGE - À exécuter avant TestFlight/production
-- =====================================================
-- Décommente et exécute ces lignes pour supprimer Zoé et toutes ses données.
-- Les suppressions en CASCADE retireront automatiquement :
-- - Ses participations aux challenges
-- - Ses progressions
-- - Son historique de lecture
--
-- DELETE FROM users WHERE id = '00000000-0000-0000-0000-00000000z0e1'::UUID;
-- RAISE NOTICE '🧹 Zoé et toutes ses données ont été supprimées.';
