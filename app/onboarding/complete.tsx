/**
 * Écran 6a de l'onboarding (branche Créer) : C'est terminé !
 * 
 * Écran final pour la branche "Créer un bbb".
 * Affiche une carte du livre créé avec le code d'invitation.
 * L'utilisateur peut inviter un.e ami.e ou terminer l'onboarding.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import { createOrUpdateUserProfile } from '../../services/supabase/auth';
import { updateChallenge } from '../../services/supabase/database';
import { uploadBookCover } from '../../services/supabase/storage';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../../utils/constants';

// Assets
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');
const TEXTURE_DARK = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingCompleteScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams<{
        firstName: string;
        bookTitle: string;
        author: string;
        totalPages: string;
        coverUri?: string;
    }>();
    
    const [isLoading, setIsLoading] = useState(false);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [challengeId, setChallengeId] = useState<string | null>(null);

    const user = useAuthStore((state) => state.user);
    const pendingUserData = useAuthStore((state) => state.pendingUserData);
    const setUser = useAuthStore((state) => state.setUser);
    const setPendingUserData = useAuthStore((state) => state.setPendingUserData);
    const createChallenge = useProjectStore((state) => state.createChallenge);

    /**
     * Créer le profil utilisateur + le challenge
     * Cette fonction est appelée automatiquement au montage de l'écran
     */
    React.useEffect(() => {
        const initializeChallenge = async () => {
            if (isLoading || challengeId) return; // Déjà créé
            
            setIsLoading(true);
            try {
                // 1. Créer/mettre à jour le profil utilisateur
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

                // 2. Créer le challenge
                const challenge = await createChallenge(
                    userId,
                    params.bookTitle,
                    params.author || undefined,
                    Number(params.totalPages),
                    undefined
                );

                // 3. Upload de la cover si présente
                if (params.coverUri) {
                    try {
                        const { url } = await uploadBookCover(challenge.id, params.coverUri);
                        await updateChallenge(challenge.id, { cover_url: url });
                    } catch (coverError) {
                        console.error('Échec upload cover:', coverError);
                    }
                }

                setInviteCode(challenge.invite_code);
                setChallengeId(challenge.id);
            } catch (error: any) {
                console.error('Erreur création challenge:', error);
                Alert.alert('Erreur', error.message || 'Impossible de créer le challenge');
            } finally {
                setIsLoading(false);
            }
        };

        initializeChallenge();
    }, []);

    /**
     * Copier le code d'invitation
     */
    const handleCopyCode = async () => {
        if (!inviteCode) return;
        await Clipboard.setStringAsync(inviteCode);
        Alert.alert('Code copié !', 'Le code a été copié dans le presse-papiers');
    };

    /**
     * Partager le code avec un ami
     */
    const handleShareInvite = async () => {
        if (!inviteCode) return;

        try {
            await Share.share({
                message: `Rejoins-moi sur Bestie Book Battle pour lire "${params.bookTitle}" ensemble ! 📚\n\nCode d'invitation : ${inviteCode}`,
                title: 'Invitation BBB',
            });
        } catch (error) {
            console.error('Erreur partage:', error);
        }
    };

    /**
     * Terminer l'onboarding et aller à la home
     */
    const handleFinish = () => {
        router.replace('/(tabs)');
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.dark900} />
                    <Text style={styles.loadingText}>Création de ton bbb...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                    <Text style={styles.title}>C'est terminé !</Text>
                    <Text style={styles.description}>
                        Ton premier bbb est prêt, tu n'as plus qu'à inviter un.e ami.e pour cette lecture commune
                    </Text>
                    
                    {/* Carte du livre + code */}
                    <View style={styles.cardWrapper}>
                        {/* Carte dark du livre */}
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
                                {params.coverUri ? (
                                    <Image
                                        source={{ uri: params.coverUri }}
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

                        {/* Zone code collée en dessous */}
                        <View style={styles.codeZone}>
                            <Text style={styles.codeLabel}>Code pour rejoindre :</Text>
                            <View style={styles.codeRow}>
                                <Text style={styles.codeText}>{inviteCode || '------'}</Text>
                                <TouchableOpacity onPress={handleCopyCode}>
                                    <Ionicons name="copy-outline" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Boutons en bas - safe area comme le login */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
                    {/* Bouton principal : Inviter un.e ami.e */}
                    <Button3D
                        onPress={handleShareInvite}
                        variant="primary"
                        icon="share-outline"
                        iconPosition="left"
                        style={{ width: '100%' }}
                    >
                        Inviter un.e ami.e
                    </Button3D>

                    {/* Bouton secondaire : Terminer */}
                    <Button3D
                        onPress={handleFinish}
                        variant="secondary"
                        style={{ width: '100%' }}
                    >
                        Terminer
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.lg,
    },
    loadingText: {
        fontFamily: 'WorkSans_Medium',
        fontSize: fontSize.md,
        color: colors.textSecondary,
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
    cardWrapper: {
        // Container pour carte + zone code
    },
    bookCard: {
        backgroundColor: colors.dark800, // #13161b
        borderTopLeftRadius: borderRadius.xl, // 24px
        borderTopRightRadius: borderRadius.xl,
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
    codeZone: {
        backgroundColor: colors.bgSecondary, // #fafafa
        borderWidth: 1,
        borderColor: colors.alphaBlack02,
        borderBottomLeftRadius: borderRadius.xl, // 24px
        borderBottomRightRadius: borderRadius.xl,
        paddingHorizontal: spacing['2xl'], // 24px
        paddingTop: spacing['3xl'], // 32px (collé à la carte, donc plus de padding top)
        paddingBottom: spacing.lg, // 16px
        gap: spacing.xs, // 4px
    },
    codeLabel: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.sm, // 14px
        fontWeight: fontWeight.regular,
        color: colors.textPlaceholder, // #717680
        lineHeight: 20,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    codeText: {
        fontFamily: 'Rokkitt_Medium',
        fontSize: fontSize['3xl'], // 36px
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['2xl'],
        gap: spacing.md, // 12px entre les deux boutons
        // paddingBottom appliqué dynamiquement avec useSafeAreaInsets (comme login)
    },
});
