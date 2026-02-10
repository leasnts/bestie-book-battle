/**
 * Écran 3a de l'onboarding (branche Créer) : Formulaire livre
 * 
 * L'utilisateur décrit son premier bbb :
 * - Titre du livre
 * - Auteur du livre
 * - Nombre de pages
 * 
 * Ces données seront utilisées pour créer le challenge.
 */

import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  KeyboardAvoidingView,
  Platform,
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Text, 
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, buttonStyles, borderRadius, shadows } from '../../utils/constants';
import Button3D from '../../components/Button3D';

// Asset : texture de fond
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingBookFormScreen() {
    const router = useRouter();
    const { firstName } = useLocalSearchParams<{ firstName: string }>();
    
    const [bookTitle, setBookTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [totalPages, setTotalPages] = useState('');

    /**
     * Passer à l'écran suivant (import couverture)
     * Les données du livre sont passées en paramètres de route
     */
    const handleContinue = () => {
        // Validation simple
        if (!bookTitle.trim() || !author.trim() || !totalPages.trim()) {
            Alert.alert('Champs manquants', 'Merci de remplir tous les champs');
            return;
        }

        if (isNaN(Number(totalPages)) || Number(totalPages) <= 0) {
            Alert.alert('Nombre invalide', 'Le nombre de pages doit être un chiffre valide');
            return;
        }

        router.push({
            pathname: '/onboarding/cover',
            params: {
                firstName,
                bookTitle: bookTitle.trim(),
                author: author.trim(),
                totalPages: totalPages.trim(),
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

                {/* Bouton back en haut à gauche */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.back()}
                    >
                        <View style={styles.backButtonInnerShadow} />
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* ScrollView pour le contenu */}
                <ScrollView 
                    style={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContentContainer}
                >
                    <Text style={styles.title}>Décris ton premier bbb !</Text>
                    
                    {/* Formulaire avec 3 inputs */}
                    <View style={styles.formContainer}>
                        {/* Input: Titre du livre */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Titre du livre"
                                placeholderTextColor={colors.textPlaceholder}
                                value={bookTitle}
                                onChangeText={setBookTitle}
                                autoCapitalize="words"
                                returnKeyType="next"
                            />
                        </View>

                        {/* Input: Auteur du livre */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Auteur du livre"
                                placeholderTextColor={colors.textPlaceholder}
                                value={author}
                                onChangeText={setAuthor}
                                autoCapitalize="words"
                                returnKeyType="next"
                            />
                        </View>

                        {/* Input: Nombre de pages */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre de pages"
                                placeholderTextColor={colors.textPlaceholder}
                                value={totalPages}
                                onChangeText={setTotalPages}
                                keyboardType="number-pad"
                                returnKeyType="done"
                                onSubmitEditing={handleContinue}
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* Bouton "Continuer" fixé en bas */}
                <View style={styles.footer}>
                    <Button3D
                        onPress={handleContinue}
                        variant="primary"
                        disabled={!bookTitle.trim() || !author.trim() || !totalPages.trim()}
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
        paddingTop: spacing['6xl'],
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.xl,
    },
    backButton: {
        ...buttonStyles.back,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    backButtonInnerShadow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: borderRadius.md,
        shadowColor: 'rgba(30,30,30,0.25)',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
    },
    scrollContentContainer: {
        paddingTop: spacing['3xl'],
        gap: spacing['6xl'], // 64px entre titre et formulaire
    },
    title: {
        fontFamily: 'Rokkitt_Medium',
        fontSize: fontSize['3xl'], // 36px
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    formContainer: {
        gap: spacing['3xl'], // 32px entre les inputs (24px selon Figma)
    },
    inputWrapper: {
        // Container pour les inputs
    },
    input: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.md, // 16px
        fontWeight: fontWeight.regular as any,
        color: colors.textPrimary,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border, // #d5d7da
        borderRadius: borderRadius.lg, // 20px
        paddingHorizontal: spacing['2xl'], // 24px
        paddingVertical: spacing.xl, // 20px
        ...shadows.xs,
        // Pas de lineHeight ici : sur TextInput, ça décale le texte verticalement
        textAlignVertical: 'center', // Centre vertical sur Android
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing['6xl'],
    },
});
