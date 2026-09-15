import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChallengeByInviteCode } from '../../services/supabase/database';
import { Challenge } from '../../types/supabase';
import { colors, fonts } from '../../utils/constants';
import { ArrowRightIcon, CopyIcon, ShareIcon } from 'lucide-react-native';

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
                <ActivityIndicator size="large" color={colors.dark900} />
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
                        <CopyIcon size={24} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <Text style={styles.codeHint}>Partage ce code avec tes amis</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={shareProject}>
                        <ShareIcon size={20} color={colors.dark900} style={{ marginRight: 8 }} />
                        <Text style={styles.secondaryButtonText}>Partager</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={startReading}>
                        <Text style={styles.primaryButtonText}>Commencer la lecture</Text>
                        <ArrowRightIcon size={20} color={colors.white} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgLight,
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
        fontFamily: fonts.display,
        fontSize: 28,
        color: colors.textPrimary,
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
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    bookTitle: {
        fontFamily: fonts.display,
        fontSize: 20,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    bookAuthor: {
        fontFamily: fonts.body,
        fontSize: 16,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    codeContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    codeLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 12,
        color: colors.textPlaceholder,
        marginBottom: 8,
        letterSpacing: 1,
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        gap: 12,
    },
    codeText: {
        fontSize: 30,
        fontFamily: fonts.display,
        color: colors.textPrimary,
        letterSpacing: 2,
    },
    codeHint: {
        fontFamily: fonts.body,
        fontSize: 14,
        color: colors.textPlaceholder,
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
        backgroundColor: colors.textPrimary,
    },
    primaryButtonText: {
        fontFamily: fonts.bodyBold,
        color: colors.white,
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: colors.bgSecondary,
    },
    secondaryButtonText: {
        fontFamily: fonts.bodyBold,
        color: colors.textPrimary,
        fontSize: 16,
    },
});
