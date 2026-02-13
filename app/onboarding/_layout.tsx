/**
 * Layout pour le flow d'onboarding
 *
 * Gère la navigation entre les 9 écrans de l'onboarding redesigné :
 *
 * Flow partagé :
 * 1. index.tsx - Saisie prénom
 * 2. role.tsx - Choix Créer/Rejoindre
 *
 * Branche "Créer un bbb" :
 * 3a. create.tsx - Formulaire livre (titre, auteur, pages)
 * 4a. cover.tsx - Import couverture
 * 5a. notifications.tsx - Permission notifications (partagé)
 * 6a. complete.tsx - Carte livre + code invite + boutons
 *
 * Branche "Rejoindre un bbb" :
 * 3b. join.tsx - Saisie code d'accès
 * 5b. notifications.tsx - Permission notifications (partagé)
 * 6b. welcome.tsx - Carte challenge + bouton Rejoindre
 *
 * Animations : toutes les transitions utilisent slide_from_right + 350ms
 * pour une expérience fluide et cohérente sur tout le flow.
 */

import { Stack } from 'expo-router';

// Config d'animation partagée pour tout l'onboarding
const SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  animationDuration: 350,
};

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="role" />
      <Stack.Screen name="create" />
      <Stack.Screen name="cover" />
      <Stack.Screen name="join" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="complete" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
