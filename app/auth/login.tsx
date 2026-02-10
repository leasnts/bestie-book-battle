/**
 * Écran de bienvenue - "bbb? challenge accepted"
 * 
 * Premier écran après le splash screen animé.
 * Fonctionnalité unique : Apple Sign In
 * - Nouveaux utilisateurs → onboarding (saisie prénom)
 * - Utilisateurs existants → home (avec leurs challenges)
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { 
  Alert, 
  Dimensions, 
  StyleSheet, 
  View, 
  ActivityIndicator,
  Text,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { isAppleAuthAvailable } from '../../services/supabase/auth';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../utils/constants';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';

// Asset : image de fond avec couvertures de livres
const BACKGROUND_IMAGE = require('../../assets/images/background-onboarding.png');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const router = useRouter();
  
  // État de chargement
  const [isLoading, setIsLoading] = useState(false);

  // Actions du store
  const login = useAuthStore((state) => state.login);
  const loadUserChallenges = useProjectStore((state) => state.loadUserChallenges);


  /**
   * Gérer la connexion avec Apple Sign In
   * 
   * Flow unique :
   * 1. Authentifier avec Apple + vérifier si le profil existe
   * 2. Redirection automatique :
   *    → Nouvel utilisateur → /onboarding (saisie prénom)
   *    → Utilisateur existant → /(tabs) ou /project/create si pas de challenges
   */
  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);

      // Vérifier si Apple Sign In est disponible
      const isAvailable = await isAppleAuthAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Non disponible',
          'Apple Sign In n\'est pas disponible sur cet appareil'
        );
        return;
      }

      // Se connecter avec Apple via Supabase
      const result = await login();

      if (result.isNewUser) {
        // Nouvel utilisateur → onboarding (saisie prénom)
        router.replace('/onboarding');
      } else {
        // Utilisateur existant → charger ses challenges et rediriger
        if (result.user) {
          await loadUserChallenges(result.user.id);
        }

        const { challenges } = useProjectStore.getState();

        if (challenges && challenges.length > 0) {
          router.replace('/(tabs)');
        } else {
          // L'utilisateur existe mais n'a pas de challenge
          router.replace({
            pathname: '/project/create',
            params: { isFirstProject: 'true' },
          });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return; // L'utilisateur a annulé
      }

      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background image - couvertures de livres */}
      <Image
        source={BACKGROUND_IMAGE}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      {/* Contenu centré : "bbb?" + "challenge accepted" + mascots */}
      <View style={styles.centerContent}>
        <View style={styles.titleContainer}>
          {/* Mascot gauche (œil gauche) */}
          <PopEyes variant="left" size="medium" style={styles.mascotLeft} />

          {/* Texte central */}
          <View style={styles.titleTextContainer}>
            <Text style={styles.mainTitle}>bbb?</Text>
            <Text style={styles.subtitle}>challenge accepted</Text>
          </View>

          {/* Mascot droit (œil droit) */}
          <PopEyes variant="right" size="small" style={styles.mascotRight} />
        </View>
      </View>

      {/* Bouton Apple Sign In en bas */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}>
        <Button3D
          onPress={handleAppleLogin}
          variant="primary"
          loading={isLoading}
          icon="logo-apple"
          iconPosition="left"
          style={{ width: screenWidth - 48 }}
        >
          Se connecter avec Apple
        </Button3D>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    // L'image est déjà lavée/claire, on la garde à pleine opacité
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  mascotLeft: {
    // Pas de style supplémentaire, géré par PopEyes
  },
  mascotRight: {
    // Pas de style supplémentaire, géré par PopEyes
  },
  titleTextContainer: {
    alignItems: 'center',
    gap: 0,
  },
  mainTitle: {
    fontFamily: 'Rokkitt_Bold',
    fontSize: fontSize['4xl'], // 48px = display-lg
    fontWeight: fontWeight.bold as any,
    color: colors.textPrimary,
    letterSpacing: -0.96, // -2% du fontSize
    lineHeight: 60, // line-height/display-lg
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Rokkitt_Bold',
    fontSize: fontSize['2xl'], // 24px = display-xs
    fontWeight: fontWeight.bold as any,
    color: colors.textPrimary,
    lineHeight: 32, // line-height/display-xs
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
});
