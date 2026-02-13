/**
 * Écran 6b de l'onboarding (branche Rejoindre) : Bienvenue !
 * 
 * Écran final pour la branche "Rejoindre un bbb".
 * Affiche la carte du challenge à rejoindre.
 * L'utilisateur peut rejoindre le challenge et démarrer.
 */

import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  ScrollView,
  StyleSheet, 
  View, 
  Text 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../utils/constants';
import Button3D from '../../components/Button3D';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { createOrUpdateUserProfile } from '../../services/supabase/auth';

// Assets
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');
const TEXTURE_DARK = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingWelcomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams<{
        firstName: string;
        challengeId: string;
        bookTitle: string;
        author: string;
        totalPages: string;
        coverUrl?: string;
        adminFirstName: string;
    }>();
    
    const [isLoading, setIsLoading] = useState(false);

    const user = useAuthStore((state) => state.user);
    const pendingUserData = useAuthStore((state) => state.pendingUserData);
    const setUser = useAuthStore((state) => state.setUser);
    const setPendingUserData = useAuthStore((state) => state.setPendingUserData);
    const joinChallenge = useProjectStore((state) => state.joinChallenge);

    /**
     * Rejoindre le challenge et terminer l'onboarding
     */
    const handleJoinChallenge = async () => {
        setIsLoading(true);
        try {
            // 1. Créer/mettre à jour le profil utilisateur si nécessaire
            let userId = user?.id;
            if (!userId && pendingUserData) {
                const newUser = await createOrUpdateUserProfile({
                    id: pendingUserData.authId,
                    apple_user_id: pendingUserData.appleUserId,
                    email: pendingUserData.email,
                    first_name: params.firstName,
                    last_name: pendingUserData.lastName || null,
                });
                setUser(newUser);
                setPendingUserData(null);
                userId = newUser.id;
            }

            if (!userId) {
                Alert.alert('Erreur', 'Utilisateur non identifié');
                return;
            }

            // 2. Rejoindre le challenge
            await joinChallenge(params.challengeId, userId);

            // 3. Aller à la home
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Erreur rejoindre challenge:', error);
            Alert.alert('Erreur', error.message || 'Impossible de rejoindre le challenge');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Background texture */}
                <Image
                    source={TEXTURE_IMAGE}
                    style={styles.backgroundTexture}
                    contentFit="cover"
                />

                {/* Contenu principal */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>Bienvenue !</Text>
                    <Text style={styles.description}>
                        {params.adminFirstName} est ravi.e que tu participes à ce bbb
                    </Text>
                    
                    {/* Carte du livre */}
                    <View style={styles.bookCard}>
                        {/* Texture de fond */}
                        <Image
                            source={TEXTURE_DARK}
                            style={styles.cardTexture}
                            contentFit="cover"
                        />

                        {/* Mascot eyes en haut à gauche */}
                        <View style={styles.mascotContainer}>
                            <View style={styles.mascotPlaceholder} />
                        </View>

                        <View style={styles.bookCardContent}>
                            {/* Cover image */}
                            {params.coverUrl ? (
                                <Image
                                    source={{ uri: params.coverUrl }}
                                    style={styles.coverImage}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={styles.coverPlaceholder}>
                                    <Ionicons name="book" size={40} color={colors.alphaWhite30} />
                                </View>
                            )}

                            {/* Infos livre */}
                            <View style={styles.bookInfo}>
                                <Text style={styles.bookAuthor}>{params.author}</Text>
                                <Text style={styles.bookTitle}>{params.bookTitle}</Text>
                                <View style={styles.pagesBadge}>
                                    <Text style={styles.pagesText}>{params.totalPages} pages</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bouton en bas - safe area comme le login */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
                    <Button3D
                        onPress={handleJoinChallenge}
                        variant="primary"
                        loading={isLoading}
                        style={{ width: '100%' }}
                    >
                        Rejoindre
                    </Button3D>
                </View>
            </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
    },
    backgroundTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    mainContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['6xl'],
        gap: spacing.lg, // 16px entre titre et description
    },
    title: {
        fontFamily: 'Rokkitt_Medium',
        fontSize: fontSize['3xl'], // 36px
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    description: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.md, // 16px
        fontWeight: fontWeight.regular,
        color: colors.textSecondary,
        lineHeight: 24,
        marginBottom: spacing['2xl'], // 24px avant la carte
    },
    bookCard: {
        backgroundColor: colors.dark800, // #13161b
        borderRadius: borderRadius.xl, // 24px (pas de zone code en dessous)
        padding: spacing.lg, // 16px
        position: 'relative',
        overflow: 'hidden',
    },
    cardTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    mascotContainer: {
        position: 'absolute',
        top: spacing.lg,
        left: spacing.lg,
    },
    mascotPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.alphaWhite20,
    },
    bookCardContent: {
        flexDirection: 'row',
        gap: spacing.lg, // 16px
        marginTop: spacing['2xl'], // 24px pour laisser place au mascot
    },
    coverImage: {
        width: 142,
        height: 200,
        borderRadius: borderRadius.xs, // 2px
        borderWidth: 1,
        borderColor: colors.alphaWhite10,
    },
    coverPlaceholder: {
        width: 142,
        height: 200,
        borderRadius: borderRadius.xs,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.alphaWhite10,
        backgroundColor: colors.alphaWhite10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookInfo: {
        flex: 1,
        gap: spacing.xs, // 4px
    },
    bookAuthor: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.sm, // 14px
        fontWeight: fontWeight.regular,
        color: colors.textSubtle, // #d5d7da
        lineHeight: 20,
    },
    bookTitle: {
        fontFamily: 'WorkSans_SemiBold',
        fontSize: fontSize.md, // 16px
        fontWeight: fontWeight.semibold,
        color: colors.white,
        lineHeight: 24,
    },
    pagesBadge: {
        backgroundColor: colors.alphaWhite20,
        borderWidth: 1,
        borderColor: colors.alphaWhite10,
        borderRadius: borderRadius.sm, // 8px
        paddingHorizontal: spacing.sm, // 8px
        paddingVertical: spacing.xs, // 4px
        alignSelf: 'flex-start',
        marginTop: spacing.xs,
    },
    pagesText: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.xs, // 12px
        fontWeight: fontWeight.regular,
        color: colors.white,
        lineHeight: 16,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['2xl'],
        // paddingBottom appliqué dynamiquement avec useSafeAreaInsets (comme login)
    },
});
