import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { useProjectStore } from '../../stores/projectStore';
import { colors } from '../../utils/constants';

export default function CreateProjectScreen() {
    const router = useRouter();
    const { createProject } = useProjectStore();

    const [bookTitle, setBookTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [totalPages, setTotalPages] = useState('');
    const [coverUri, setCoverUri] = useState<string | null>(null);
    
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

    const handleCreate = () => {
        // Validation
        const newErrors = {
            bookTitle: !bookTitle.trim(),
            author: !author.trim(),
            totalPages: !totalPages.trim() || isNaN(Number(totalPages)),
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some(v => v)) {
            return;
        }

        try {
            createProject({
                bookTitle,
                bookAuthor: author,
                totalPages: Number(totalPages),
                coverUri: coverUri || undefined,
            });

            router.push('/onboarding/invite');
        } catch (error) {
            console.error('Erreur création projet:', error);
            // On continue quand même sans bloquer
            router.push('/onboarding/invite');
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
                    >
                        Créer le projet
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
