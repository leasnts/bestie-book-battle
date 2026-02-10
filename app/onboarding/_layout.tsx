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
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      {/* Écran 1 : Prénom */}
      <Stack.Screen 
        name="index"
        options={{
          animation: 'fade',
        }}
      />
      
      {/* Écran 2 : Choix rôle (Créer/Rejoindre) */}
      <Stack.Screen 
        name="role"
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* Branche Créer - Écran 3a : Formulaire livre */}
      <Stack.Screen 
        name="create"
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* Branche Créer - Écran 4a : Couverture */}
      <Stack.Screen 
        name="cover"
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* Branche Rejoindre - Écran 3b : Code d'accès */}
      <Stack.Screen 
        name="join"
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* Écran 5 (partagé) : Notifications */}
      <Stack.Screen 
        name="notifications"
        options={{
          animation: 'slide_from_right',
        }}
      />
      
      {/* Branche Créer - Écran 6a : Terminé */}
      <Stack.Screen 
        name="complete"
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />
      
      {/* Branche Rejoindre - Écran 6b : Bienvenue */}
      <Stack.Screen 
        name="welcome"
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />
    </Stack>
  );
}
