/**
 * Écran 3b de l'onboarding (branche Rejoindre) : Saisie code d'accès
 * 
 * L'utilisateur entre le code d'invitation reçu de son ami.e
 * pour rejoindre un challenge existant.
 * Format : 6 caractères alphanumériques (Ex: A1B2C3)
 */

import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert, 
  KeyboardAvoidingView,
  Platform,
  StyleSheet, 
  View, 
  Text, 
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '../../utils/constants';
import Button3D from '../../components/Button3D';
import { supabase } from '../../supabaseConfig';

// Asset : texture de fond
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingJoinScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { firstName } = useLocalSearchParams<{ firstName: string }>();
    
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Vérifier si le code d'invitation existe
     * et récupérer les informations du challenge
     */
    const handleContinue = async () => {
        if (inviteCode.trim().length !== 6) {
            Alert.alert('Code invalide', 'Le code doit contenir 6 caractères');
            return;
        }

        setIsLoading(true);
        try {
            // Chercher le challenge avec ce code d'invitation
            const { data: challenge, error } = await supabase
                .from('challenges')
                .select(`
                    *,
                    admin:users!challenges_admin_id_fkey(
                        id,
                        first_name,
                        last_name
                    )
                `)
                .eq('invite_code', inviteCode.toUpperCase())
                .single();

            if (error || !challenge) {
                Alert.alert(
                    'Code introuvable',
                    'Aucun challenge ne correspond à ce code. Vérifie que tu as bien saisi le code.'
                );
                return;
            }

            // Passer à l'écran notifications avec les infos du challenge
            router.push({
                pathname: '/onboarding/notifications',
                params: {
                    firstName,
                    flow: 'join',
                    challengeId: challenge.id,
                    bookTitle: challenge.book_title,
                    author: challenge.author || '',
                    totalPages: challenge.total_pages?.toString() || '',
                    coverUrl: challenge.cover_url || '',
                    adminFirstName: challenge.admin?.first_name || 'L\'admin',
                },
            });
        } catch (error: any) {
            console.error('Erreur recherche challenge:', error);
            Alert.alert('Erreur', 'Impossible de vérifier le code. Réessaie plus tard.');
        } finally {
            setIsLoading(false);
        }
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
                    <Text style={styles.title}>Quel est ton code d'accès ?</Text>
                    
                    {/* Input pour le code */}
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex : A1B2C3"
                            placeholderTextColor={colors.textPlaceholder}
                            value={inviteCode}
                            onChangeText={(text) => setInviteCode(text.toUpperCase())}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            maxLength={6}
                            returnKeyType="done"
                            onSubmitEditing={handleContinue}
                            editable={!isLoading}
                        />
                    </View>
                </View>

                {/* Bouton "Continuer" fixé en bas - safe area comme le login */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
                    <Button3D
                        onPress={handleContinue}
                        variant="primary"
                        disabled={inviteCode.trim().length !== 6}
                        loading={isLoading}
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
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        gap: spacing['6xl'], // 64px entre titre et input
    },
    title: {
        fontFamily: 'Rokkitt_Medium',
        fontSize: fontSize['3xl'], // 36px
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    inputWrapper: {
        // Container pour l'input
    },
    input: {
        fontFamily: 'WorkSans',
        fontSize: fontSize.md, // 16px
        fontWeight: fontWeight.regular as any,
        color: colors.textPrimary,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg, // 20px
        paddingHorizontal: spacing['2xl'], // 24px
        paddingVertical: spacing.xl, // 20px
        ...shadows.xs,
        textAlign: 'center',
        textAlignVertical: 'center', // Centre vertical sur Android
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        // paddingBottom appliqué dynamiquement avec useSafeAreaInsets (comme login)
    },
});
