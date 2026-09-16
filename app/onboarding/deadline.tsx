/**
 * Écran 3c de l'onboarding (branche Créer) : Choix de la deadline
 *
 * L'utilisateur choisit une date de deadline via le picker natif iOS (spinner).
 * Par défaut : 1 mois après aujourd'hui.
 * La deadline est facultative — le bouton "Sans deadline" permet de skip.
 *
 * Flow : create (titre + auteur) → pages → deadline (ici) → cover
 */

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing } from '../../utils/constants';
import Button3D from '../../components/Button3D';
import { ChevronLeftIcon, XIcon } from 'lucide-react-native';

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

    // Date par défaut : 1 mois après aujourd'hui
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d;
    });

    const handleDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
        if (date) setSelectedDate(date);
    }, []);

    /**
     * Calculer le temps restant à partir de la date sélectionnée
     */
    const calculateTimeRemaining = () => {
        const deadline = new Date(selectedDate);
        deadline.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffMs = deadline.getTime() - today.getTime();
        if (diffMs < 0) return null;

        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (totalDays < 60) {
            return { totalDays, months: 0, weeks: 0, days: totalDays };
        }

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

        if (!timeRemaining) return null;

        const { totalDays, months, weeks, days } = timeRemaining;

        if (totalDays < 60) {
            return (
                <Text style={styles.timeRemainingText}>
                    Dans {totalDays} jour{totalDays > 1 ? 's' : ''}
                </Text>
            );
        }

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
     * Navigation vers l'écran suivant (cover)
     */
    const navigateToNext = (deadline: string) => {
        router.push({
            pathname: '/onboarding/cover',
            params: {
                firstName,
                bookTitle,
                author,
                totalPages,
                deadline,
                ...(addChallenge && { addChallenge }),
            },
        });
    };

    const handleContinue = () => {
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const yyyy = String(selectedDate.getFullYear());
        navigateToNext(`${dd}/${mm}/${yyyy}`);
    };

    const handleSkip = () => {
        navigateToNext('');
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

                {/* Header */}
                <View style={[styles.header, styles.headerRow]}>
                    <Button3D
                        variant="secondary"
                        icon={ChevronLeftIcon}
                        iconOnly
                        size="compact"
                        onPress={() => router.back()}
                    />
                    {addChallenge === 'true' && (
                        <Button3D
                            variant="primary"
                            icon={XIcon}
                            iconOnly
                            size="compact"
                            onPress={() => router.navigate('/(tabs)')}
                        />
                    )}
                </View>

                {/* Contenu principal : titre + picker natif */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>Choisis une deadline</Text>

                    <View style={styles.pickerContainer}>
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="inline"
                            onChange={handleDateChange}
                            locale="fr-FR"
                            minimumDate={new Date()}
                            accentColor={colors.dark900}
                            themeVariant="light"
                            style={styles.picker}
                        />

                        {renderTimeRemainingText()}
                    </View>
                </View>

                {/* Footer : 2 boutons (continuer + skip) */}
                <View style={[styles.footer, {
                    paddingBottom: Math.max(insets.bottom, 16) + 16
                }]}>
                    <Button3D
                        onPress={handleContinue}
                        variant="primary"
                        style={{ width: '100%' }}
                    >
                        Continuer
                    </Button3D>
                    <Button3D
                        onPress={handleSkip}
                        variant="secondary"
                        style={{ width: '100%' }}
                    >
                        Sans deadline
                    </Button3D>
                </View>
            </View>
        </SafeAreaView>
    );
}

// ── Styles ──
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
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
    backgroundTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        gap: spacing['3xl'],
    },
    title: {
        fontFamily: fonts.display,
        fontSize: 30,
        color: colors.textPrimary,
        letterSpacing: -0.3,
        lineHeight: 36,
    },
    pickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        gap: spacing.lg,
    },
    picker: {
        width: '100%',
        height: 350,
    },
    timeRemainingText: {
        fontFamily: fonts.body,
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        gap: spacing.md,
    },
});
