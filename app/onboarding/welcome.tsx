/**
 * Écran 6b de l'onboarding (branche Rejoindre) : Bienvenue !
 * 
 * Écran final pour la branche "Rejoindre un bbb".
 * Affiche la carte du challenge à rejoindre.
 * L'utilisateur peut rejoindre le challenge et démarrer.
 * 
 * Structure identique à complete.tsx :
 * - Header avec bouton retour
 * - Titre + description
 * - Carte livre avec PopEyes overlay + cover dynamique
 * - Footer fixé en bas (hors ScrollView)
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
import { 
    Alert, 
    ScrollView,
    StyleSheet, 
    View, 
    Text 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../utils/constants';
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
        addChallenge?: string;
    }>();
    
    const [isLoading, setIsLoading] = useState(false);
    const [bookInfoHeight, setBookInfoHeight] = useState<number>(80);

    /** Ratio standard couverture livre (largeur / hauteur) */
    const COVER_ASPECT_RATIO = 2 / 3;

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
            <View style={styles.content}>
                {/* Background texture */}
                <Image
                    source={TEXTURE_IMAGE}
                    style={styles.backgroundTexture}
                    contentFit="cover"
                />

                {/* Contenu scrollable */}
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Header : retour à gauche, fermeture (flow home) à droite */}
                    <View style={[styles.header, styles.headerRow]}>
                        <Button3D
                            variant="secondary"
                            icon="chevron-back"
                            iconOnly
                            size="compact"
                            onPress={() => router.back()}
                        />
                        {params.addChallenge === 'true' && (
                            <Button3D
                                variant="primary"
                                icon="close"
                                iconOnly
                                size="compact"
                                onPress={() => router.navigate('/(tabs)')}
                            />
                        )}
                    </View>

                    {/* Contenu principal */}
                    <View style={styles.mainContent}>
                        <Text style={styles.title}>Bienvenue !</Text>
                        <Text style={styles.description}>
                            {params.adminFirstName} est ravi.e que tu participes à ce bbb
                        </Text>
                        
                        {/* Carte du livre avec PopEyes */}
                        <View style={styles.cardWrapper}>
                            {/* Carte dark du livre */}
                            <View style={styles.bookCard}>
                                {/* Texture de fond */}
                                <Image
                                    source={TEXTURE_DARK}
                                    style={styles.cardTexture}
                                    contentFit="cover"
                                />

                                <View style={styles.bookCardContent}>
                                    {/* Cover image — hauteur = bloc texte, ratio conservé */}
                                    {params.coverUrl ? (
                                        <Image
                                            source={{ uri: params.coverUrl }}
                                            style={[
                                                styles.coverImage,
                                                {
                                                    height: bookInfoHeight,
                                                    width: bookInfoHeight * COVER_ASPECT_RATIO,
                                                },
                                            ]}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <View
                                            style={[
                                                styles.coverPlaceholder,
                                                {
                                                    height: bookInfoHeight,
                                                    width: bookInfoHeight * COVER_ASPECT_RATIO,
                                                },
                                            ]}
                                        >
                                            <Ionicons name="book" size={40} color={colors.alphaWhite30} />
                                        </View>
                                    )}

                                    {/* Infos livre — on mesure cette hauteur pour adapter la cover */}
                                    <View
                                        style={styles.bookInfo}
                                        onLayout={(e) => {
                                            const h = e.nativeEvent.layout.height;
                                            if (h > 0) setBookInfoHeight(h);
                                        }}
                                    >
                                        <Text style={styles.bookAuthor}>{params.author}</Text>
                                        <Text style={styles.bookTitle}>{params.bookTitle}</Text>
                                        <View style={styles.pagesBadge}>
                                            <Text style={styles.pagesText}>{params.totalPages} pages</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Pop eyes en overlay — z-index max, dépasse du bloc */}
                            <View style={styles.mascotOverlay} pointerEvents="none">
                                <PopEyes size="large" />
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Footer ferré en bas — comme toutes les autres pages */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <Button3D
                        onPress={handleJoinChallenge}
                        variant="primary"
                        loading={isLoading}
                        style={{ width: '100%' }}
                    >
                        Rejoindre
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
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mainContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing['2xl'],
        gap: spacing.lg,
    },
    title: {
        fontFamily: 'Rokkitt_Medium',
        fontSize: fontSize['3xl'],
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    description: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.md,
        fontWeight: fontWeight.regular,
        color: colors.textSecondary,
        lineHeight: 24,
        marginBottom: spacing['4xl'],
    },
    cardWrapper: {
        position: 'relative',
        overflow: 'visible',
    },
    bookCard: {
        backgroundColor: colors.dark800,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        position: 'relative',
        overflow: 'hidden',
    },
    cardTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    mascotOverlay: {
        position: 'absolute',
        top: -48,
        right: spacing.sm,
        zIndex: 9999,
        elevation: 9999,
    },
    bookCardContent: {
        flexDirection: 'row',
        gap: spacing.lg,
    },
    coverImage: {
        borderRadius: borderRadius.xs,
        borderWidth: 1,
        borderColor: colors.alphaWhite10,
    },
    coverPlaceholder: {
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
        gap: spacing.xs,
    },
    bookAuthor: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.sm,
        fontWeight: fontWeight.regular,
        color: colors.textSubtle,
        lineHeight: 20,
    },
    bookTitle: {
        fontFamily: 'WorkSans_SemiBold',
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.white,
        lineHeight: 24,
    },
    pagesBadge: {
        backgroundColor: colors.alphaWhite20,
        borderWidth: 1,
        borderColor: colors.alphaWhite10,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        alignSelf: 'flex-start',
        marginTop: spacing.xs,
    },
    pagesText: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.xs,
        fontWeight: fontWeight.regular,
        color: colors.white,
        lineHeight: 16,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        gap: spacing.md,
    },
});
