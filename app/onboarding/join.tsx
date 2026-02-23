/**
 * Écran 3b de l'onboarding (branche Rejoindre) : Saisie code d'accès
 * 
 * L'utilisateur entre le code d'invitation reçu de son ami.e
 * pour rejoindre un challenge existant.
 * Format : 6 caractères alphanumériques (Ex: A1B2C3)
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
  View, 
  Text, 
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, spacing } from '../../utils/constants';
import Button3D from '../../components/Button3D';
import { supabase } from '../../supabaseConfig';

// Asset : texture de fond
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingJoinScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { firstName, addChallenge } = useLocalSearchParams<{ firstName: string; addChallenge?: string }>();
    
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
     * Vérifier si le code d'invitation existe
     * et récupérer les informations du challenge
     */
    const handleContinue = async () => {
        if (inviteCode.trim().length !== 6) {
            Alert.alert('Code invalide', 'Le code doit contenir 6 chiffres');
            return;
        }

        setIsLoading(true);
        try {
            // Chercher le challenge via RPC (contourne RLS : l'utilisateur
            // n'est pas encore participant, donc une requête directe serait bloquée)
            const { data: rows, error } = await supabase
                .rpc('get_challenge_by_invite_code', {
                    p_code: inviteCode.trim(),
                });

            const challenge = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

            if (error || !challenge) {
                Alert.alert(
                    'Code introuvable',
                    'Aucun challenge ne correspond à ce code. Vérifie que tu as bien saisi le code.'
                );
                return;
            }

            // addChallenge : aller direct à welcome (pas notifications)
            // onboarding : aller à notifications → welcome
            const nextParams = {
                firstName,
                challengeId: challenge.id,
                bookTitle: challenge.book_title,
                author: challenge.book_author || '',
                totalPages: challenge.total_pages?.toString() || '',
                coverUrl: challenge.cover_url || '',
                adminFirstName: challenge.admin_first_name || 'L\'admin',
                ...(addChallenge && { addChallenge }),
            };
            if (addChallenge) {
                router.push({
                    pathname: '/onboarding/welcome',
                    params: nextParams,
                });
            } else {
                router.push({
                    pathname: '/onboarding/notifications',
                    params: {
                        ...nextParams,
                        flow: 'join',
                    },
                });
            }
        } catch (error: any) {
            console.error('Erreur recherche challenge:', error);
            Alert.alert('Erreur', 'Impossible de vérifier le code. Réessaie plus tard.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* InputAccessoryView vide : supprime la toolbar "Done" native d'iOS */}
            {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID="join-code-empty">
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

                {/* Contenu principal */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>Quel est ton code d'accès ?</Text>
                    
                    {/* Input géant centré — même style que la saisie du prénom */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="000000"
                            placeholderTextColor={colors.alphaBlack10}
                            value={inviteCode}
                            onChangeText={(text) => setInviteCode(text.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                            inputAccessoryViewID="join-code-empty"
                            autoCorrect={false}
                            maxLength={6}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleContinue}
                            editable={!isLoading}
                        />
                    </View>
                </View>

                {/* Bouton "Continuer" fixé en bas. Moins de padding quand le clavier est ouvert */}
                <View style={[styles.footer, { 
                    paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 16) + 16 
                }]}>
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
    inputContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['4xl'],
        paddingVertical: spacing['2xl'],
    },
    input: {
        fontFamily: 'Rokkitt_Bold',
        fontSize: fontSize['5xl'], // 60px — input géant comme le prénom
        fontWeight: fontWeight.bold as any,
        color: colors.textPrimary,
        letterSpacing: 4, // espacement entre les caractères du code
        textAlign: 'center',
        textAlignVertical: 'center',
        width: '100%',
        backgroundColor: 'transparent',
        padding: 0,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        // paddingBottom appliqué dynamiquement avec useSafeAreaInsets (comme login)
    },
});
