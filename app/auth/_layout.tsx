/**
 * Layout pour les écrans d'authentification
 * 
 * Ce layout enveloppe l'écran de login (welcome screen) et la feuille email.
 * Il n'affiche pas de header car cet écran a son propre design.
 */

import { Stack } from 'expo-router';
import { sheetScreenOptions } from '../../components/ui/SheetHeader';

// La feuille email s'ouvre toujours sur l'écran de connexion, même par lien direct
export const unstable_settings = { anchor: 'login' };

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Pas de header sur les écrans d'auth
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      {/* Connexion par email : adresse, code, prénom */}
      <Stack.Screen name="email" options={sheetScreenOptions()} />
    </Stack>
  );
}

