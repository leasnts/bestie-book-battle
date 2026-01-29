/**
 * Layout pour les écrans d'authentification
 * 
 * Ce layout enveloppe les écrans login et register.
 * Il n'affiche pas de header car ces écrans ont leur propre design.
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
      <Stack.Screen name="register" />
    </Stack>
  );
}

