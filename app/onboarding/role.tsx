/**
 * Écran 2 de l'onboarding : Choix du rôle
 * 
 * L'utilisateur choisit entre :
 * - Créer un bbb (nouveau challenge)
 * - Rejoindre un bbb (challenge existant avec code)
 * 
 * Ce choix détermine la branche du flow d'onboarding.
 * Animation de sélection avec react-native-reanimated.
 */

import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors, fontSize, fontWeight, spacing, buttonStyles, borderRadius, shadows } from '../../utils/constants';
import Button3D from '../../components/Button3D';

// Asset : texture de fond
const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

// Images des rôles (active/disabled pour chaque)
const ROLE_IMAGES = {
    create: {
        active: require('../../assets/images/role-create-active.png'),
        disabled: require('../../assets/images/role-create-disabled.png'),
    },
    join: {
        active: require('../../assets/images/role-join-active.png'),
        disabled: require('../../assets/images/role-join-disabled.png'),
    },
};

type RoleType = 'create' | 'join';

export default function OnboardingRoleScreen() {
    const router = useRouter();
    const { firstName } = useLocalSearchParams<{ firstName: string }>();
    
    // Rôle sélectionné (par défaut "create")
    const [selectedRole, setSelectedRole] = useState<RoleType>('create');

    // Valeurs animées pour la sélection (0 = create, 1 = join)
    const selectionProgress = useSharedValue(0);

    const handleSelectRole = (role: RoleType) => {
        setSelectedRole(role);
        selectionProgress.value = withSpring(role === 'create' ? 0 : 1, {
            damping: 15,
            stiffness: 120,
        });
    };

    // Animation carte "Créer" : scale + border + shadow
    const createCardStyle = useAnimatedStyle(() => {
        const scale = interpolate(selectionProgress.value, [0, 1], [1, 0.97]);
        const borderWidth = interpolate(selectionProgress.value, [0, 1], [2, 1]);
        const opacity = interpolate(selectionProgress.value, [0, 1], [1, 0.7]);
        return {
            transform: [{ scale }],
            borderWidth,
            opacity,
        };
    });

    // Animation carte "Rejoindre" : scale + border + shadow
    const joinCardStyle = useAnimatedStyle(() => {
        const scale = interpolate(selectionProgress.value, [0, 1], [0.97, 1]);
        const borderWidth = interpolate(selectionProgress.value, [0, 1], [1, 2]);
        const opacity = interpolate(selectionProgress.value, [0, 1], [0.7, 1]);
        return {
            transform: [{ scale }],
            borderWidth,
            opacity,
        };
    });

    const handleContinue = () => {
        if (selectedRole === 'create') {
            router.push({
                pathname: '/onboarding/create',
                params: { firstName },
            });
        } else {
            router.push({
                pathname: '/onboarding/join',
                params: { firstName },
            });
        }
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

                {/* Contenu principal */}
                <View style={styles.mainContent}>
                    <Text style={styles.title}>
                        {firstName}, quel est ton rôle ?
                    </Text>
                    
                    {/* Deux cartes de sélection animées */}
                    <View style={styles.cardsContainer}>
                        {/* Carte "Créer un bbb" */}
                        <Pressable onPress={() => handleSelectRole('create')}>
                            <Animated.View style={[
                                styles.card,
                                selectedRole === 'create' ? styles.cardSelected : styles.cardInactive,
                                createCardStyle,
                            ]}>
                                <Image
                                    source={selectedRole === 'create' 
                                        ? ROLE_IMAGES.create.active 
                                        : ROLE_IMAGES.create.disabled}
                                    style={styles.cardIllustration}
                                    contentFit="contain"
                                />
                                
                                <View style={styles.cardTextContent}>
                                    <Text style={[
                                        styles.cardTitle,
                                        selectedRole !== 'create' && styles.cardTitleInactive,
                                    ]}>
                                        Créer un bbb
                                    </Text>
                                    <Text style={[
                                        styles.cardDescription,
                                        selectedRole !== 'create' && styles.cardDescriptionInactive,
                                    ]}>
                                        Choisis le livre à lire en lecture commune avec un.e/des ami.e.s
                                    </Text>
                                </View>
                            </Animated.View>
                        </Pressable>

                        {/* Carte "Rejoindre un bbb" */}
                        <Pressable onPress={() => handleSelectRole('join')}>
                            <Animated.View style={[
                                styles.card,
                                selectedRole === 'join' ? styles.cardSelected : styles.cardInactive,
                                joinCardStyle,
                            ]}>
                                <Image
                                    source={selectedRole === 'join' 
                                        ? ROLE_IMAGES.join.active 
                                        : ROLE_IMAGES.join.disabled}
                                    style={styles.cardIllustration}
                                    contentFit="contain"
                                />
                                
                                <View style={styles.cardTextContent}>
                                    <Text style={[
                                        styles.cardTitle,
                                        selectedRole !== 'join' && styles.cardTitleInactive,
                                    ]}>
                                        Rejoindre un bbb
                                    </Text>
                                    <Text style={[
                                        styles.cardDescription,
                                        selectedRole !== 'join' && styles.cardDescriptionInactive,
                                    ]}>
                                        Tu veux rejoindre une lecture commune créée par un.e ami.e
                                    </Text>
                                </View>
                            </Animated.View>
                        </Pressable>
                    </View>
                </View>

                {/* Bouton "Continuer" fixé en bas */}
                <View style={styles.footer}>
                    <Button3D
                        onPress={handleContinue}
                        variant="primary"
                        style={{ width: '100%' }}
                    >
                        Continuer
                    </Button3D>
                </View>
            </View>
        </SafeAreaView>
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
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.sm,
        paddingTop: spacing['3xl'],
        gap: spacing['4xl'], // 48px entre titre et cartes
    },
    title: {
        fontFamily: 'Rokkitt_Medium',
        fontSize: fontSize['3xl'], // 36px
        fontWeight: fontWeight.medium as any,
        color: colors.textPrimary,
        letterSpacing: -0.72,
        lineHeight: 44,
    },
    cardsContainer: {
        gap: spacing.lg, // 16px entre les deux cartes
    },
    card: {
        flexDirection: 'row',
        gap: spacing.md, // 12px
        padding: spacing.md, // 12px
        borderRadius: borderRadius.xl, // 24px
        alignItems: 'center',
    },
    cardSelected: {
        backgroundColor: colors.white,
        borderColor: colors.dark900,
        ...shadows.cardSelected,
    },
    cardInactive: {
        backgroundColor: colors.bgSecondary, // #fafafa
        borderColor: colors.alphaBlack10,
    },
    cardIllustration: {
        width: 70,
        height: 70,
    },
    cardTextContent: {
        flex: 1,
        gap: spacing.xs, // 4px
    },
    cardTitle: {
        fontFamily: 'Rokkitt_Bold',
        fontSize: fontSize['2xl'], // 24px
        fontWeight: fontWeight.bold as any,
        color: colors.textPrimary,
        lineHeight: 32,
    },
    cardTitleInactive: {
        color: colors.textPlaceholder,
    },
    cardDescription: {
        fontFamily: 'WorkSans_Medium',
        fontSize: fontSize.sm, // 14px
        fontWeight: fontWeight.medium as any,
        color: colors.textTertiary,
        lineHeight: 20,
    },
    cardDescriptionInactive: {
        color: colors.textPlaceholder,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing['6xl'],
    },
});
