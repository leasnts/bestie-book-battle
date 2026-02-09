import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { colors } from '../../utils/constants';
import { useAuthStore } from '../../stores/authStore';
import { createOrUpdateUserProfile } from '../../services/supabase/auth';

export default function OnboardingIndex() {
    const router = useRouter();
    
    // État pour suivre la création du profil
    const [isCreatingProfile, setIsCreatingProfile] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Récupérer les données Apple stockées temporairement après le sign-in
    const pendingUserData = useAuthStore((state) => state.pendingUserData);
    const setUser = useAuthStore((state) => state.setUser);
    const setPendingUserData = useAuthStore((state) => state.setPendingUserData);

    // Valeurs d'animation
    const logoScale = useSharedValue(0);
    const logoRotate = useSharedValue(-10);
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(20);
    const buttonsOpacity = useSharedValue(0);
    const buttonsTranslateY = useSharedValue(30);

    // Au montage : créer le profil utilisateur dans la base de données
    // C'est ici qu'on transforme le "Supabase Auth user" en "profil utilisateur"
    // dans notre table personnalisée "users"
    useEffect(() => {
        const createProfile = async () => {
            if (!pendingUserData) {
                // Pas de données en attente = le profil existe peut-être déjà
                // (cas où l'utilisateur revient sur l'onboarding)
                setIsCreatingProfile(false);
                return;
            }

            try {
                // Créer le profil dans notre table "users" avec les données Apple
                // Apple donne le prénom/nom UNIQUEMENT au premier sign-in,
                // c'est pour ça qu'on les a stockés dans pendingUserData
                const newUser = await createOrUpdateUserProfile({
                    id: pendingUserData.authId,
                    apple_user_id: pendingUserData.appleUserId,
                    email: pendingUserData.email,
                    first_name: pendingUserData.firstName || 'Utilisateur',
                    last_name: pendingUserData.lastName || null,
                });

                // Mettre à jour le store avec le nouveau profil
                // Maintenant l'app sait que l'utilisateur est connecté ET a un profil
                setUser(newUser);

                // Nettoyer les données temporaires (plus besoin)
                setPendingUserData(null);
            } catch (error: any) {
                console.error('Erreur création profil onboarding:', error);
                setProfileError(error.message || 'Erreur lors de la création du profil');
            } finally {
                setIsCreatingProfile(false);
            }
        };

        createProfile();
    }, []);

    // Lancer les animations au montage du composant
    useEffect(() => {
        // Animation du logo : apparition avec bounce
        logoScale.value = withSpring(1, {
            damping: 12,
            stiffness: 100,
        });
        
        // Petit effet de rotation pour le logo
        logoRotate.value = withSequence(
            withTiming(10, { duration: 400 }),
            withSpring(0, { damping: 10 })
        );

        // Animation du titre : fade in + slide up (avec délai)
        titleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
        titleTranslateY.value = withDelay(200, withSpring(0, { damping: 15 }));

        // Animation des boutons : fade in + slide up (avec plus de délai)
        buttonsOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
        buttonsTranslateY.value = withDelay(500, withSpring(0, { damping: 15 }));
    }, []);

    // Styles animés pour le logo
    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: logoScale.value },
            { rotate: `${logoRotate.value}deg` },
        ],
    }));

    // Styles animés pour le titre
    const titleAnimatedStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleTranslateY.value }],
    }));

    // Styles animés pour les boutons
    const buttonsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: buttonsOpacity.value,
        transform: [{ translateY: buttonsTranslateY.value }],
    }));

    // Pendant la création du profil, afficher un loader
    if (isCreatingProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text variant="bodyLarge" style={styles.loadingText}>
                        Création de ton compte...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // En cas d'erreur lors de la création du profil
    if (profileError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text variant="bodyLarge" style={styles.errorText}>
                        {profileError}
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => router.replace('/auth/login')}
                        style={styles.button}
                    >
                        Réessayer
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Animated.View style={logoAnimatedStyle}>
                        <Image
                            source={require('../../assets/images/icon.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>
                    <Animated.View style={titleAnimatedStyle}>
                        <Text variant="headlineLarge" style={styles.appName}>Bestie Book Battle</Text>
                        <Text variant="bodyMedium" style={styles.tagline}>
                            Lisez ensemble, progressez ensemble
                        </Text>
                    </Animated.View>
                </View>

                <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle]}>
                    <Button
                        mode="contained"
                        onPress={() => router.push('/onboarding/create')}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        icon="book-plus"
                    >
                        Créer un projet
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={() => { }} // TODO: Implement join
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        icon="account-multiple-plus"
                    >
                        Rejoindre un projet
                    </Button>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // État de chargement pendant la création du profil
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 24,
    },
    loadingText: {
        color: colors.textSecondary,
        textAlign: 'center',
    },
    errorText: {
        color: '#DC2626',
        textAlign: 'center',
        marginBottom: 16,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
        paddingVertical: 48,
    },
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    logo: {
        width: 140,
        height: 140,
        borderRadius: 28,
        // Ombre pour le logo
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    appName: {
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
    },
    tagline: {
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    buttonsContainer: {
        gap: 16,
        width: '100%',
    },
    button: {
        borderRadius: 12,
        // Ombre légère pour les boutons
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonContent: {
        paddingVertical: 8,
    },
});
