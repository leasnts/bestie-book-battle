/**
 * Écran de connexion - "bestie book battle"
 *
 * Design Figma : fond gris texturé, graphique BB avec couvertures de livres,
 * logo avec b en gras, slogan "que le meilleur lise !", bouton Apple Sign In.
 *
 * Flow :
 * - Nouveaux utilisateurs → onboarding (saisie prénom "Comment tu t'appelles ?")
 * - Utilisateurs existants avec projet(s) → home (tabs)
 * - Utilisateurs existants sans projet → onboarding (écran rôle, addChallenge)
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import { isAppleAuthAvailable } from '../../services/supabase/auth';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import {
  colors,
  fonts,
  spacing,
} from '../../utils/constants';
import AppleLogo from '../../components/brand/AppleLogo';

// Asset : image de fond qui remplit tout l'écran (graphique BB + couvertures)
const HERO_IMAGE = require('../../assets/images/5189b4a4ab2e5da08302bc27b5d740770b30721f.png');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const loadUserChallenges = useProjectStore((state) => state.loadUserChallenges);

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);

      const isAvailable = await isAppleAuthAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Non disponible',
          "Apple Sign In n'est pas disponible sur cet appareil"
        );
        return;
      }

      const result = await login();

      if (result.isNewUser) {
        // Apple fournit firstName au premier sign-in — on l'utilise directement
        // sans demander à l'utilisateur de le re-saisir (exigence App Store 4.0)
        const firstName = result.firstName || '';
        router.replace({
          pathname: '/onboarding/role',
          params: { firstName },
        });
      } else {
        if (result.user) {
          await loadUserChallenges(result.user.id);
        }

        const { challenges, error: challengesError } = useProjectStore.getState();

        // Si le chargement a échoué (réseau, Supabase…), on ne redirige PAS vers
        // l'onboarding : l'utilisateur a un compte existant. On affiche une erreur
        // pour qu'il réessaie plutôt que de lui faire re-créer un projet.
        if (challengesError) {
          Alert.alert(
            'Erreur de connexion',
            'Impossible de charger tes projets. Vérifie ta connexion et réessaie.'
          );
          return;
        }

        if (challenges && challenges.length > 0) {
          router.replace('/(tabs)');
        } else {
          // Utilisateur existant sans projet → nouveau flow onboarding (écran rôle)
          // On skip "Comment tu t'appelles ?" car il a déjà un profil, et on passe
          // le prénom depuis son profil pour l'écran rôle.
          const firstName = result.user?.first_name || 'Toi';
          router.replace({
            pathname: '/onboarding/role',
            params: { firstName, addChallenge: 'true' },
          });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // ERR_CANCELED = l'utilisateur a appuyé sur "Annuler" dans la modale Apple
      // Ce n'est pas une vraie erreur, on ignore silencieusement
      if (error.code === 'ERR_CANCELED') {
        return;
      }

      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la connexion'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Image de fond - remplit tout l'écran */}
      <Image
        source={HERO_IMAGE}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      {/* Zone texte + bouton en bas */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        {/* Logo + slogan au-dessus du bouton - même largeur que le bouton */}
        <View style={[styles.textBlock, { width: screenWidth - 48 }]}>
          <Text style={styles.logo}>
            <Text style={styles.logoBold}>b</Text>estie{' '}
            <Text style={styles.logoBold}>b</Text>ook{' '}
            <Text style={styles.logoBold}>b</Text>attle
          </Text>
        </View>

        {/* Bouton Apple Sign In */}
        <Button3D
          onPress={handleAppleLogin}
          variant="primary"
          loading={isLoading}
          iconComponent={<AppleLogo size={22} color={colors.white} />}
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
    backgroundColor: colors.bgLight,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  textBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    fontFamily: fonts.displayRegular,
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  logoBold: {
    fontFamily: fonts.displayBold,
    color: colors.textPrimary, // gris foncé/noir pour les "b"
  },
});
