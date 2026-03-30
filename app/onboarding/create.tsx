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
 * Structure : input géant centré (même pattern que les autres écrans onboarding).
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import BookSearchSheet from '../../components/ui/BookSearchSheet';
import { useOnboardingStore } from '../../stores/onboardingStore';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '../../utils/constants';

// Asset : texture de fond
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingBookFormScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { firstName, addChallenge } = useLocalSearchParams<{ firstName: string; addChallenge?: string }>();
    
    const [bookTitle, setBookTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);

    // Refs pour naviguer entre les champs via la touche "Suivant" du clavier
    const titleRef = useRef<TextInput>(null);
    const authorRef = useRef<TextInput>(null);

    /** Quand un livre est sélectionné depuis la recherche API */
    const handleSelectBook = (book: BookSearchResult) => {
        setBookTitle(book.title);
        setAuthor(book.author);
        useOnboardingStore.getState().setApiPageCount(book.pageCount);
        useOnboardingStore.getState().setApiCoverUrl(book.coverUrl);
    };

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
                ...(addChallenge && { addChallenge }),
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

                {/* Contenu principal : titre + 2 inputs
                    Même structure que mainContent de index.tsx */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>
                        {addChallenge ? 'Décris ce nouveau bbb' : 'Décris ton premier bbb !'}
                    </Text>

                    <View style={styles.formContainer}>
                        {/* Bouton recherche API */}
                        <Pressable
                            style={styles.searchButton}
                            onPress={() => {
                                Keyboard.dismiss();
                                setSearchVisible(true);
                            }}
                        >
                            <Ionicons name="search" size={18} color={colors.textPlaceholder} />
                            <Text style={styles.searchButtonText}>Rechercher un livre...</Text>
                        </Pressable>

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

                {/* Footer */}
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

            <BookSearchSheet
                visible={searchVisible}
                onClose={() => setSearchVisible(false)}
                onSelectBook={handleSelectBook}
            />
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    // Même structure que mainContent de index.tsx
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        gap: spacing['6xl'], // 64px entre titre et formulaire
    },
    title: {
        fontFamily: 'Rokkitt_500Medium',
        fontSize: fontSize['3xl'],
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    formContainer: {
        gap: spacing.xl, // 20px entre les champs
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.xl,
        ...shadows.xs,
    },
    searchButtonText: {
        fontFamily: 'WorkSans_400Regular',
        fontSize: fontSize.md,
        color: colors.textPlaceholder,
        letterSpacing: -0.3,
    },
    inputWrapper: {},
    input: {
        fontFamily: 'WorkSans_400Regular',
        fontSize: fontSize.md,
        fontWeight: fontWeight.regular as any,
        color: colors.textPrimary,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.xl,
        letterSpacing: -0.3,
        ...shadows.xs,
        textAlignVertical: 'center',
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
});
