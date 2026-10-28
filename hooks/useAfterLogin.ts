import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import type { AppleSignInResult } from '../services/supabase/auth';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useProjectStore } from '../stores/projectStore';
import { firstStep } from '../utils/onboardingFlow';

/**
 * Où aller une fois connecté, par Apple ou par email :
 * - une invitation en cours (lien ou code) → la suite pour la rejoindre ;
 * - nouveau compte → le sheet « Ta lecture » : commencer ou rejoindre ;
 * - compte avec des lectures → l'accueil ;
 * - compte sans lecture → le même sheet, pour ajouter un livre.
 */
export function useAfterLogin() {
  const router = useRouter();
  const loadUserChallenges = useProjectStore((state) => state.loadUserChallenges);

  /** Le sheet du choix, sur l'écran de connexion (fermer d'abord la feuille email) */
  const openChoice = () => {
    if (router.canDismiss()) router.dismiss();
    router.push('/auth/choix');
  };

  return async (result: AppleSignInResult) => {
    const onboarding = useOnboardingStore.getState();
    const invited = !!onboarding.invitation;

    if (result.isNewUser) {
      // Le prénom vient d'Apple, ou de la feuille email : rien à redemander
      if (invited) {
        router.replace(firstStep('join'));
      } else {
        onboarding.begin('create');
        openChoice();
      }
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
      openChoice();
    }
  };
}
