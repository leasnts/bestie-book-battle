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
    ActionSheetIOS,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import ImageCropModal, { PendingImage } from '../../components/ui/ImageCropModal';
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
    
    const apiCoverUrl = useOnboardingStore((s) => s.apiCoverUrl);
    const [coverUri, setCoverUri] = useState<string | null>(apiCoverUrl);
    const [isPickingImage, setIsPickingImage] = useState(false);
    const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
    
    // On garde en mémoire si les permissions sont déjà accordées
    const hasLibraryPermissionRef = useRef(false);
    const hasCameraPermissionRef = useRef(false);

    /**
     * Pré-demander les permissions dès l'affichage de l'écran
     * Comme ça, quand l'utilisateur tape, la galerie/caméra s'ouvre direct sans attente
     */
    useEffect(() => {
        const preRequestPermissions = async () => {
            const [library, camera] = await Promise.all([
                ImagePicker.requestMediaLibraryPermissionsAsync(),
                ImagePicker.requestCameraPermissionsAsync(),
            ]);
            hasLibraryPermissionRef.current = library.status === 'granted';
            hasCameraPermissionRef.current = camera.status === 'granted';
        };
        preRequestPermissions();
    }, []);

    /**
     * Ouvrir le sélecteur de photos pour choisir une couverture
     * La permission est déjà demandée au montage → ouverture quasi-instantanée
     */
    const handlePickImage = async () => {
        try {
            setIsPickingImage(true);

            if (!hasLibraryPermissionRef.current) {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission refusée',
                        'L\'application a besoin d\'accéder à tes photos pour importer une couverture.'
                    );
                    return;
                }
                hasLibraryPermissionRef.current = true;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setPendingImage({ uri: asset.uri, width: asset.width, height: asset.height });
            }
        } catch (error: any) {
            console.error('Erreur sélection image:', error);
            Alert.alert('Erreur', 'Impossible de sélectionner une image');
        } finally {
            setIsPickingImage(false);
        }
    };

    /**
     * Ouvrir l'appareil photo pour prendre la couverture en photo
     */
    const handleTakePhoto = async () => {
        try {
            setIsPickingImage(true);

            if (!hasCameraPermissionRef.current) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission refusée',
                        'L\'application a besoin d\'accéder à ton appareil photo pour photographier la couverture.'
                    );
                    return;
                }
                hasCameraPermissionRef.current = true;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setPendingImage({ uri: asset.uri, width: asset.width, height: asset.height });
            }
        } catch (error: any) {
            console.error('Erreur prise de photo:', error);
            Alert.alert('Erreur', 'Impossible de prendre une photo');
        } finally {
            setIsPickingImage(false);
        }
    };

    /**
     * ActionSheet pour changer la cover existante (photothèque ou caméra)
     */
    const handleChangeCover = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Annuler', 'Choisir depuis la photothèque', 'Prendre une photo'],
                cancelButtonIndex: 0,
            },
            (buttonIndex) => {
                if (buttonIndex === 1) handlePickImage();
                if (buttonIndex === 2) handleTakePhoto();
            }
        );
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
        <>
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.content}>
                {/* Background texture */}
                <Image
                    source={TEXTURE_IMAGE}
                    style={styles.backgroundTexture}
                    contentFit="cover"
                />

                {/* Header : retour à gauche, fermeture (flow home) à droite */}
                <View style={[styles.header, styles.headerRow]}>
                    <Button3D
                        variant="secondary"
                        icon="chevron-back"
                        iconOnly
                        size="compact"
                        onPress={() => router.back()}
                    />
                    {addChallenge === 'true' && (
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

                            {/* Boutons d'import — visibles seulement si pas encore de cover */}
                            {!coverUri && (
                                <View style={styles.uploadButtons}>
                                    <Pressable
                                        style={styles.uploadButton}
                                        onPress={handlePickImage}
                                        disabled={isPickingImage}
                                    >
                                        <View style={styles.uploadButtonInnerShadow} />
                                        <Ionicons
                                            name="image-outline"
                                            size={24}
                                            color={colors.white}
                                        />
                                    </Pressable>
                                    <Pressable
                                        style={styles.uploadButton}
                                        onPress={handleTakePhoto}
                                        disabled={isPickingImage}
                                    >
                                        <View style={styles.uploadButtonInnerShadow} />
                                        <Ionicons
                                            name="camera-outline"
                                            size={24}
                                            color={colors.white}
                                        />
                                    </Pressable>
                                </View>
                            )}

                            {/* Bouton "modifier la cover" — SUR la cover, ouvre ActionSheet */}
                            {coverUri && (
                                <View style={styles.changeCoverButton}>
                                    <Button3D
                                        variant="secondary"
                                        iconComponent={<IconRotateCcw size={20} color="#535862" />}
                                        iconOnly
                                        size="compact"
                                        onPress={handleChangeCover}
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
                        disabled={!coverUri}
                        style={{ width: '100%' }}
                    >
                        Continuer
                    </Button3D>
                </View>
            </View>
        </SafeAreaView>

        <ImageCropModal
            visible={pendingImage !== null}
            image={pendingImage}
            onConfirm={(croppedUri) => {
                setPendingImage(null);
                setCoverUri(croppedUri);
                useOnboardingStore.getState().setCoverUri(croppedUri);
            }}
            onCancel={() => setPendingImage(null)}
        />
        </>
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        gap: spacing['6xl'], // 64px entre titre et zone
    },
    title: {
        fontFamily: 'Rokkitt_500Medium',
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
    uploadButtons: {
        position: 'absolute',
        flexDirection: 'row',
        gap: spacing.lg,
    },
    uploadButton: {
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
