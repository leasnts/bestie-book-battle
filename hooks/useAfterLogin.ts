import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import type { AppleSignInResult } from '../services/supabase/auth';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useProjectStore } from '../stores/projectStore';
import { firstStep } from '../utils/onboardingFlow';

/**
 * Où aller une fois connecté, par Apple ou par email :
 * - une invitation en cours (lien ou code) → la suite pour la rejoindre ;
 * - nouveau compte → « Bienvenue », puis « C’est quand, ton moment lecture ? », la suite de l'onboarding ;
 * - compte avec des lectures → l'accueil ;
 * - compte sans lecture → ajouter un livre (« Tu lis quoi en ce moment ? »).
 */
export function useAfterLogin() {
  const router = useRouter();
  const loadUserChallenges = useProjectStore((state) => state.loadUserChallenges);

  return async (result: AppleSignInResult) => {
    const onboarding = useOnboardingStore.getState();
    const invited = !!onboarding.invitation;

    if (result.isNewUser) {
      // Le prénom vient d'Apple, ou de la feuille email : rien à redemander
      if (!invited && onboarding.flow !== 'create') onboarding.begin('create');
      router.replace(firstStep(invited ? 'join' : 'create'));
      return;
    }

    if (result.user) {
      await loadUserChallenges(result.user.id);
    }
    const { challenges, error: challengesError } = useProjectStore.getState();

    // Si le chargement a échoué (réseau, Supabase…), on ne redirige PAS vers
    // l'onboarding : l'utilisateur a un compte existant. On affiche une erreur
    // pour qu'il réessaie plutôt que de lui faire re-créer une lecture.
    if (challengesError) {
      Alert.alert('Erreur de connexion', 'Impossible de charger tes lectures. Vérifie ta connexion et réessaie.');
      return;
    }

    if (invited) {
      onboarding.patch({ flow: 'addJoin' });
      router.replace(firstStep('addJoin'));
    } else if (challenges && challenges.length > 0) {
      onboarding.reset();
      router.replace('/(tabs)');
    } else {
      onboarding.begin('add');
      router.replace(firstStep('add'));
    }
  };
}
