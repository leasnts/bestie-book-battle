import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import CoverPicker3D from '../../components/CoverPicker3D';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { uploadBookCover } from '../../services/supabase/storage';
import { updateChallenge } from '../../services/supabase/database';
import { colors } from '../../utils/constants';

export default function CreateProjectScreen() {
    const router = useRouter();
    
    // On récupère l'utilisateur connecté depuis le authStore
    // Son ID est nécessaire pour être défini comme admin du challenge (admin_id)
    // C'est ce qui permet à la politique RLS de vérifier que auth.uid() = admin_id
    const user = useAuthStore((state) => state.user);
    
    // On utilise createChallenge (et non createProject qui n'existe plus)
    const createChallenge = useProjectStore((state) => state.createChallenge);

    const [bookTitle, setBookTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [totalPages, setTotalPages] = useState('');
    const [coverUri, setCoverUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Valeurs d'animation
    const headerOpacity = useSharedValue(0);
    const coverOpacity = useSharedValue(0);
    const coverTranslateY = useSharedValue(30);
    const formOpacity = useSharedValue(0);
    const formTranslateY = useSharedValue(40);
    const buttonOpacity = useSharedValue(0);
    
    // Lancer les animations au montage
    useEffect(() => {
        // Header fade in
        headerOpacity.value = withTiming(1, { duration: 400 });
        
        // Cover picker slide up + fade in
        coverOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
        coverTranslateY.value = withDelay(100, withSpring(0, { damping: 15 }));
        
        // Form slide up + fade in
        formOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
        formTranslateY.value = withDelay(300, withSpring(0, { damping: 15 }));
        
        // Button fade in
        buttonOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    }, []);
    
    // Styles animés
    const headerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
    }));
    
    const coverAnimatedStyle = useAnimatedStyle(() => ({
        opacity: coverOpacity.value,
        transform: [{ translateY: coverTranslateY.value }],
    }));
    
    const formAnimatedStyle = useAnimatedStyle(() => ({
        opacity: formOpacity.value,
        transform: [{ translateY: formTranslateY.value }],
    }));
    
    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        opacity: buttonOpacity.value,
    }));

    const [errors, setErrors] = useState({
        bookTitle: false,
        author: false,
        totalPages: false,
    });

    const handleCreate = async () => {
        // Validation des champs du formulaire
        const newErrors = {
            bookTitle: !bookTitle.trim(),
            author: !author.trim(),
            totalPages: !totalPages.trim() || isNaN(Number(totalPages)),
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some(v => v)) {
            return;
        }

        // Vérifier que l'utilisateur est bien connecté
        // Sans user.id, la politique RLS de Supabase rejettera l'insertion
        if (!user) {
            Alert.alert('Erreur', 'Utilisateur non identifié. Veuillez vous reconnecter.');
            router.replace('/auth/login');
            return;
        }

        setLoading(true);
        try {
            // 1. Créer le challenge dans Supabase
            // On passe user.id comme admin_id — c'est ce qui satisfait la politique RLS :
            // WITH CHECK (auth.uid() = admin_id)
            const challenge = await createChallenge(
                user.id,           // userId : l'ID de l'utilisateur connecté
                bookTitle,         // titre du livre
                author || undefined, // auteur (optionnel)
                Number(totalPages),  // nombre total de pages
                undefined,         // coverUrl : on l'uploade après
                undefined          // targetEndDate : pas défini pour l'instant
            );

            // 2. Upload de la cover si l'utilisateur en a sélectionné une
            // On le fait APRÈS la création du challenge car on a besoin de l'ID
            // du challenge pour stocker le fichier dans le bon dossier Supabase Storage
            let finalCoverUrl: string | undefined;
            if (coverUri) {
                try {
                    const { url } = await uploadBookCover(challenge.id, coverUri);
                    // Sauvegarder l'URL permanente dans la base de données
                    await updateChallenge(challenge.id, { cover_url: url });
                    finalCoverUrl = url;
                    console.log('Cover sauvegardée avec succès:', url);
                } catch (coverError: any) {
                    // Rendre l'erreur VISIBLE pour pouvoir la debugger
                    console.error('Échec upload cover:', coverError);
                    Alert.alert(
                        'Cover non sauvegardée',
                        `L'image n'a pas pu être uploadée : ${coverError.message || coverError}. Le projet a été créé sans cover.`
                    );
                    // On continue sans cover -- le projet existe quand même
                }
            }

            // 3. Naviguer vers l'écran d'invitation
            // On passe le code d'invitation, le titre et la cover en paramètres de route
            router.push({
                pathname: '/onboarding/invite',
                params: {
                    code: challenge.invite_code,
                    challengeId: challenge.id,
                    bookTitle: challenge.book_title,
                    coverUrl: finalCoverUrl || '',
                },
            });
        } catch (error: any) {
            console.error('Erreur lors de la création du challenge:', error);
            Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la création.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.content}
                style={{ overflow: 'visible' }} // Permet aux ombres de sortir
            >
                <Animated.View style={[styles.header, headerAnimatedStyle]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text variant="headlineMedium" style={styles.title}>Créer un projet</Text>
                </Animated.View>

                {/* Cover Picker 3D Component */}
                <Animated.View style={[styles.coverPickerContainer, coverAnimatedStyle]}>
                    <CoverPicker3D
                        onCoverSelected={(uri) => setCoverUri(uri)}
                        initialCover={coverUri || undefined}
                    />
                </Animated.View>

                <Animated.View style={[styles.form, formAnimatedStyle]}>
                    {/* Form Fields */}
                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Titre du livre"
                            value={bookTitle}
                            onChangeText={(t) => {
                                setBookTitle(t);
                                setErrors(prev => ({ ...prev, bookTitle: false }));
                            }}
                            mode="outlined"
                            error={errors.bookTitle}
                        />
                        {errors.bookTitle && <HelperText type="error">Le titre est requis.</HelperText>}
                    </View>

                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Auteur"
                            value={author}
                            onChangeText={(t) => {
                                setAuthor(t);
                                setErrors(prev => ({ ...prev, author: false }));
                            }}
                            mode="outlined"
                            error={errors.author}
                        />
                        {errors.author && <HelperText type="error">L'auteur est requis.</HelperText>}
                    </View>

                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Nombre de pages"
                            value={totalPages}
                            onChangeText={(t) => {
                                setTotalPages(t.replace(/[^0-9]/g, ''));
                                setErrors(prev => ({ ...prev, totalPages: false }));
                            }}
                            mode="outlined"
                            keyboardType="number-pad"
                            error={errors.totalPages}
                        />
                        {errors.totalPages && <HelperText type="error">Nombre de pages invalide.</HelperText>}
                    </View>
                </Animated.View>

                <Animated.View style={buttonAnimatedStyle}>
                    <Button
                        mode="contained"
                        onPress={handleCreate}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        icon="check"
                        loading={loading}
                        disabled={loading}
                    >
                        {loading ? 'Création...' : 'Créer le projet'}
                    </Button>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 24,
        gap: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 8,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontWeight: 'bold',
        color: colors.text,
    },
    coverPickerContainer: {
        marginBottom: 16,
        overflow: 'visible', // Permet à l'ombre du CoverPicker de sortir
    },
    form: {
        gap: 16,
        paddingTop: 16,
    },
    inputGroup: {
        marginBottom: 4,
    },
    button: {
        marginTop: 16,
        borderRadius: 12,
    },
    buttonContent: {
        paddingVertical: 8,
    },
});
