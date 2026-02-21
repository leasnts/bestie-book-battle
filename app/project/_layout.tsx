/**
 * Layout pour les écrans de projet
 */

import { Stack } from 'expo-router';
import { colors } from '../../utils/constants';

export default function ProjectLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: colors.text,
        },
        headerTintColor: colors.primary,
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Détail du projet',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="invite"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack>
  );
}


