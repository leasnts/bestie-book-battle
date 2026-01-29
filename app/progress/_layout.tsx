/**
 * Layout pour les écrans de progression
 */

import { Stack } from 'expo-router';
import { colors } from '../../utils/constants';

export default function ProgressLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: colors.text,
        },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="update"
        options={{
          title: 'Mettre à jour',
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

