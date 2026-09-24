/**
 * Écran 4b de l'onboarding (branche Rejoindre) : Ton édition
 *
 * Chacun lit son édition (poche, broché, Kindle…) : avant d'arriver dans le
 * bbb, on règle la sienne. Pré-rempli avec l'édition du bbb, il suffit de
 * valider si c'est la même.
 * - Couverture : chercher son édition, ou la prendre en photo
 * - Pages : celles de son édition (sa progression en dépend)
 *
 * Mon édition est gardée dans onboardingStore ; welcome.tsx l'enregistre une
 * fois le bbb rejoint.
 *
 * Flow : join → edition (ici) → notifications → welcome
 *        (addChallenge : join → edition → welcome)
 */

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpenIcon, ChevronLeftIcon, PencilIcon, XIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    InputAccessoryView,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import BookSearchSheet from '../../components/ui/BookSearchSheet';
import ImageCropModal, { PendingImage } from '../../components/ui/ImageCropModal';
import { useOnboardingStore } from '../../stores/onboardingStore';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, fonts, spacing } from '../../utils/constants';

// Asset : texture de fond
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingEditionScreen() {
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

    // Pré-rempli : l'édition du bbb, ou celle déjà choisie si on revient ici
    const draft = useOnboardingStore((s) => s.myEdition);
    const [cover, setCover] = useState<string | null>(draft?.cover ?? (params.coverUrl || null));
    const [totalPages, setTotalPages] = useState(
        draft ? String(draft.totalPages) : params.totalPages ?? '',
    );
    const [publisher, setPublisher] = useState<string | null>(draft?.publisher ?? null);
    const [searchVisible, setSearchVisible] = useState(false);
    const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);

    const pages = Number(totalPages);
    const pagesValid = totalPages.trim() !== '' && Number.isInteger(pages) && pages > 0;

    /** Mon édition trouvée par la recherche : sa couverture, ses pages, son éditeur */
    const handleSelectBook = (book: BookSearchResult) => {
        if (book.coverUrl) setCover(book.coverUrl);
        if (book.pageCount) setTotalPages(String(book.pageCount));
        setPublisher(book.publisher);
    };

    const pickFrom = async (source: 'library' | 'camera') => {
        try {
            const permission = source === 'library'
                ? await ImagePicker.requestMediaLibraryPermissionsAsync()
                : await ImagePicker.requestCameraPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert(
                    'Permission refusée',
                    source === 'library'
                        ? 'L\'application a besoin d\'accéder à tes photos pour importer une couverture.'
                        : 'L\'application a besoin d\'accéder à ton appareil photo pour photographier la couverture.',
                );
                return;
            }

            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            };
            const result = source === 'library'
                ? await ImagePicker.launchImageLibraryAsync(options)
                : await ImagePicker.launchCameraAsync(options);

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setPendingImage({ uri: asset.uri, width: asset.width, height: asset.height });
            }
        } catch (error) {
            console.error('Erreur couverture de mon édition:', error);
            Alert.alert('Erreur', 'Impossible de récupérer la photo');
        }
    };

    const handleChangeCover = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Annuler', 'Chercher mon édition', 'Choisir depuis la photothèque', 'Prendre une photo'],
                cancelButtonIndex: 0,
            },
            (buttonIndex) => {
                if (buttonIndex === 1) setSearchVisible(true);
                if (buttonIndex === 2) pickFrom('library');
                if (buttonIndex === 3) pickFrom('camera');
            },
        );
    };

    const handleContinue = () => {
        if (!pagesValid) return;
        useOnboardingStore.getState().setMyEdition({ cover, totalPages: pages, publisher });

        // addChallenge : direct à welcome ; onboarding : notifications → welcome
        if (params.addChallenge) {
            router.push({ pathname: '/onboarding/welcome', params });
        } else {
            router.push({ pathname: '/onboarding/notifications', params: { ...params, flow: 'join' } });
        }
    };

    return (
        <>
        <SafeAreaView style={styles.container} edges={['top']}>
            <InputAccessoryView nativeID="edition-pages-empty">
                <View />
            </InputAccessoryView>
            <KeyboardAvoidingView style={styles.content} behavior="padding">
                {/* Background texture */}
                <Image source={TEXTURE_IMAGE} style={styles.backgroundTexture} contentFit="cover" />

                {/* Header : retour à gauche, fermeture (flow home) à droite */}
                <View style={[styles.header, styles.headerRow]}>
                    <Button3D
                        variant="secondary"
                        icon={ChevronLeftIcon}
                        iconOnly
                        size="compact"
                        onPress={() => router.back()}
                    />
                    {params.addChallenge === 'true' && (
                        <Button3D
                            variant="primary"
                            icon={XIcon}
                            iconOnly
                            size="compact"
                            onPress={() => router.navigate('/(tabs)')}
                        />
                    )}
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.mainContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.title}>Ton édition</Text>

                    {/* Couverture : toucher = chercher son édition ou la photographier */}
                    <View style={styles.coverZone}>
                        {cover ? (
                            <Image source={{ uri: cover }} style={styles.coverImage} contentFit="cover" />
                        ) : (
                            <BookOpenIcon size={40} color={colors.textPlaceholder} />
                        )}
                        <View style={styles.changeCoverButton}>
                            <Button3D
                                variant="secondary"
                                iconComponent={<PencilIcon size={18} color={colors.textTertiary} />}
                                iconOnly
                                size="compact"
                                onPress={handleChangeCover}
                                accessibilityLabel="Changer la couverture de mon édition"
                            />
                        </View>
                    </View>

                    {/* Pages de mon édition */}
                    <View style={styles.pagesRow}>
                        <TextInput
                            style={styles.pagesInput}
                            value={totalPages}
                            onChangeText={setTotalPages}
                            placeholder={params.totalPages || '256'}
                            placeholderTextColor={colors.alphaBlack10}
                            keyboardType="number-pad"
                            inputAccessoryViewID="edition-pages-empty"
                            returnKeyType="done"
                            accessibilityLabel="Nombre de pages de mon édition"
                        />
                        <Text style={styles.pagesUnit}>pages</Text>
                    </View>
                </ScrollView>

                {/* Bouton "Continuer" fixé en bas */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
                    <Button3D
                        onPress={handleContinue}
                        variant="primary"
                        disabled={!pagesValid}
                        style={{ width: '100%' }}
                    >
                        Continuer
                    </Button3D>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>

        <BookSearchSheet
            visible={searchVisible}
            onClose={() => setSearchVisible(false)}
            onSelectBook={handleSelectBook}
            initialQuery={params.bookTitle}
        />

        <ImageCropModal
            visible={pendingImage !== null}
            image={pendingImage}
            onConfirm={(croppedUri) => {
                setPendingImage(null);
                setCover(croppedUri);
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
    scroll: {
        flex: 1,
    },
    mainContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        paddingBottom: spacing.xl,
        gap: spacing['3xl'],
    },
    title: {
        fontFamily: fonts.display,
        fontSize: 30,
        color: colors.textPrimary,
        letterSpacing: -0.3,
        lineHeight: 36,
    },
    coverZone: {
        alignSelf: 'center',
        width: 150,
        height: 210,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.borderLight,
        borderRadius: borderRadius.xs,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    coverImage: {
        ...StyleSheet.absoluteFillObject,
    },
    changeCoverButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    pagesRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    pagesInput: {
        fontFamily: fonts.displayBold,
        fontSize: 44,
        color: colors.textPrimary,
        letterSpacing: -1,
        textAlign: 'right',
        minWidth: 80,
        padding: 0,
    },
    pagesUnit: {
        fontFamily: fonts.display,
        fontSize: 22,
        color: colors.textSecondary,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
});
