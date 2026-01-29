import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image as RNImage, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Taille des cards et espacement - Réduites pour voir la card suivante
const CARD_SIZE = 160;
const SPACING = 12; // Réduit pour voir la cover à droite
const SNAP_INTERVAL = CARD_SIZE + SPACING;
// Pas de padding à gauche pour coller au bord
const SPACER_WIDTH = 0;

// 3 random covers comme demandé
const RANDOM_COVERS = [
    require('../assets/images/random_cover_1.png'),
    require('../assets/images/random_cover_2.png'),
    require('../assets/images/random_cover_3.png'),
];

interface CoverPickerProps {
    onCoverSelected: (uri: string) => void;
    initialCover?: string;
}

export default function CoverPicker({ onCoverSelected, initialCover }: CoverPickerProps) {
    const [customCover, setCustomCover] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(1); // Commence sur la première random cover
    const [selectedIndex, setSelectedIndex] = useState(1); // Première random cover sélectionnée par défaut
    const scrollX = useSharedValue(SNAP_INTERVAL); // Position initiale sur la première random cover
    const scrollViewRef = useRef<Animated.ScrollView>(null);

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
        onMomentumEnd: (event) => {
            const index = Math.round(event.contentOffset.x / SNAP_INTERVAL);
            if (index !== activeIndex) {
                runOnJS(setActiveIndex)(index);
                runOnJS(setSelectedIndex)(index); // Sélectionner automatiquement au scroll
                // Haptics avec gestion d'erreur (uniquement sur mobile)
                if (Platform.OS !== 'web') {
                    try {
                        runOnJS(Haptics.selectionAsync)();
                    } catch (error) {
                        // Ignore
                    }
                }
            }
        }
    });

    // Fonction pour sélectionner une cover en cliquant
    const selectCover = (index: number) => {
        setSelectedIndex(index);
        setActiveIndex(index);
        // Scroller vers cette cover
        scrollViewRef.current?.scrollTo({ x: index * SNAP_INTERVAL, animated: true });
        // Haptics (uniquement sur mobile)
        if (Platform.OS !== 'web') {
            try {
                Haptics.selectionAsync();
            } catch (error) {
                // Ignore
            }
        }
    };

    // Initialiser avec la première random cover par défaut
    useEffect(() => {
        const defaultCover = RANDOM_COVERS[0];
        const assetSource = RNImage.resolveAssetSource(defaultCover);
        if (assetSource && assetSource.uri) {
            onCoverSelected(assetSource.uri);
        }
        // Scroller vers la première random cover (index 1)
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ x: SNAP_INTERVAL, animated: false });
        }, 100);
    }, []);

    // Gérer la sélection quand l'index sélectionné change
    useEffect(() => {
        if (selectedIndex === 0) {
            // Card d'import
            if (customCover) {
                onCoverSelected(customCover);
            } else {
                // Si pas de cover personnalisée, utiliser la première random cover par défaut
                const defaultCover = RANDOM_COVERS[0];
                const assetSource = RNImage.resolveAssetSource(defaultCover);
                if (assetSource && assetSource.uri) {
                    onCoverSelected(assetSource.uri);
                }
            }
        } else if (selectedIndex >= 1 && selectedIndex <= 3) {
            // Random covers (indices 1-3 correspondent à RANDOM_COVERS 0-2)
            const coverAsset = RANDOM_COVERS[selectedIndex - 1];
            const assetSource = RNImage.resolveAssetSource(coverAsset);
            if (assetSource && assetSource.uri) {
                onCoverSelected(assetSource.uri);
            }
        }
    }, [selectedIndex, customCover]);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Format carré
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setCustomCover(uri);
            onCoverSelected(uri);
            // Sélectionner automatiquement la cover importée
            selectCover(0);
        }
    };

    // Composant Card avec animation
    const Card = ({ index, children }: { index: number; children: React.ReactNode }) => {
        const animatedStyle = useAnimatedStyle(() => {
            const inputRange = [
                (index - 1) * SNAP_INTERVAL,
                index * SNAP_INTERVAL,
                (index + 1) * SNAP_INTERVAL,
            ];

            // Scale: la card centrale est légèrement plus grande
            const scale = interpolate(
                scrollX.value,
                inputRange,
                [0.88, 1.02, 0.88],
                'clamp'
            );

            // Opacité: la card centrale est plus visible
            const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.7, 1, 0.7],
                'clamp'
            );

            // Ombre dynamique
            const shadowOpacity = interpolate(
                scrollX.value,
                inputRange,
                [0.1, 0.3, 0.1],
                'clamp'
            );

            const shadowRadius = interpolate(
                scrollX.value,
                inputRange,
                [8, 20, 8],
                'clamp'
            );

            const elevation = interpolate(
                scrollX.value,
                inputRange,
                [3, 10, 3],
                'clamp'
            );

            return {
                transform: [{ scale }],
                opacity,
                shadowOpacity,
                shadowRadius,
                elevation,
            };
        });

        return (
            <Animated.View style={[styles.cardContainer, animatedStyle]}>
                {children}
            </Animated.View>
        );
    };


    return (
        <View style={styles.container}>
            {/* Titre aligné à gauche */}
            <Text style={styles.title}>Choisir une couverture</Text>
            
            <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate={0.98}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={{ overflow: 'visible' }} // Permet à l'ombre de dépasser
            >
                {/* Spacer gauche */}
                <View style={{ width: SPACER_WIDTH }} />

                {/* Card d'import (Index 0) */}
                <Card index={0}>
                    <TouchableOpacity
                        style={[
                            styles.cardContent,
                            styles.uploadCard,
                            selectedIndex === 0 && { borderColor: '#1A1A1A' }
                        ]}
                        onPress={() => {
                            if (customCover) {
                                // Si une cover est déjà uploadée, on peut la sélectionner ou re-éditer
                                selectCover(0);
                            } else {
                                // Sinon, ouvrir le picker
                                pickImage();
                            }
                        }}
                        activeOpacity={0.9}
                    >
                        {customCover ? (
                            <>
                                <Image source={{ uri: customCover }} style={styles.coverImage} contentFit="cover" />
                                <TouchableOpacity
                                    style={styles.editOverlay}
                                    onPress={(e) => {
                                        e.stopPropagation(); // Empêcher le clic de remonter
                                        pickImage();
                                    }}
                                >
                                    <Ionicons name="pencil" size={20} color="white" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.uploadContent}>
                                <View style={styles.addButton}>
                                    <Ionicons name="add" size={48} color="#666" />
                                </View>
                            </View>
                        )}
                        {selectedIndex === 0 && (
                            <View style={styles.checkmark}>
                                <Ionicons name="checkmark-circle" size={28} color="#1A1A1A" />
                            </View>
                        )}
                    </TouchableOpacity>
                </Card>

                {/* Random Covers (Indices 1-3) */}
                {RANDOM_COVERS.map((source, i) => (
                    <Card key={i} index={i + 1}>
                        <TouchableOpacity
                            style={[
                                styles.cardContent,
                                styles.imageCard,
                                selectedIndex === i + 1 && styles.cardSelected
                            ]}
                            onPress={() => selectCover(i + 1)}
                            activeOpacity={0.9}
                        >
                            <Image source={source} style={styles.coverImage} contentFit="cover" />
                            {selectedIndex === i + 1 && (
                                <View style={styles.checkmark}>
                                    <Ionicons name="checkmark-circle" size={28} color="#1A1A1A" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </Card>
                ))}

                {/* Spacer droit */}
                <View style={{ width: SPACER_WIDTH }} />
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'visible', // Permet à l'ombre de dépasser
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'left',
        marginBottom: 12,
        marginLeft: 4,
    },
    scrollContent: {
        alignItems: 'center',
        paddingTop: 8, // Espace entre le titre et les covers
        paddingBottom: 20, // Espace en bas pour l'ombre
    },
    cardContainer: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        marginRight: SPACING,
        justifyContent: 'center',
        alignItems: 'center',
        // Ombre
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        backgroundColor: 'transparent',
    },
    cardContent: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'visible', // Permet à l'ombre de sortir
        borderWidth: 3,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: '#1A1A1A',
        borderWidth: 3,
    },
    uploadCard: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderWidth: 3,
        borderColor: '#E8E8E4',
        borderStyle: 'dashed',
        overflow: 'visible', // Permet à l'ombre de sortir
    },
    uploadContent: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    addButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    imageCard: {
        backgroundColor: '#f5f5f5',
        overflow: 'hidden', // Garde l'image dans les coins arrondis
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    editOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderTopLeftRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'white',
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
