/**
 * Écran 4a de l'onboarding (branche Créer) : Import couverture
 * 
 * L'utilisateur importe une photo de la couverture du livre.
 * Zone pointillée avec bouton d'upload au centre.
 * La couverture peut être sélectionnée via la galerie de photos.
 * 
 * Flow : create → pages → deadline → cover (ici) → notifications/complete
 */

import { Ionicons } from '@expo/vector-icons';
import IconRotateCcw from '../../components/icons/IconRotateCcw';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../../utils/constants';

// Asset : texture de fond
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingCoverScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { 
        firstName, 
        bookTitle, 
        author, 
        totalPages,
        deadline,
        addChallenge,
    } = useLocalSearchParams<{
        firstName: string;
        bookTitle: string;
        author: string;
        totalPages: string;
        deadline: string;
        addChallenge?: string;
    }>();
    
    const [coverUri, setCoverUri] = useState<string | null>(null);
    const [isPickingImage, setIsPickingImage] = useState(false);
    
    // On garde en mémoire si la permission est déjà accordée
    const hasPermissionRef = useRef(false);

    /**
     * Pré-demander la permission dès l'affichage de l'écran
     * Comme ça, quand l'utilisateur tape, la galerie s'ouvre direct sans attente
     */
    useEffect(() => {
        const preRequestPermission = async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            hasPermissionRef.current = status === 'granted';
        };
        preRequestPermission();
    }, []);

    /**
     * Ouvrir le sélecteur de photos pour choisir une couverture
     * La permission est déjà demandée au montage → ouverture quasi-instantanée
     */
    const handlePickImage = async () => {
        try {
            setIsPickingImage(true);

            // Vérifier si la permission est déjà accordée (pré-demandée au montage)
            if (!hasPermissionRef.current) {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission refusée',
                        'L\'application a besoin d\'accéder à tes photos pour importer une couverture.'
                    );
                    return;
                }
                hasPermissionRef.current = true;
            }

            // Ouvrir le sélecteur de photos — rapide car permission déjà OK
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [2, 3], // Ratio couverture de livre (largeur:hauteur)
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                setCoverUri(uri);
                // Stocker dans le store pour éviter la perte via les params de route
                // (les URIs fichier peuvent être longs et tronqués dans l'URL)
                useOnboardingStore.getState().setCoverUri(uri);
            }
        } catch (error: any) {
            console.error('Erreur sélection image:', error);
            Alert.alert('Erreur', 'Impossible de sélectionner une image');
        } finally {
            setIsPickingImage(false);
        }
    };

    /**
     * Passer à l'écran suivant
     * - addChallenge : va direct à complete (partage), sans notifications
     * - onboarding : va à notifications → complete
     */
    const handleContinue = () => {
        useOnboardingStore.getState().setCoverUri(coverUri);
        if (addChallenge) {
            router.push({
                pathname: '/onboarding/complete',
                params: {
                    firstName,
                    bookTitle,
                    author,
                    totalPages,
                    deadline,
                    addChallenge,
                },
            });
        } else {
            router.push({
                pathname: '/onboarding/notifications',
                params: {
                    firstName,
                    bookTitle,
                    author,
                    totalPages,
                    deadline,
                    flow: 'create',
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

                {/* Bouton retour = Button3D secondaire en mode icon-only */}
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
                    <Text style={styles.title}>Importe sa couverture</Text>
                    
                    {/* Zone pointillée pour la couverture */}
                    <View style={styles.coverZoneWrapper}>
                        <View style={styles.coverZone}>
                            {coverUri ? (
                                // Afficher l'image sélectionnée
                                <Image
                                    source={{ uri: coverUri }}
                                    style={styles.coverImage}
                                    contentFit="cover"
                                />
                            ) : null}

                            {/* Bouton upload au centre — visible seulement si pas encore de cover */}
                            {!coverUri && (
                                <Pressable
                                    style={styles.uploadButton}
                                    onPress={handlePickImage}
                                    disabled={isPickingImage}
                                >
                                    <View style={styles.uploadButtonInnerShadow} />
                                    <Ionicons 
                                        name="cloud-upload-outline" 
                                        size={24} 
                                        color={colors.white} 
                                    />
                                </Pressable>
                            )}

                            {/* Bouton "modifier la cover" — SUR la cover, padding 12px en bas à droite */}
                            {coverUri && (
                                <View style={styles.changeCoverButton}>
                                    <Button3D
                                        variant="secondary"
                                        iconComponent={<IconRotateCcw size={20} color="#535862" />}
                                        iconOnly
                                        size="compact"
                                        onPress={handlePickImage}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Bouton "Continuer" fixé en bas - safe area comme le login */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
                    <Button3D
                        onPress={handleContinue}
                        variant="primary"
                        style={{ width: '100%' }}
                    >
                        Continuer
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
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        gap: spacing['6xl'], // 64px entre titre et zone
    },
    title: {
        fontFamily: 'Rokkitt_Medium',
        fontSize: fontSize['3xl'], // 36px
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    coverZoneWrapper: {
        alignSelf: 'center',
        position: 'relative',
    },
    coverZone: {
        width: 214,
        height: 300,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.borderLight, // #e9eaeb
        borderRadius: borderRadius.xs,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    changeCoverButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        zIndex: 10,
    },
    coverImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    uploadButton: {
        position: 'absolute',
        width: 48,
        height: 48,
        backgroundColor: colors.dark900,
        borderWidth: 1,
        borderColor: colors.alphaWhite30,
        borderRadius: borderRadius.md, // 12px
        padding: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadButtonInnerShadow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: borderRadius.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        // paddingBottom appliqué dynamiquement avec useSafeAreaInsets (comme login)
    },
});
