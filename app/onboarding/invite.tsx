import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useProjectStore } from '../../stores/projectStore';
import { colors } from '../../utils/constants';

export default function InviteScreen() {
    const router = useRouter();
    const { project } = useProjectStore();
    const [copied, setCopied] = useState(false);
    
    // Valeurs d'animation
    const titleScale = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const cardScale = useSharedValue(0.8);
    const cardOpacity = useSharedValue(0);
    const buttonsOpacity = useSharedValue(0);
    const buttonsTranslateY = useSharedValue(30);
    
    // Lancer les animations au montage
    useEffect(() => {
        // Titre avec effet de celebration
        titleScale.value = withSequence(
            withTiming(1.2, { duration: 300 }),
            withSpring(1, { damping: 10 })
        );
        titleOpacity.value = withTiming(1, { duration: 400 });
        
        // Card du code avec bounce
        cardScale.value = withDelay(200, withSpring(1, {
            damping: 12,
            stiffness: 100,
        }));
        cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
        
        // Boutons slide up
        buttonsOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
        buttonsTranslateY.value = withDelay(500, withSpring(0, { damping: 15 }));
    }, []);
    
    // Styles animés
    const titleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: titleScale.value }],
        opacity: titleOpacity.value,
    }));
    
    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }],
        opacity: cardOpacity.value,
    }));
    
    const buttonsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: buttonsOpacity.value,
        transform: [{ translateY: buttonsTranslateY.value }],
    }));

    if (!project) {
        // Should not happen, but safe fallback
        return (
            <SafeAreaView style={styles.container}>
                <Text>Aucun projet créé.</Text>
                <Button onPress={() => router.replace('/onboarding')}>Retour</Button>
            </SafeAreaView>
        );
    }

    const handleCopy = async () => {
        await Clipboard.setStringAsync(project.invitationCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Rejoins mon projet de lecture sur Bestie Book Battle avec le code : ${project.invitationCode}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleStart = () => {
        // Go to main app
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Animated.View style={[styles.textContainer, titleAnimatedStyle]}>
                    <Text variant="headlineMedium" style={styles.title}>C'est tout bon ! 🎉</Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        Ton projet "{project.bookTitle}" est créé. Invite tes amis à te rejoindre !
                    </Text>
                </Animated.View>

                <Animated.View style={cardAnimatedStyle}>
                    <Surface style={styles.codeCard} elevation={2}>
                        <Text style={styles.codeLabel}>Ton code d'invitation</Text>
                        <TouchableOpacity onPress={handleCopy} style={styles.codeContainer}>
                            <Text style={styles.codeText}>{project.invitationCode}</Text>
                            <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={24} color={copied ? colors.success : colors.primary} />
                        </TouchableOpacity>
                        {copied && <Text style={styles.copiedText}>Copié !</Text>}
                    </Surface>
                </Animated.View>

                <Animated.View style={[styles.actions, buttonsAnimatedStyle]}>
                    <Button
                        mode="outlined"
                        onPress={handleShare}
                        icon="share-variant"
                        style={styles.actionButton}
                        contentStyle={styles.actionContent}
                    >
                        Partager le code
                    </Button>

                    <Button
                        mode="contained"
                        onPress={handleStart}
                        style={styles.mainButton}
                        contentStyle={styles.mainContent}
                        icon="book-open"
                    >
                        Commencer la lecture
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
        padding: 24,
        justifyContent: 'center',
        gap: 40,
    },
    textContainer: {
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        color: colors.textSecondary,
        lineHeight: 24,
    },
    codeCard: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: colors.surface,
        alignItems: 'center',
        gap: 16,
    },
    codeLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.primaryLight + '40', // 40 is opacity hex
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    codeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
        letterSpacing: 2,
    },
    copiedText: {
        color: colors.success,
        fontWeight: 'bold',
    },
    actions: {
        gap: 16,
        width: '100%',
    },
    actionButton: {
        borderRadius: 12,
        borderColor: colors.primary,
    },
    actionContent: {
        paddingVertical: 6,
    },
    mainButton: {
        borderRadius: 12,
    },
    mainContent: {
        paddingVertical: 8,
    },
});
