/**
 * Écran 1 de l'onboarding : Saisie du prénom
 * 
 * Premier écran après le sign-in Apple pour les nouveaux utilisateurs.
 * Input géant centré en Rokkitt Bold 60px pour saisir le prénom.
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
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

// Asset : texture de fond
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function OnboardingNameScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
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
     * Passer à l'écran suivant (choix du rôle)
     * Le prénom est passé en paramètre de route pour être utilisé
     * dans les écrans suivants et finalement sauvegardé dans le profil
     */
    const handleContinue = () => {
        if (!firstName.trim()) return;
        
        router.push({
            pathname: '/onboarding/role',
            params: { firstName: firstName.trim() },
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

                {/* Bouton retour désactivé : pas de page précédente (premier écran après sign-in) */}
                <View style={styles.header}>
                    <Button3D
                        variant="secondary"
                        icon="chevron-back"
                        iconOnly
                        size="compact"
                        disabled
                        onPress={() => router.back()}
                    />
                </View>

                {/* Contenu principal : titre + input */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>Comment tu t'appelles ?</Text>
                    
                    {/* Input géant centré */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Prénom"
                            placeholderTextColor={colors.alphaBlack10}
                            value={firstName}
                            onChangeText={setFirstName}
                            autoCapitalize="words"
                            autoFocus
                            returnKeyType="next"
                            onSubmitEditing={handleContinue}
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
                        disabled={!firstName.trim()}
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
        fontSize: fontSize['3xl'], // 36px
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    inputContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['4xl'], // 48px
        paddingVertical: spacing['2xl'], // 24px
    },
    input: {
        fontFamily: 'Rokkitt_Bold',
        fontSize: fontSize['5xl'], // 60px pour l'input géant
        fontWeight: fontWeight.bold as any,
        color: colors.textPrimary,
        letterSpacing: -1.2,
        textAlign: 'center',
        textAlignVertical: 'center', // Centre vertical sur Android
        width: '100%',
        // Pas de border, juste le texte
        backgroundColor: 'transparent',
        padding: 0,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        // paddingBottom appliqué dynamiquement avec useSafeAreaInsets (comme login)
    },
});
