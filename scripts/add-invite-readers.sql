-- Les lectrices d'une lecture, vues depuis son code d'invitation (onboarding/invitation) :
-- prénom, photo, où elles en sont. La personne n'est pas encore membre : RLS bloquerait
-- une lecture directe, d'où SECURITY DEFINER. Rien de plus que ce que l'invitation montre.
CREATE OR REPLACE FUNCTION public.get_invite_readers(p_code text)
RETURNS TABLE(first_name text, profile_photo_url text, progress_percentage numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.first_name, u.profile_photo_url, coalesce(up.progress_percentage, 0)
  FROM challenges c
  JOIN challenge_participants p ON p.challenge_id = c.id
  JOIN users u ON u.id = p.user_id
  LEFT JOIN user_progress up ON up.challenge_id = c.id AND up.user_id = p.user_id
  WHERE c.invite_code = upper(trim(nullif(p_code, '')))
  ORDER BY up.progress_percentage DESC NULLS LAST
  LIMIT 8;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_readers(text) TO anon, authenticated;
