import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import type { AppleSignInResult } from '../services/supabase/auth';
import { useProjectStore } from '../stores/projectStore';

/**
 * Où aller une fois connecté, par Apple ou par email :
 * - nouveau compte → onboarding (écran rôle), avec le prénom déjà connu ;
 * - compte avec des lectures → l'accueil ;
 * - compte sans lecture → onboarding, écran rôle, en mode ajout.
 */
export function useAfterLogin() {
  const router = useRouter();
  const loadUserChallenges = useProjectStore((state) => state.loadUserChallenges);

  return async (result: AppleSignInResult, firstName?: string) => {
    if (result.isNewUser) {
      // Apple fournit firstName au premier sign-in — on l'utilise directement
      // sans demander à l'utilisateur de le re-saisir (exigence App Store 4.0)
      router.replace({
        pathname: '/onboarding/role',
        params: { firstName: firstName ?? result.firstName ?? '' },
      });
      return;
    }

    if (result.user) {
      await loadUserChallenges(result.user.id);
    }
    const { challenges, error: challengesError } = useProjectStore.getState();

    // Si le chargement a échoué (réseau, Supabase…), on ne redirige PAS vers
    // l'onboarding : l'utilisateur a un compte existant. On affiche une erreur
    // pour qu'il réessaie plutôt que de lui faire re-créer un projet.
    if (challengesError) {
      Alert.alert('Erreur de connexion', 'Impossible de charger tes lectures. Vérifie ta connexion et réessaie.');
      return;
    }

    if (challenges && challenges.length > 0) {
      router.replace('/(tabs)');
    } else {
      // On skip "Comment tu t'appelles ?" car il a déjà un profil, et on passe
      // le prénom depuis son profil pour l'écran rôle.
      router.replace({
        pathname: '/onboarding/role',
        params: { firstName: result.user?.first_name || 'Toi', addChallenge: 'true' },
      });
    }
  };
}
