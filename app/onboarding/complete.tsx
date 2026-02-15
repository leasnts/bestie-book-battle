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
import Button3D from '../../components/Button3D';
import PopEyes from '../../components/PopEyes';
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
import { createOrUpdateUserProfile } from '../../services/supabase/auth';
import { updateChallenge } from '../../services/supabase/database';
import { uploadBookCover } from '../../services/supabase/storage';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
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
        addChallenge?: string;
    }>();
    // coverUri : lu depuis le store (évite troncature des params URL pour les chemins fichiers longs)
    const coverUri = useOnboardingStore((s) => s.coverUri);
    
    const [isLoading, setIsLoading] = useState(false);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [bookInfoHeight, setBookInfoHeight] = useState<number>(80);

    /** Ratio standard couverture livre (largeur / hauteur) */
    const COVER_ASPECT_RATIO = 2 / 3;

    const user = useAuthStore((state) => state.user);
    const pendingUserData = useAuthStore((state) => state.pendingUserData);
    const setUser = useAuthStore((state) => state.setUser);
    const setPendingUserData = useAuthStore((state) => state.setPendingUserData);
    const createChallenge = useProjectStore((state) => state.createChallenge);

    const isAddChallenge = params.addChallenge === 'true';

    /**
     * Créer le profil utilisateur + le challenge
     * - onboarding : crée le profil si nouveau, puis le challenge
     * - addChallenge : user existe déjà, on crée juste le challenge
     */
    React.useEffect(() => {
        const initializeChallenge = async () => {
            if (isLoading || challengeId) return;
            
            setIsLoading(true);
            try {
                let userId = user?.id;
                // En mode addChallenge, l'utilisateur existe déjà
                if (!isAddChallenge && !userId && pendingUserData) {
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

                // Créer le challenge
                const challenge = await createChallenge(
                    userId,
                    params.bookTitle,
                    params.author || undefined,
                    Number(params.totalPages),
                    undefined
                );

                // 3. Upload de la cover si présente
                if (coverUri) {
                    try {
                        const { url } = await uploadBookCover(challenge.id, coverUri);
                        await updateChallenge(challenge.id, { cover_url: url });
                        // Mettre à jour le store local pour que la homepage affiche la bonne cover
                        // sans attendre loadUserChallenges
                        useProjectStore.setState((state) => {
                            const updated = { ...challenge, cover_url: url };
                            return {
                                challenges: state.challenges.map((c) =>
                                    c.id === challenge.id ? updated : c
                                ),
                                activeChallenge:
                                    state.activeChallenge?.id === challenge.id
                                        ? updated
                                        : state.activeChallenge,
                            };
                        });
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
        useOnboardingStore.getState().reset();
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
            <View style={styles.content}>
                {/* Background texture */}
                <Image
                    source={TEXTURE_IMAGE}
                    style={styles.backgroundTexture}
                    contentFit="cover"
                />

                {/* Contenu scrollable */}
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Header avec bouton retour */}
                <View style={styles.header}>
                    <Button3D
                        variant="secondary"
                        icon="chevron-back"
                        iconOnly
                        size="compact"
                        onPress={() => router.back()}
                    />
                </View>

                {/* Contenu principal */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>C'est terminé !</Text>
                    <Text style={styles.description}>
                        {isAddChallenge
                            ? 'Ton nouveau bbb est prêt, invite un.e ami.e pour cette lecture commune'
                            : 'Ton premier bbb est prêt, tu n\'as plus qu\'à inviter un.e ami.e pour cette lecture commune'}
                    </Text>
                    
                    {/* Carte du livre + code — bookCard (zIndex 2) au premier plan pour radius bas visibles */}
                    <View style={styles.cardWrapper}>
                        {/* Carte dark du livre (au premier plan) */}
                        <View style={styles.bookCard}>
                            {/* Texture de fond */}
                            <Image
                                source={TEXTURE_DARK}
                                style={styles.cardTexture}
                                contentFit="cover"
                            />

                            <View style={styles.bookCardContent}>
                                {/* Cover image — hauteur = bloc texte, ratio conservé (gauche) */}
                                {coverUri ? (
                                    <Image
                                        source={{ uri: coverUri }}
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

                                {/* Infos livre — on measure cette hauteur pour adapter la cover (droite) */}
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

                        {/* Zone code (en arrière-plan, sous le bloc noir) */}
                        <View style={styles.codeZone}>
                            <Text style={styles.codeLabel}>Code pour rejoindre :</Text>
                            <View style={styles.codeRow}>
                                <Text style={styles.codeText}>{inviteCode || '------'}</Text>
                                <TouchableOpacity
                                    onPress={handleCopyCode}
                                    style={styles.copyButton}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="copy-outline" size={20} color={colors.textPlaceholder} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Pop eyes en overlay — z-index max, bien au-dessus, dépasse du bloc */}
                        <View style={styles.mascotOverlay} pointerEvents="none">
                            <PopEyes size="large" />
                        </View>
                    </View>
                </View>
                </ScrollView>

                {/* Footer ferré en bas — comme toutes les autres pages */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <Button3D
                        onPress={handleShareInvite}
                        variant="primary"
                        icon="share-outline"
                        iconPosition="left"
                        style={{ width: '100%' }}
                    >
                        Inviter un.e ami.e
                    </Button3D>

                    <Button3D
                        onPress={handleFinish}
                        variant="secondary"
                        style={{ width: '100%' }}
                    >
                        Terminer
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
    header: {
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    mainContent: {
        paddingHorizontal: spacing.lg, // aligné sur notifications
        paddingTop: spacing['2xl'], // même structure que textContainer des écrans précédents
        gap: spacing.lg,
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
        fontSize: fontSize.md,
        fontWeight: fontWeight.regular,
        color: colors.textSecondary,
        lineHeight: 24,
        marginBottom: spacing['4xl'], // 48px entre le texte et la carte livre
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
        zIndex: 2,
        elevation: 2,
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
        gap: spacing.lg, // 16px
        // Pas de marginTop : les pop eyes overlay par-dessus, ne prennent pas de place
    },
    coverImage: {
        borderRadius: borderRadius.xs, // 2px
        borderWidth: 1,
        borderColor: colors.alphaWhite10,
        // width + height appliqués dynamiquement selon bookInfoHeight
    },
    coverPlaceholder: {
        borderRadius: borderRadius.xs,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.alphaWhite10,
        backgroundColor: colors.alphaWhite10,
        justifyContent: 'center',
        alignItems: 'center',
        // width + height appliqués dynamiquement
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
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.alphaBlack02,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
        paddingHorizontal: spacing['2xl'],
        paddingTop: spacing.lg, // 16px — réduit pour coller au bloc noir
        paddingBottom: spacing.lg,
        gap: spacing.xs,
        marginTop: -1,
        zIndex: 1,
        elevation: 1,
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
    copyButton: {
        padding: spacing.sm,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.bgLight,
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
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        gap: spacing.md,
    },
});
