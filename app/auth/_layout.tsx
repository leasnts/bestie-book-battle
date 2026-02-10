/**
 * Layout pour les écrans d'authentification
 * 
 * Ce layout enveloppe l'écran de login (welcome screen).
 * Il n'affiche pas de header car cet écran a son propre design.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Pas de header sur les écrans d'auth
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}

