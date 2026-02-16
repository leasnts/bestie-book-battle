/**
 * Écran 3c de l'onboarding (branche Créer) : Choix de la deadline
 * 
 * L'utilisateur saisit une date de deadline au format JJ/MM/AAAA.
 * Format identique à onboarding/index.tsx : input géant centré.
 * Un texte en dessous calcule automatiquement le temps restant.
 * 
 * Flow : create (titre + auteur) → pages → deadline (ici) → cover
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

// Asset : texture de fond (même que les autres écrans)
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingDeadlineScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { firstName, bookTitle, author, totalPages, addChallenge } = useLocalSearchParams<{
        firstName: string;
        bookTitle: string;
        author: string;
        totalPages: string;
        addChallenge?: string;
    }>();
    
    // État pour la saisie (format masqué JJ/MM/AAAA)
    const [dateInput, setDateInput] = useState('');
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
     * Formater automatiquement l'input avec les slashes (JJ/MM/AAAA)
     * Ex: "1234" → "12/34", "12345678" → "12/34/5678"
     */
    const handleDateChange = (text: string) => {
        // Supprimer tout sauf les chiffres
        const digits = text.replace(/\D/g, '');
        
        // Limiter à 8 chiffres (JJMMAAAA)
        const truncated = digits.slice(0, 8);
        
        // Formater avec des slashes
        let formatted = truncated;
        if (truncated.length >= 3) {
            formatted = truncated.slice(0, 2) + '/' + truncated.slice(2);
        }
        if (truncated.length >= 5) {
            formatted = truncated.slice(0, 2) + '/' + truncated.slice(2, 4) + '/' + truncated.slice(4);
        }
        
        setDateInput(formatted);
    };

    /**
     * Calculer le temps restant à partir de la date saisie
     * Retourne un objet { months, weeks, days, totalDays } ou null si invalide
     */
    const calculateTimeRemaining = () => {
        // Vérifier que la date est complète (10 caractères = JJ/MM/AAAA)
        if (dateInput.length !== 10) return null;

        const parts = dateInput.split('/');
        if (parts.length !== 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        // Validation basique
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) return null;

        // Créer la date deadline
        const deadline = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Minuit pour comparer juste les jours

        // Calculer la différence en millisecondes
        const diffMs = deadline.getTime() - today.getTime();
        
        // Si la date est dans le passé
        if (diffMs < 0) return null;

        // Convertir en jours
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Si moins de 60 jours, afficher juste en jours
        if (totalDays < 60) {
            return { totalDays, months: 0, weeks: 0, days: totalDays };
        }

        // Sinon, calculer mois + semaines + jours
        const months = Math.floor(totalDays / 30);
        const remainingDaysAfterMonths = totalDays % 30;
        const weeks = Math.floor(remainingDaysAfterMonths / 7);
        const days = remainingDaysAfterMonths % 7;

        return { totalDays, months, weeks, days };
    };

    /**
     * Générer le texte du temps restant
     */
    const renderTimeRemainingText = () => {
        const timeRemaining = calculateTimeRemaining();
        
        if (!timeRemaining) {
            return null;
        }

        const { totalDays, months, weeks, days } = timeRemaining;

        // Si moins de 60 jours : "Dans X jours"
        if (totalDays < 60) {
            return (
                <Text style={styles.timeRemainingText}>
                    Dans {totalDays} jour{totalDays > 1 ? 's' : ''}
                </Text>
            );
        }

        // Sinon : "Dans X mois X semaines et X jours"
        const parts: string[] = [];
        if (months > 0) parts.push(`${months} mois`);
        if (weeks > 0) parts.push(`${weeks} semaine${weeks > 1 ? 's' : ''}`);
        if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);

        let text = 'Dans ';
        if (parts.length === 1) {
            text += parts[0];
        } else if (parts.length === 2) {
            text += parts.join(' et ');
        } else {
            text += parts[0] + ' ' + parts[1] + ' et ' + parts[2];
        }

        return <Text style={styles.timeRemainingText}>{text}</Text>;
    };

    /**
     * Valider la date et passer à l'écran suivant (couverture)
     */
    const handleContinue = () => {
        if (dateInput.length !== 10) {
            Alert.alert('Date incomplète', 'Merci de saisir une date complète au format JJ/MM/AAAA');
            return;
        }

        const timeRemaining = calculateTimeRemaining();
        if (!timeRemaining) {
            Alert.alert('Date invalide', 'Merci de saisir une date valide dans le futur');
            return;
        }

        // Passer à l'écran de couverture avec la deadline
        router.push({
            pathname: '/onboarding/cover',
            params: {
                firstName,
                bookTitle,
                author,
                totalPages,
                deadline: dateInput, // Format JJ/MM/AAAA
                ...(addChallenge && { addChallenge }),
            },
        });
    };

    const isDateComplete = dateInput.length === 10 && calculateTimeRemaining() !== null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* InputAccessoryView vide : remplace la toolbar "Done" native d'iOS */}
            {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID="deadline-empty">
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

                {/* Header : identique à index.tsx */}
                <View style={styles.header}>
                    <Button3D
                        variant="secondary"
                        icon="chevron-back"
                        iconOnly
                        size="compact"
                        onPress={() => router.back()}
                    />
                </View>

                {/* Contenu principal : titre + input géant centré */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>Choisis une deadline</Text>
                    
                    {/* Input géant centré — même style que le prénom */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="JJ/MM/AAAA"
                            placeholderTextColor={colors.alphaBlack10}
                            value={dateInput}
                            onChangeText={handleDateChange}
                            keyboardType="number-pad"
                            inputAccessoryViewID="deadline-empty"
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleContinue}
                        />
                        
                        {/* Texte du temps restant (en dessous de l'input) */}
                        {renderTimeRemainingText()}
                    </View>
                </View>

                {/* Footer : identique à index.tsx */}
                <View style={[styles.footer, { 
                    paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 16) + 16 
                }]}>
                    <Button3D
                        onPress={handleContinue}
                        variant="primary"
                        disabled={!isDateComplete}
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

// ── Styles identiques à onboarding/index.tsx ──
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
        fontFamily: 'Rokkitt_Medium',
        fontSize: fontSize['3xl'],     // 36px
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    inputContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl, // Réduit de 4xl (48px) à xl (20px) pour plus d'espace
        paddingVertical: spacing['2xl'],   // 24px
        gap: spacing.lg, // 16px entre l'input et le texte du temps restant
    },
    input: {
        fontFamily: 'Rokkitt_Bold',
        fontSize: 52,     // 52px au lieu de 60px pour que "AAAA" ne soit pas coupé
        fontWeight: fontWeight.bold as any,
        color: colors.textPrimary,
        letterSpacing: -0.5, // Réduit le letter-spacing pour plus d'espace
        textAlign: 'center', // Centré comme le prénom et les pages
        textAlignVertical: 'center',
        width: '100%',
        backgroundColor: 'transparent',
        padding: 0,
        minHeight: 80, // Hauteur minimale pour éviter que le texte soit coupé
        paddingTop: 10, // Petit padding pour centrer verticalement
    },
    timeRemainingText: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.sm,         // 14px — petit texte informatif
        fontWeight: fontWeight.regular as any,
        color: colors.textTertiary,    // Gris discret
        textAlign: 'center',
        letterSpacing: -0.28,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
});
