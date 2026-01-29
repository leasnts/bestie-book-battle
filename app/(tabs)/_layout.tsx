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
        // Cache complètement la tab bar
        tabBarStyle: { display: 'none' },
        headerShown: false,
      }}
    >
      {/* Page principale */}
      <Tabs.Screen name="index" />
      
      {/* Pages accessibles via top bar (cachées de la tab bar) */}
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
