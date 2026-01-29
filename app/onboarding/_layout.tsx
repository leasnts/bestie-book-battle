/**
 * Layout pour le flow d'onboarding
 * Gère la navigation entre les différentes étapes de création de projet
 * 
 * Utilise des animations fluides pour les transitions entre écrans :
 * - slide_from_right : pour l'avancement dans le flow (index -> create -> invite)
 * - slide_from_left : pour le retour en arrière
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right', // Animation par défaut : slide depuis la droite
        animationDuration: 300, // Durée de l'animation
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          animation: 'fade', // Page d'accueil apparaît en fade
        }}
      />
      <Stack.Screen 
        name="create"
        options={{
          animation: 'slide_from_right', // Slide depuis la droite
        }}
      />
      <Stack.Screen 
        name="invite"
        options={{
          animation: 'slide_from_bottom', // Slide depuis le bas pour l'effet de celebration
          animationDuration: 400,
        }}
      />
    </Stack>
  );
}
