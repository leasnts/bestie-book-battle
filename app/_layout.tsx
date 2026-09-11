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
import { useFonts } from 'expo-font';
import { Rokkitt_400Regular } from '@expo-google-fonts/rokkitt/400Regular';
import { Rokkitt_500Medium } from '@expo-google-fonts/rokkitt/500Medium';
import { Rokkitt_600SemiBold } from '@expo-google-fonts/rokkitt/600SemiBold';
import { Rokkitt_700Bold } from '@expo-google-fonts/rokkitt/700Bold';
import { WorkSans_400Regular } from '@expo-google-fonts/work-sans/400Regular';
import { WorkSans_500Medium } from '@expo-google-fonts/work-sans/500Medium';
import { WorkSans_600SemiBold } from '@expo-google-fonts/work-sans/600SemiBold';
import { WorkSans_700Bold } from '@expo-google-fonts/work-sans/700Bold';

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
  const { challenges, loadUserChallenges, _hasHydrated } = useProjectStore();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  /*
    Polices chargées au runtime, et non embarquées dans le binaire.

    Le config plugin expo-font est censé les copier dans le projet natif au
    prebuild. Ça n'a jamais eu lieu : l'Info.plist déclare bien les neuf
    fichiers, mais aucun .ttf n'existe dans ios/ ni dans le .app — d'où les
    « FontParser could not open filePath » au lancement, et une app qui tournait
    en San Francisco au lieu de Rokkitt et Work Sans.

    Rejouer un prebuild détruirait la cible widget bbbWidgetExtension, ajoutée à
    la main dans Xcode et qu'aucun config plugin ne recrée. On charge donc les
    polices depuis JavaScript : zéro intervention sur le projet natif, et le
    widget lui-même n'utilise que les polices système.

    Seules les huit graisses réellement employées sont importées, par
    sous-chemin : le barrel du paquet embarquerait les dix-huit.
  */
  const [fontsLoaded] = useFonts({
    Rokkitt_400Regular,
    Rokkitt_500Medium,
    Rokkitt_600SemiBold,
    Rokkitt_700Bold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });


  // Initialise l'auth
  useEffect(() => {
    const unsubAuth = initAuth();
    setIsMounted(true);
    return () => {
      unsubAuth();
    };
  }, [initAuth]);

  // Single source of truth pour le chargement des challenges.
  // On attend que le persist middleware ait fini de lire AsyncStorage (_hasHydrated)
  // pour ne pas flasher un spinner alors que les données en cache arrivent.
  // authStore.initialize() ne charge plus les challenges — c'est fait ici uniquement.
  useEffect(() => {
    if (user?.id && _hasHydrated) {
      loadUserChallenges(user.id);
    }
  }, [user?.id, _hasHydrated, loadUserChallenges]);

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
        waitFor={isInitialized && fontsLoaded}
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

      {/*
        Classement complet — sheet iOS natif.
        `formSheet` délègue la présentation à UIKit : la poignée, les deux
        paliers de hauteur, le glissement pour fermer et l'assombrissement du
        fond viennent du système, pas de notre code.
        Le rayon des coins est volontairement non spécifié : iOS 26 applique
        alors son propre rayon, concentrique avec la courbure de l'écran.
      */}
      <Stack.Screen
        name="leaderboard"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.65, 0.95],
          sheetGrabberVisible: true,
          sheetExpandsWhenScrolledToEdge: true,
          // Barre de navigation native plutôt qu'un en-tête dessiné à la main :
          // c'est elle qui porte le verre d'iOS 26, et elle donne à
          // react-native-screens les bonnes marges de sécurité pour le contenu.
          headerShown: true,
          headerTitle: 'Classement',
          headerLargeTitle: false,
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
