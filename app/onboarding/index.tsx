import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { colors } from '../../utils/constants';

export default function OnboardingIndex() {
    const router = useRouter();

    // Valeurs d'animation
    const logoScale = useSharedValue(0);
    const logoRotate = useSharedValue(-10);
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(20);
    const buttonsOpacity = useSharedValue(0);
    const buttonsTranslateY = useSharedValue(30);

    // Lancer les animations au montage du composant
    useEffect(() => {
        // Animation du logo : apparition avec bounce
        logoScale.value = withSpring(1, {
            damping: 12,
            stiffness: 100,
        });
        
        // Petit effet de rotation pour le logo
        logoRotate.value = withSequence(
            withTiming(10, { duration: 400 }),
            withSpring(0, { damping: 10 })
        );

        // Animation du titre : fade in + slide up (avec délai)
        titleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
        titleTranslateY.value = withDelay(200, withSpring(0, { damping: 15 }));

        // Animation des boutons : fade in + slide up (avec plus de délai)
        buttonsOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
        buttonsTranslateY.value = withDelay(500, withSpring(0, { damping: 15 }));
    }, []);

    // Styles animés pour le logo
    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: logoScale.value },
            { rotate: `${logoRotate.value}deg` },
        ],
    }));

    // Styles animés pour le titre
    const titleAnimatedStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleTranslateY.value }],
    }));

    // Styles animés pour les boutons
    const buttonsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: buttonsOpacity.value,
        transform: [{ translateY: buttonsTranslateY.value }],
    }));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Animated.View style={logoAnimatedStyle}>
                        <Image
                            source={require('../../assets/images/icon.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>
                    <Animated.View style={titleAnimatedStyle}>
                        <Text variant="headlineLarge" style={styles.appName}>Bestie Book Battle</Text>
                        <Text variant="bodyMedium" style={styles.tagline}>
                            Lisez ensemble, progressez ensemble
                        </Text>
                    </Animated.View>
                </View>

                <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle]}>
                    <Button
                        mode="contained"
                        onPress={() => router.push('/onboarding/create')}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        icon="book-plus"
                    >
                        Créer un projet
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={() => { }} // TODO: Implement join
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        icon="account-multiple-plus"
                    >
                        Rejoindre un projet
                    </Button>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
        paddingVertical: 48,
    },
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    logo: {
        width: 140,
        height: 140,
        borderRadius: 28,
        // Ombre pour le logo
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    appName: {
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
    },
    tagline: {
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    buttonsContainer: {
        gap: 16,
        width: '100%',
    },
    button: {
        borderRadius: 12,
        // Ombre légère pour les boutons
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonContent: {
        paddingVertical: 8,
    },
});
