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
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import { colors, fontSize, fontWeight, spacing } from '../../utils/constants';

// Assets
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');
const NOTIFICATION_ILLUSTRATION = require('../../assets/images/notification-illustration.png');

type OnboardingFlow = 'create' | 'join';

export default function OnboardingNotificationsScreen() {
    const insets = useSafeAreaInsets();
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

                {/* Contenu scrollable : header + image + texte */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.header}>
                        <Button3D
                            variant="secondary"
                            icon="chevron-back"
                            iconOnly
                            size="compact"
                            onPress={() => router.back()}
                        />
                    </View>

                    <View style={styles.illustrationContainer}>
                        <Image
                            source={NOTIFICATION_ILLUSTRATION}
                            style={styles.illustration}
                            contentFit="contain"
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.mainText}>
                            Autorise les notifications !
                        </Text>
                        <Text style={styles.subText}>
                            On va pas te spamer, promis :)
                        </Text>
                    </View>
                </ScrollView>

                {/* Footer ferret en bas - toujours visible avec safe area */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <Button3D
                        onPress={handleAllowNotifications}
                        variant="primary"
                        loading={isLoading}
                        style={{ width: '100%' }}
                    >
                        Autoriser
                    </Button3D>

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
        flexDirection: 'column',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    backgroundTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    header: {
        paddingTop: spacing['6xl'],
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    illustrationContainer: {
        paddingHorizontal: spacing.md,
        width: '100%',
        alignItems: 'center',
    },
    illustration: {
        width: '100%',
        aspectRatio: 300 / 280,
    },
    textContainer: {
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing['2xl'],
    },
    mainText: {
        fontFamily: 'Rokkitt_SemiBold',
        fontSize: fontSize['3xl'],
        fontWeight: fontWeight.semibold as any,
        color: colors.textPrimary,
        textAlign: 'center',
        lineHeight: 44,
    },
    subText: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.sm, // 14px
        fontWeight: fontWeight.regular as any,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        gap: spacing.md, // 12px entre les deux boutons
        // paddingBottom appliqué dynamiquement avec useSafeAreaInsets (comme login)
    },
});
