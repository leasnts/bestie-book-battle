/**
 * Écran 3b de l'onboarding (branche Créer) : Nombre de pages
 * 
 * L'utilisateur saisit le nombre de pages du livre.
 * Format : input géant centré (même structure que les autres écrans onboarding).
 * 
 * Flow : create (titre + auteur) → pages (ici) → deadline → cover
 */

import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    InputAccessoryView,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, spacing } from '../../utils/constants';
import Button3D from '../../components/Button3D';
import { useOnboardingStore } from '../../stores/onboardingStore';

// Asset : texture de fond (même que les autres écrans)
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingPagesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { firstName, bookTitle, author, addChallenge } = useLocalSearchParams<{
        firstName: string;
        bookTitle: string;
        author: string;
        addChallenge?: string;
    }>();
    
    const apiPageCount = useOnboardingStore((s) => s.apiPageCount);
    const [totalPages, setTotalPages] = useState(() =>
        apiPageCount ? String(apiPageCount) : ''
    );
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setIsKeyboardVisible(true)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setIsKeyboardVisible(false)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    /**
     * Passer à l'écran suivant (choix de la deadline)
     * Toutes les données du livre sont passées en paramètres de route
     */
    const handleContinue = () => {
        if (!totalPages.trim()) return;

        if (isNaN(Number(totalPages)) || Number(totalPages) <= 0) {
            Alert.alert('Nombre invalide', 'Le nombre de pages doit être un chiffre valide');
            return;
        }

        router.push({
            pathname: '/onboarding/deadline',
            params: {
                firstName,
                bookTitle,
                author,
                totalPages: totalPages.trim(),
                ...(addChallenge && { addChallenge }),
            },
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* InputAccessoryView vide : remplace la toolbar "Done" native d'iOS */}
            {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID="pages-empty">
                    <View />
                </InputAccessoryView>
            )}
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
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

                {/* Contenu principal : titre + input géant centré
                    Structure identique à index.tsx (mainContent) */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>Il fait combien de pages ?</Text>
                    
                    {/* Input géant centré — même style que le prénom */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="256"
                            placeholderTextColor={colors.alphaBlack10}
                            value={totalPages}
                            onChangeText={setTotalPages}
                            keyboardType="number-pad"
                            inputAccessoryViewID="pages-empty"
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleContinue}
                        />
                    </View>
                </View>

                {/* Footer : identique à index.tsx */}
                <View style={[styles.footer, { 
                    paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 16) + 16 
                }]}>
                    <Button3D
                        onPress={handleContinue}
                        variant="primary"
                        disabled={!totalPages.trim() || isNaN(Number(totalPages)) || Number(totalPages) <= 0}
                        style={{ width: '100%' }}
                    >
                        Continuer
                    </Button3D>
                </View>
            </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ── Styles ──
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    keyboardAvoid: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    header: {
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
    },
    backgroundTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        gap: spacing['6xl'], // 64px entre titre et input
    },
    title: {
        fontFamily: 'Rokkitt_500Medium',
        fontSize: fontSize['3xl'],     // 36px
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    inputContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['4xl'], // 48px
        paddingVertical: spacing['2xl'],   // 24px
    },
    input: {
        fontFamily: 'Rokkitt_700Bold',
        fontSize: fontSize['5xl'],     // 60px — input géant comme le prénom
        fontWeight: fontWeight.bold as any,
        color: colors.textPrimary,
        letterSpacing: -1.2,
        textAlign: 'center',
        textAlignVertical: 'center',
        width: '100%',
        backgroundColor: 'transparent',
        padding: 0,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
});
