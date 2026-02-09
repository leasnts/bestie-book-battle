import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { colors } from '../../utils/constants';

export default function InviteScreen() {
    const router = useRouter();
    
    // On récupère les données passées en paramètres de route depuis create.tsx
    // code = le code d'invitation généré par Supabase
    // bookTitle = le titre du livre
    // coverUrl = l'URL de la cover (Supabase Storage ou URI locale en fallback)
    const { code, bookTitle, coverUrl } = useLocalSearchParams<{ 
        code: string; 
        challengeId: string; 
        bookTitle: string;
        coverUrl: string;
    }>();
    
    const [copied, setCopied] = useState(false);
    
    // Valeurs d'animation
    const coverScale = useSharedValue(0.5);
    const coverOpacity = useSharedValue(0);
    const titleScale = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const cardScale = useSharedValue(0.8);
    const cardOpacity = useSharedValue(0);
    const buttonsOpacity = useSharedValue(0);
    const buttonsTranslateY = useSharedValue(30);
    
    // Lancer les animations au montage
    useEffect(() => {
        // Cover apparait en premier avec un bounce
        coverScale.value = withSpring(1, { damping: 12, stiffness: 100 });
        coverOpacity.value = withTiming(1, { duration: 400 });
        
        // Titre avec effet de celebration (léger délai)
        titleScale.value = withDelay(150, withSequence(
            withTiming(1.2, { duration: 300 }),
            withSpring(1, { damping: 10 })
        ));
        titleOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
        
        // Card du code avec bounce
        cardScale.value = withDelay(350, withSpring(1, {
            damping: 12,
            stiffness: 100,
        }));
        cardOpacity.value = withDelay(350, withTiming(1, { duration: 400 }));
        
        // Boutons slide up
        buttonsOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
        buttonsTranslateY.value = withDelay(600, withSpring(0, { damping: 15 }));
    }, []);
    
    // Styles animés
    const coverAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: coverScale.value }],
        opacity: coverOpacity.value,
    }));
    
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

    // Si les paramètres ne sont pas disponibles (ne devrait pas arriver)
    if (!code) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Aucun projet créé.</Text>
                <Button onPress={() => router.replace('/onboarding')}>Retour</Button>
            </SafeAreaView>
        );
    }

    const handleCopy = async () => {
        // On copie le code d'invitation dans le presse-papier
        await Clipboard.setStringAsync(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Rejoins mon projet de lecture sur Bestie Book Battle avec le code : ${code}`,
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
                {/* Cover du livre avec animation bounce */}
                {coverUrl ? (
                    <Animated.View style={[styles.coverContainer, coverAnimatedStyle]}>
                        <Image
                            source={{ uri: coverUrl }}
                            style={styles.coverImage}
                            contentFit="cover"
                            transition={200}
                            // Le cache garde l'image en mémoire + sur le disque
                            // La prochaine fois qu'on affiche cette URL, c'est instantané
                            cachePolicy="memory-disk"
                            // Couleur de fond affichée pendant le chargement
                            // pour éviter un "flash" blanc
                            placeholderContentFit="cover"
                            placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
                        />
                    </Animated.View>
                ) : null}

                <Animated.View style={[styles.textContainer, titleAnimatedStyle]}>
                    <Text variant="headlineMedium" style={styles.title}>C'est tout bon ! 🎉</Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        Ton projet "{bookTitle}" est créé. Invite tes amis à te rejoindre !
                    </Text>
                </Animated.View>

                <Animated.View style={cardAnimatedStyle}>
                    <Surface style={styles.codeCard} elevation={2}>
                        <Text style={styles.codeLabel}>Ton code d'invitation</Text>
                        <TouchableOpacity onPress={handleCopy} style={styles.codeContainer}>
                            <Text style={styles.codeText}>{code}</Text>
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
        alignItems: 'center',
        gap: 28,
    },
    coverContainer: {
        width: 120,
        height: 120,
        borderRadius: 20,
        overflow: 'hidden',
        // Ombre pour donner de la profondeur à la cover
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    coverImage: {
        width: '100%',
        height: '100%',
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
