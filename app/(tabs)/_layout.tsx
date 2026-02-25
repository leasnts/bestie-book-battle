/**
 * Layout simplifié - Une seule page, pas de tab bar
 * Navigation via la top bar uniquement
 */

import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
        headerShown: false,
      }}
    >
      {/* Page principale */}
      <Tabs.Screen name="index" />

      {/* History reste dans les tabs (modal) */}
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}
