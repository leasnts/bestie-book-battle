-- =====================================================
-- FIX : Function Search Path (Security Advisor)
-- =====================================================
-- Corrige les 10 avertissements "Function Search Path Mutable".
-- À exécuter dans Supabase → SQL Editor (copier-coller ce fichier).
--
-- Ou via : npm run fix-search-path
-- (nécessite DATABASE_URL dans .env)
-- =====================================================

-- Fixe le search_path pour éviter les risques de hijacking
-- On utilise 'public' car toutes nos tables sont dans ce schéma
ALTER FUNCTION public.generate_invite_code() SET search_path = 'public';
ALTER FUNCTION public.set_invite_code() SET search_path = 'public';
ALTER FUNCTION public.calculate_progress_percentage() SET search_path = 'public';
ALTER FUNCTION public.update_challenge_stats() SET search_path = 'public';
ALTER FUNCTION public.update_challenge_status() SET search_path = 'public';
ALTER FUNCTION public.update_streak() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.create_initial_progress() SET search_path = 'public';
ALTER FUNCTION public.add_progress_history() SET search_path = 'public';
ALTER FUNCTION public.update_challenge_goals_updated_at() SET search_path = 'public';
