/**
 * Écran 3a de l'onboarding (branche Créer) : Titre + Auteur
 * 
 * L'utilisateur décrit son premier bbb :
 * - Titre du livre
 * - Auteur du livre
 * 
 * Le nombre de pages est demandé sur l'écran suivant (pages.tsx)
 * dans un format identique à la saisie du prénom (input géant centré).
 * 
 * Structure identique à onboarding/index.tsx.
 */

import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '../../utils/constants';

// Asset : texture de fond
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingBookFormScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { firstName } = useLocalSearchParams<{ firstName: string }>();
    
    const [bookTitle, setBookTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Refs pour naviguer entre les champs via la touche "Suivant" du clavier
    const titleRef = useRef<TextInput>(null);
    const authorRef = useRef<TextInput>(null);

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
     * Passer à l'écran suivant (nombre de pages)
     * Les données du livre sont passées en paramètres de route
     */
    const handleContinue = () => {
        if (!bookTitle.trim() || !author.trim()) {
            Alert.alert('Champs manquants', 'Merci de remplir tous les champs');
            return;
        }

        router.push({
            pathname: '/onboarding/pages',
            params: {
                firstName,
                bookTitle: bookTitle.trim(),
                author: author.trim(),
            },
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
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

                {/* Header : identique à onboarding/index.tsx */}
                <View style={styles.header}>
                    <Button3D
                        variant="secondary"
                        icon="chevron-back"
                        iconOnly
                        size="compact"
                        onPress={() => router.back()}
                    />
                </View>

                {/* Contenu principal : titre + 2 inputs
                    Même structure que mainContent de index.tsx */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>Décris ton premier bbb !</Text>
                    
                    <View style={styles.formContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                ref={titleRef}
                                style={styles.input}
                                placeholder="Titre du livre"
                                placeholderTextColor={colors.textPlaceholder}
                                value={bookTitle}
                                onChangeText={setBookTitle}
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => authorRef.current?.focus()}
                                autoFocus
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                ref={authorRef}
                                style={styles.input}
                                placeholder="Auteur du livre"
                                placeholderTextColor={colors.textPlaceholder}
                                value={author}
                                onChangeText={setAuthor}
                                autoCapitalize="words"
                                returnKeyType="done"
                                onSubmitEditing={handleContinue}
                            />
                        </View>
                    </View>
                </View>

                {/* Footer : identique à onboarding/index.tsx */}
                <View style={[styles.footer, { 
                    paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 16) + 16 
                }]}>
                    <Button3D
                        onPress={handleContinue}
                        variant="primary"
                        disabled={!bookTitle.trim() || !author.trim()}
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
    backgroundTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    header: {
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
    },
    // Même structure que mainContent de index.tsx
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        gap: spacing['6xl'], // 64px entre titre et formulaire
    },
    title: {
        fontFamily: 'Rokkitt_Medium',
        fontSize: fontSize['3xl'],
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    formContainer: {
        gap: spacing.xl, // 20px entre Titre et Auteur (réduit, ils sont liés)
    },
    inputWrapper: {},
    input: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.md,
        fontWeight: fontWeight.regular as any,
        color: colors.textPrimary,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.xl,
        ...shadows.xs,
        textAlignVertical: 'center',
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
});
