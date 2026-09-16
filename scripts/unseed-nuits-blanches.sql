-- =====================================================
-- Retirer le jeu d'essai de « Les nuits blanches »
-- =====================================================
-- Supprime les caps et le journal fabriqués par scripts/seed-nuits-blanches.sql.
-- Les pages lues et la date de fin restent telles quelles : ce sont des données
-- ordinaires, à remettre à la main si besoin.
-- =====================================================

DELETE FROM public.challenge_goals
WHERE id IN (
  'cadecada-0001-4000-a000-000000000001',
  'cadecada-0001-4000-a000-000000000002',
  'cadecada-0001-4000-a000-000000000003'
);

DELETE FROM public.progress_history
WHERE challenge_id = '4c6650d1-a213-48d2-8f86-7aaf52cf2be9'
  AND user_id = '9b8c837f-0755-4d7a-972f-37cbe51395c1';
