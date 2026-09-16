-- =====================================================
-- Jeu d'essai : « Les nuits blanches » comme livre témoin
-- =====================================================
-- Sert à tester l'accueil en trois cadres avec de vraies données :
-- caps passés et en cours, éditions différentes, journal rempli.
--
-- Relançable : les caps ont des identifiants fixes et sont réécrits, le reste
-- est mis à jour en place. Ne touche qu'au challenge « Les nuits blanches ».
-- Pour tout retirer : scripts/unseed-nuits-blanches.sql
-- =====================================================

-- Le livre : la fin dans 27 jours (le fameux « J-27 » de la maquette)
UPDATE public.challenges
SET target_end_date = (CURRENT_DATE + INTERVAL '27 days'),
    status = 'active'
WHERE id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9';

-- Les membres, chacun dans son édition (58, 62, 74, 96, 112 pages) :
-- Emma 52 %, Lucas 47 %, Chloé 27 %, moi 26 %, Théo 30 %.
-- Séries fraîches pour que la flamme s'affiche sur l'accueil.
UPDATE public.user_progress SET current_page = 30, streak_count = 3, last_streak_date = CURRENT_DATE
  WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9' AND user_id = 'aaaaaaaa-1111-4000-a000-000000000001';
UPDATE public.user_progress SET current_page = 45, streak_count = 8, last_streak_date = CURRENT_DATE
  WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9' AND user_id = 'aaaaaaaa-1111-4000-a000-000000000002';
UPDATE public.user_progress SET current_page = 20, streak_count = 2, last_streak_date = CURRENT_DATE - 1
  WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9' AND user_id = 'aaaaaaaa-1111-4000-a000-000000000003';
UPDATE public.user_progress SET current_page = 34, streak_count = 1, last_streak_date = CURRENT_DATE
  WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9' AND user_id = 'aaaaaaaa-1111-4000-a000-000000000004';
-- Moi : p. 16 sur 62, soit 26 % — au milieu du classement, avec de la marge
-- devant et derrière pour faire défiler le sélecteur.
UPDATE public.user_progress SET current_page = 16, streak_count = 5, last_streak_date = CURRENT_DATE
  WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9' AND user_id = '9b8c837f-0755-4d7a-972f-37cbe51395c1';

-- Le trigger de série remet streak_count à 1 dès que la page change : on repose
-- les valeurs après coup, sans toucher à current_page (le trigger ne se déclenche
-- que sur cette colonne).
UPDATE public.user_progress SET streak_count = 3 WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9' AND user_id = 'aaaaaaaa-1111-4000-a000-000000000001';
UPDATE public.user_progress SET streak_count = 8 WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9' AND user_id = 'aaaaaaaa-1111-4000-a000-000000000002';
UPDATE public.user_progress SET streak_count = 2 WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9' AND user_id = 'aaaaaaaa-1111-4000-a000-000000000003';
UPDATE public.user_progress SET streak_count = 5 WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9' AND user_id = '9b8c837f-0755-4d7a-972f-37cbe51395c1';

-- Les caps, posés dans l'édition de référence du challenge (62 pages) :
-- deux passés (points neutres sur la piste) et un en cours (drapeau daté).
DELETE FROM public.challenge_goals
WHERE id IN (
  'cadecada-0001-4000-a000-000000000001',
  'cadecada-0001-4000-a000-000000000002',
  'cadecada-0001-4000-a000-000000000003'
);

INSERT INTO public.challenge_goals (id, challenge_id, type, target_pages, deadline, created_by, status)
VALUES
  -- p. 12 = 19 % du livre, il y a deux semaines
  ('cadecada-0001-4000-a000-000000000001', '4c6650d1-a213-48d2-8f86-7aaf52cf2be9', 'secondary', 12,
   (CURRENT_DATE - INTERVAL '14 days'), '9b8c837f-0755-4d7a-972f-37cbe51395c1', 'archived'),
  -- p. 20 = 32 %, il y a une semaine
  ('cadecada-0001-4000-a000-000000000002', '4c6650d1-a213-48d2-8f86-7aaf52cf2be9', 'secondary', 20,
   (CURRENT_DATE - INTERVAL '7 days'), '9b8c837f-0755-4d7a-972f-37cbe51395c1', 'archived'),
  -- p. 28 = 45 %, dans 4 jours : Emma et Lucas l'ont déjà atteint → « Cap · 2/5 »
  ('cadecada-0001-4000-a000-000000000003', '4c6650d1-a213-48d2-8f86-7aaf52cf2be9', 'secondary', 28,
   (CURRENT_DATE + INTERVAL '4 days'), '9b8c837f-0755-4d7a-972f-37cbe51395c1', 'active');

-- Mon journal : une dizaine de soirées de lecture, pour que « Ma page › » ait
-- quelque chose à montrer. Les entrées existantes sont remplacées.
DELETE FROM public.progress_history
WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9'
  AND user_id = '9b8c837f-0755-4d7a-972f-37cbe51395c1';

INSERT INTO public.progress_history (user_progress_id, user_id, challenge_id, page_number, pages_read, recorded_at, created_date)
SELECT
  p.id,
  p.user_id,
  p.challenge_id,
  entry.page_number,
  entry.pages_read,
  (CURRENT_DATE - entry.days_ago) + TIME '21:30',
  (CURRENT_DATE - entry.days_ago)
FROM public.user_progress p
CROSS JOIN (VALUES
  (11, 2, 2),
  (9, 4, 2),
  (7, 6, 2),
  (5, 9, 3),
  (4, 11, 2),
  (2, 14, 3),
  (0, 16, 2)
) AS entry(days_ago, page_number, pages_read)
WHERE p.challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9'
  AND p.user_id = '9b8c837f-0755-4d7a-972f-37cbe51395c1';
