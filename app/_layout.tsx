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

// import StorybookUIRoot from '../.rnstorybook/index';
const SHOW_STORYBOOK = false;

import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
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
import AnimatedSplash from '../components/AnimatedSplash';

// Désactivé : expo-splash-screen provoque des erreurs "No native splash screen
// registered" quand on ouvre une Modal (nouveau view controller iOS). L'app
// utilise AnimatedSplash custom, donc on laisse le splash natif se cacher
// automatiquement au chargement.

// Configuration du thème React Native Paper
// On personnalise les couleurs pour correspondre à notre design system
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.dark900,
    primaryContainer: colors.bgLight,
    secondary: colors.textSecondary,
    secondaryContainer: colors.bgSecondary,
    background: colors.white,
    surface: colors.white,
    surfaceVariant: colors.bgLight,
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
  // if (SHOW_STORYBOOK) {
  //   return <StorybookUIRoot />;
  // }

  // Polices chargées nativement au build time via le config plugin expo-font
  // (voir app.json). Plus besoin de useFonts() ni d'attendre le chargement.

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
  const { user, isInitialized, initialize: initAuth, pendingUserData } = useAuthStore();
  const { challenges, loadUserChallenges } = useProjectStore();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Initialise l'auth
  useEffect(() => {
    const unsubAuth = initAuth();
    setIsMounted(true);
    return () => {
      unsubAuth();
    };
  }, [initAuth]);

  // Recharge les challenges quand le user change (login, retour d'onboarding…).
  // Au cold start, initialize() lance déjà loadUserChallenges en parallèle du
  // profile fetch → ce useEffect crée un doublon inoffensif (même résultat).
  useEffect(() => {
    if (user?.id) {
      loadUserChallenges(user.id);
    }
  }, [user?.id, loadUserChallenges]);

  // Gérer les deep links pour l'authentification
  useEffect(() => {
    // Écouter les deep links
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;

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
    const inOnboarding = segments[0] === 'onboarding';
    
    // Si pas d'utilisateur connecté et pas déjà sur les pages d'auth → rediriger
    if (!user && !inAuthGroup && !inOnboarding) {
      if (pendingUserData) {
        // Onboarding interrompu (ex: app tuée en plein milieu) :
        // pendingUserData a été restauré depuis AsyncStorage — on reprend l'onboarding
        // avec le prénom Apple qu'on avait capturé, sans redemander à l'utilisateur
        router.replace({
          pathname: '/onboarding/role',
          params: { firstName: pendingUserData.firstName || '' },
        });
      } else {
        router.replace('/auth/login');
      }
    }
  }, [user, isInitialized, challenges, segments, isMounted, router, pendingUserData]);

  // Initialise les notifications pour les utilisateurs DÉJÀ connectés (hors onboarding)
  // IMPORTANT: On ne demande JAMAIS les permissions ici — c'est l'écran onboarding/notifications
  // qui s'en charge. Sinon la boîte native iOS s'affiche trop tôt et quand l'user tape
  // "Autoriser", iOS ne la réaffiche pas (déjà consommée).
  // Ici on vérifie seulement si les perms sont déjà accordées et on planifie le rappel.
  useEffect(() => {
    if (!user?.id || Platform.OS === 'web') return;
    const inOnboarding = segments[0] === 'onboarding';
    if (inOnboarding) return; // Laissons l'écran notifications gérer la première demande

    let cancelled = false;

    const setupNotifications = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (!cancelled && status === 'granted') {
          await scheduleDailyReminder(20, 0, 'cc', 'n\'oublie pas d\'ajouter tes pages stp');
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des notifications:', error);
      }
    };

    setupNotifications();

    return () => {
      cancelled = true;
    };
  }, [user?.id, segments[0]]);

  // Callback quand le splash screen se termine
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Afficher le splash screen pendant l'animation
  // On attend aussi isInitialized pour éviter le flash "nouvel utilisateur"
  // (photo par défaut, pas de prénom, empty state) quand checkSession est lent
  if (showSplash) {
    return (
      <AnimatedSplash
        onFinish={handleSplashFinish}
        waitFor={isInitialized}
      />
    );
  }

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

      {/* Page Profil — glisse depuis la gauche (symétrique au swipe d'ouverture) */}
      {/* Le gesture natif iOS est désactivé car il irait dans le mauvais sens.     */}
      {/* C'est useSwipeBack('left') dans profile.tsx qui gère la fermeture.        */}
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
          animation: 'slide_from_left',
          gestureEnabled: false,
        }}
      />

      {/* Page Activité — glisse depuis la droite (comportement Stack standard) */}
      {/* Le gesture natif iOS (bord gauche → glisse droite) fonctionne automatiquement */}
      <Stack.Screen
        name="activity"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

      {/* Garde les routes d'auth mais cachées (pour éviter les erreurs) */}
      <Stack.Screen
        name="auth"
        options={{
          headerShown: false,
        }}
      />

    </Stack>
  );
}
