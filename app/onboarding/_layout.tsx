/**
 * Les écrans de l'onboarding (issue #189, prototype validé le 2026-10-28).
 * L'ordre de chaque parcours vit dans utils/onboardingFlow.ts.
 *
 * - choix : tu lances ou tu rejoins ? (avant le livre)
 * - code, invitation : rejoindre une lecture (lien ou code)
 * - bienvenue (après la connexion, passe tout seul), puis rythme, formats → carte : les questions, la préparation, la carte de lecture ; puis les notifs, sur le seuil de l’accueil
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 350 }}>
      {/* Juste après la connexion : l'aquarelle continue, en fondu, sans retour */}
      <Stack.Screen name="bienvenue" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="prepa" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="carte" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="notifications" options={{ gestureEnabled: false, animation: 'fade' }} />
    </Stack>
  );
}
