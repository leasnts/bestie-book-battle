import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChallengeByInviteCode } from '../../services/supabase/database';
import { Challenge } from '../../types/supabase';

export default function InviteScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { code, challengeId } = params;

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChallenge = async () => {
            if (!code) return;
            try {
                const challengeData = await getChallengeByInviteCode(code as string);
                if (challengeData) {
                    setChallenge(challengeData);
                } else {
                    Alert.alert('Erreur', 'Challenge introuvable');
                }
            } catch (error) {
                console.error('Erreur lors de la récupération du challenge:', error);
                Alert.alert('Erreur', 'Impossible de charger le challenge');
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, [code]);

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(code as string);
        Alert.alert('Copié !', 'Le code du projet a été copié dans le presse-papier.');
    };

    const shareProject = async () => {
        if (!challenge) return;
        try {
            const deepLink = challenge.invite_url || `bestiebookbattle://join/${code}`;
            const message = `Rejoins-moi pour lire ${challenge.book_title} ! Code : ${code}\n\n${deepLink}`;
            await Share.share({
                message,
                url: deepLink,
            });
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de partager le challenge');
        }
    };

    const startReading = () => {
        // Redirige vers MainApp (Tabs)
        router.replace('/(tabs)');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.content}>
                <Text style={styles.title}>Ton challenge est créé ! 🎉</Text>

                {challenge && (
                    <View style={styles.coverContainer}>
                        {challenge.cover_url && (
                            <Image
                                source={{ uri: challenge.cover_url }}
                                style={styles.coverImage}
                                contentFit="cover"
                                transition={500}
                            />
                        )}
                        <Text style={styles.bookTitle}>{challenge.book_title}</Text>
                        {challenge.book_author && (
                            <Text style={styles.bookAuthor}>{challenge.book_author}</Text>
                        )}
                    </View>
                )}

                <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>TON CODE DE CHALLENGE</Text>
                    <TouchableOpacity style={styles.codeBox} onPress={copyToClipboard}>
                        <Text style={styles.codeText}>{code}</Text>
                        <Ionicons name="copy-outline" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.codeHint}>Partage ce code avec tes amis</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={shareProject}>
                        <Ionicons name="share-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                        <Text style={styles.secondaryButtonText}>Partager</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={startReading}>
                        <Text style={styles.primaryButtonText}>Commencer la lecture</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAF8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginTop: 20,
        textAlign: 'center',
    },
    coverContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    coverImage: {
        width: 140,
        height: 140,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    bookTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    codeContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    codeLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        marginBottom: 8,
        letterSpacing: 1,
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8E8E4',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        gap: 12,
    },
    codeText: {
        fontSize: 32,
        fontWeight: '700',
        fontFamily: 'Courier New',
        color: '#1A1A1A',
        letterSpacing: 2,
    },
    codeHint: {
        fontSize: 14,
        color: '#999',
        marginTop: 12,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    button: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#1A1A1A',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#F0F0EE',
    },
    secondaryButtonText: {
        color: '#1A1A1A',
        fontSize: 16,
        fontWeight: '600',
    },
});
