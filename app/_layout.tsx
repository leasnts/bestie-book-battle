/**
 * Layout racine de l'application
 * 
 * Ce fichier configure :
 * - Le thème React Native Paper
 * - L'initialisation de l'authentification Supabase
 * - La structure de navigation principale
 * 
 * C'est le point d'entrée de toute la navigation de l'app.
 */

import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { scheduleDailyReminder } from '../services/notifications';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { colors } from '../utils/constants';
import { supabase } from '../supabaseConfig';

// Empêche l'écran de splash de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

// Configuration du thème React Native Paper
// On personnalise les couleurs pour correspondre à notre design system
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    error: colors.error,
  },
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Définit la route initiale
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  // Charge les polices personnalisées
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Si erreur de chargement des polices, on la propage
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Cache le splash screen quand les polices sont chargées
  useEffect(() => {
    if (fontsLoaded) {
      // Petit délai pour éviter l'erreur de timing
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {
          // Ignore l'erreur si le splash screen n'existe pas
        });
      }, 100);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Sur le web, on n'utilise pas GestureHandlerRootView car il n'est pas compatible
  // On utilise un View simple à la place
  const RootWrapper = Platform.OS === 'web' ? View : GestureHandlerRootView;

  return (
    <RootWrapper style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <RootLayoutNav />
          <StatusBar style="dark" />
        </PaperProvider>
      </SafeAreaProvider>
    </RootWrapper>
  );
}

/**
 * Composant de navigation principal
 * 
 * Gère la logique de redirection:
 * - Si pas de projet → Onboarding
 * - Si projet → écran principal (tabs)
 */
function RootLayoutNav() {
  const { user, isInitialized, initialize: initAuth } = useAuthStore();
  const { challenges } = useProjectStore();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  // Initialise l'auth
  useEffect(() => {
    const unsubAuth = initAuth();
    setIsMounted(true);
    return () => {
      unsubAuth();
    };
  }, [initAuth]);

  // Gérer les deep links pour l'authentification
  useEffect(() => {
    // Écouter les deep links
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link reçu:', url);

      // Vérifier si c'est un lien d'authentification
      if (url.includes('auth/callback')) {
        try {
          // Extraire les params de l'URL
          const urlObj = new URL(url.replace('bestie-book-battle://', 'http://'));
          const fragment = urlObj.hash.substring(1); // Retire le #
          const params = new URLSearchParams(fragment);
          
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            // Établir la session avec Supabase
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            console.log('Session établie avec succès !');
          }
        } catch (error) {
          console.error('Erreur lors du traitement du deep link:', error);
        }
      }
    };

    // Écouter les nouveaux liens
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Vérifier s'il y a déjà un lien au démarrage
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Redirection Logic - Protège les routes selon l'état d'authentification
  useEffect(() => {
    if (!isMounted || !isInitialized) return;

    const inAuthGroup = segments[0] === 'auth';
    
    // Si pas d'utilisateur connecté et pas déjà sur les pages d'auth → rediriger vers login
    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    }
  }, [user, isInitialized, challenges, segments, isMounted, router]);

  // Initialise les notifications quand l'utilisateur est connecté
  // Seulement sur mobile - les notifications ne sont pas bien supportées sur web
  useEffect(() => {
    if (!user?.id || Platform.OS === 'web') return;

    const setupNotifications = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await scheduleDailyReminder(20, 0, 'cc', 'n\'oublie pas d\'ajouter tes pages stp');
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des notifications:', error);
      }
    };

    setupNotifications();
  }, [user?.id]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Routes principales (tabs) */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      {/* Routes projet (stack) */}
      <Stack.Screen
        name="project"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

      {/* Routes progression */}
      <Stack.Screen
        name="progress"
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      {/* Garde les routes d'auth mais cachées (pour éviter les erreurs) */}
      {/* Garde les routes d'auth mais cachées (pour éviter les erreurs) */}
      <Stack.Screen
        name="auth"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="select-profile"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
