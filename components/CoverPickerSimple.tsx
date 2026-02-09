import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

// On garde seulement 3 random covers pour avoir une grille 2x2 (3 random + 1 import)
const RANDOM_COVERS = [
    require('../assets/images/random_cover_1.png'),
    require('../assets/images/random_cover_2.png'),
    require('../assets/images/random_cover_3.png'),
];

interface CoverPickerSimpleProps {
    onCoverSelected: (uri: string) => void;
    initialCover?: string;
}

export default function CoverPickerSimple({ onCoverSelected, initialCover }: CoverPickerSimpleProps) {
    const [selectedIndex, setSelectedIndex] = useState(initialCover ? 0 : 1); // Par défaut, sélectionne la première random cover
    const [customCover, setCustomCover] = useState<string | null>(initialCover || null);

    // Initialiser avec une cover par défaut au montage
    useEffect(() => {
        if (!initialCover) {
            // Sélectionner la première random cover par défaut
            const defaultCover = RANDOM_COVERS[0];
            const assetSource = Image.resolveAssetSource(defaultCover);
            if (assetSource && assetSource.uri) {
                onCoverSelected(assetSource.uri);
            }
        }
    }, []);

    const pickImage = async () => {
        if (Platform.OS === 'web') {
            Alert.alert('Info', 'L\'upload de photo fonctionne mieux sur l\'app mobile');
            return;
        }

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [7, 10],
            quality: 1,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setCustomCover(uri);
            setSelectedIndex(0);
            onCoverSelected(uri);
        }
    };

    const selectCover = (index: number) => {
        setSelectedIndex(index);
        if (index === 0) {
            if (customCover) {
                onCoverSelected(customCover);
            } else {
                // Si pas de cover personnalisée, utiliser la première random cover par défaut
                const defaultCover = RANDOM_COVERS[0];
                const assetSource = Image.resolveAssetSource(defaultCover);
                if (assetSource && assetSource.uri) {
                    onCoverSelected(assetSource.uri);
                }
            }
        } else {
            const assetSource = Image.resolveAssetSource(RANDOM_COVERS[index - 1]);
            if (assetSource && assetSource.uri) {
                onCoverSelected(assetSource.uri);
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Choisir une couverture</Text>
            
            <View style={styles.grid}>
                {/* Custom Cover Card */}
                <Pressable
                    style={[
                        styles.card,
                        selectedIndex === 0 && styles.cardSelected
                    ]}
                    onPress={() => {
                        if (customCover) {
                            selectCover(0);
                        } else {
                            pickImage();
                        }
                    }}
                >
                    {customCover ? (
                        <>
                            <Image source={{ uri: customCover }} style={styles.coverImage} contentFit="cover" />
                            <View style={styles.editBadge}>
                                <Ionicons name="pencil" size={16} color="white" />
                            </View>
                        </>
                    ) : (
                        <View style={styles.uploadCard}>
                            <Ionicons name="add-circle-outline" size={40} color="#666" />
                            <Text style={styles.uploadText}>Importer</Text>
                        </View>
                    )}
                    {selectedIndex === 0 && (
                        <View style={styles.checkmark}>
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                        </View>
                    )}
                </Pressable>

                {/* Random Covers */}
                {RANDOM_COVERS.map((source, i) => (
                    <Pressable
                        key={i}
                        style={[
                            styles.card,
                            selectedIndex === i + 1 && styles.cardSelected
                        ]}
                        onPress={() => selectCover(i + 1)}
                    >
                        <Image source={source} style={styles.coverImage} contentFit="cover" />
                        {selectedIndex === i + 1 && (
                            <View style={styles.checkmark}>
                                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                            </View>
                        )}
                    </Pressable>
                ))}
            </View>

            <Text style={styles.hint}>
                {selectedIndex === -1 ? 'Sélectionne une couverture' : '✓ Couverture sélectionnée'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        gap: 12,
        justifyContent: 'space-between',
    },
    card: {
        // Calcul pour avoir 2 cards par ligne avec un gap de 12px
        // (100% - gap) / 2 = environ 48%
        width: '48%',
        // Format carré au lieu de rectangulaire
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: '#4CAF50',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    uploadCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    uploadText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    editBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    hint: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
});
