/**
 * Écran 5 de l'onboarding (partagé entre les deux flows)
 * 
 * Demande d'autorisation pour les notifications push.
 * Illustration d'iPhone + texte explicatif + 2 boutons :
 * - "Autoriser les notifications" (bouton principal)
 * - "Pas maintenant" (bouton secondaire)
 * 
 * Le paramètre `flow` détermine la navigation suivante :
 * - "create" → complete.tsx (écran "C'est terminé !")
 * - "join" → welcome.tsx (écran "Bienvenue !")
 */

import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Text 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, buttonStyles, borderRadius } from '../../utils/constants';
import Button3D from '../../components/Button3D';

// Assets
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');
const IPHONE_ILLUSTRATION = require('../../assets/images/84bd85b42834b15804c0e33cc47f128fb1f5fe4c.png');

type OnboardingFlow = 'create' | 'join';

export default function OnboardingNotificationsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        firstName: string;
        flow: OnboardingFlow;
        // Params pour la branche "create"
        bookTitle?: string;
        author?: string;
        totalPages?: string;
        coverUri?: string;
        // Params pour la branche "join"
        challengeId?: string;
        adminFirstName?: string;
        coverUrl?: string;
    }>();
    
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Demander l'autorisation pour les notifications
     */
    const handleAllowNotifications = async () => {
        setIsLoading(true);
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permission refusée',
                    'Tu peux toujours activer les notifications plus tard dans les paramètres de l\'app.'
                );
            }

            // Passer à l'écran suivant selon le flow
            navigateToNextScreen();
        } catch (error: any) {
            console.error('Erreur demande notifications:', error);
            Alert.alert('Erreur', 'Impossible de demander les notifications');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Continuer sans activer les notifications
     */
    const handleSkipNotifications = () => {
        navigateToNextScreen();
    };

    /**
     * Navigation vers l'écran suivant selon le flow
     */
    const navigateToNextScreen = () => {
        if (params.flow === 'create') {
            // Branche Créer → Écran "C'est terminé !" avec la carte du livre + code invite
            router.push({
                pathname: '/onboarding/complete',
                params: {
                    firstName: params.firstName,
                    bookTitle: params.bookTitle || '',
                    author: params.author || '',
                    totalPages: params.totalPages || '',
                    coverUri: params.coverUri || '',
                },
            });
        } else {
            // Branche Rejoindre → Écran "Bienvenue !" avec la carte du challenge
            router.push({
                pathname: '/onboarding/welcome',
                params: {
                    firstName: params.firstName,
                    challengeId: params.challengeId || '',
                    bookTitle: params.bookTitle || '',
                    author: params.author || '',
                    totalPages: params.totalPages || '',
                    coverUrl: params.coverUrl || '',
                    adminFirstName: params.adminFirstName || '',
                },
            });
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.content}>
                {/* Background texture */}
                <Image
                    source={TEXTURE_IMAGE}
                    style={styles.backgroundTexture}
                    contentFit="cover"
                />

                {/* Bouton back en haut à gauche */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.back()}
                    >
                        <View style={styles.backButtonInnerShadow} />
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Contenu principal */}
                <View style={styles.mainContent}>
                    {/* Illustration iPhone */}
                    <Image
                        source={IPHONE_ILLUSTRATION}
                        style={styles.illustration}
                        contentFit="contain"
                    />

                    {/* Texte centré */}
                    <View style={styles.textContainer}>
                        <Text style={styles.mainText}>
                            Autorise les notifications pour recevoir des rappels !
                        </Text>
                        <Text style={styles.subText}>
                            On va pas te spamer, promis
                        </Text>
                    </View>
                </View>

                {/* Boutons en bas */}
                <View style={styles.footer}>
                    {/* Bouton principal : Autoriser */}
                    <Button3D
                        onPress={handleAllowNotifications}
                        variant="primary"
                        loading={isLoading}
                        style={{ width: '100%' }}
                    >
                        Autoriser les notifications
                    </Button3D>

                    {/* Bouton secondaire : Pas maintenant */}
                    <Button3D
                        onPress={handleSkipNotifications}
                        variant="secondary"
                        disabled={isLoading}
                        style={{ width: '100%' }}
                    >
                        Pas maintenant
                    </Button3D>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
    },
    backgroundTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    header: {
        paddingTop: spacing['6xl'],
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
    },
    backButton: {
        ...buttonStyles.back,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    backButtonInnerShadow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: borderRadius.md,
        shadowColor: 'rgba(30,30,30,0.25)',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        alignItems: 'center',
        gap: spacing['4xl'], // 48px entre l'illustration et le texte
    },
    illustration: {
        width: 393,
        height: 331,
        maxWidth: '100%',
    },
    textContainer: {
        alignItems: 'center',
        gap: spacing.sm, // 8px entre les deux textes
    },
    mainText: {
        fontFamily: 'Rokkitt_SemiBold',
        fontSize: fontSize['2xl'], // 24px
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        textAlign: 'center',
        lineHeight: 32,
    },
    subText: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.sm, // 14px
        fontWeight: fontWeight.regular,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing['6xl'],
        gap: spacing.md, // 12px entre les deux boutons
    },
});
