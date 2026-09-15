/**
 * Onglets : lecture en cours, inspiration, profil.
 *
 * Barre sur mesure (components/ui/GlassTabBar.tsx) : flottante, en verre iOS 26,
 * resserrée autour de ses 3 icônes. La barre native NativeTabs a été essayée puis
 * abandonnée, sa largeur n'étant pas réglable — le pourquoi est dans GlassTabBar.
 *
 * Icônes : Lucide, comme partout dans l'app (une seule banque d'icônes).
 *
 * Les libellés n'apparaissent pas à l'écran mais sont lus par VoiceOver
 * (`tabBarAccessibilityLabel`) : une icône seule n'a pas de nom sinon.
 */

import { Tabs } from 'expo-router';
import { BookOpenIcon, CircleUserIcon, SearchIcon } from 'lucide-react-native';
import React from 'react';
import GlassTabBar, { TabIcon } from '../../components/ui/GlassTabBar';
import { colors } from '../../utils/constants';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bgLight },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: 'Lecture en cours',
          tabBarIcon: ({ focused }) => <TabIcon icon={BookOpenIcon} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inspiration"
        options={{
          tabBarAccessibilityLabel: 'Inspiration',
          tabBarIcon: ({ focused }) => <TabIcon icon={SearchIcon} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: 'Profil et paramètres',
          tabBarIcon: ({ focused }) => <TabIcon icon={CircleUserIcon} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
