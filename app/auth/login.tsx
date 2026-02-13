/**
 * Écran de connexion - "bestie book battle"
 *
 * Design Figma : fond gris texturé, graphique BB avec couvertures de livres,
 * logo avec b en gras, slogan "que le meilleur lise !", bouton Apple Sign In.
 *
 * Flow :
 * - Nouveaux utilisateurs → onboarding (saisie prénom)
 * - Utilisateurs existants → home ou création de projet
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Dimensions, StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { isAppleAuthAvailable } from '../../services/supabase/auth';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
} from '../../utils/constants';
import Button3D from '../../components/Button3D';

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
        router.replace('/onboarding');
      } else {
        if (result.user) {
          await loadUserChallenges(result.user.id);
        }

        const { challenges } = useProjectStore.getState();

        if (challenges && challenges.length > 0) {
          router.replace('/(tabs)');
        } else {
          router.replace({
            pathname: '/project/create',
            params: { isFirstProject: 'true' },
          });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.code === 'ERR_REQUEST_CANCELED') {
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
    fontFamily: 'Rokkitt_Medium',
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.medium as any,
    color: '#9ca3af', // gris clair pour "estie", "ook", "attle"
    letterSpacing: 3, // espacement généreux entre les lettres
    textAlign: 'center',
  },
  logoBold: {
    fontFamily: 'Rokkitt_Bold',
    fontWeight: fontWeight.bold as any,
    color: colors.textPrimary, // gris foncé/noir pour les "b"
  },
});
