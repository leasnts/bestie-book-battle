/**
 * CoverPicker3D - Carousel avec effet de profondeur pour sélectionner une couverture
 * 
 * Version optimisée et légère pour React Native
 * Utilise un carousel horizontal simple avec effet de perspective
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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

// Configuration du carousel
const CARD_SIZE = 160; // Taille des cartes (réduite pour être plus compacte)
const SPACING = 16; // Espacement entre les cartes
const SNAP_INTERVAL = CARD_SIZE + SPACING;
const SIDE_PADDING = 0; // Pas de padding - aligné à gauche

// 3 random covers
const RANDOM_COVERS = [
    require('../assets/images/random_cover_1.png'),
    require('../assets/images/random_cover_2.png'),
    require('../assets/images/random_cover_3.png'),
];

interface CoverPicker3DProps {
    onCoverSelected: (uri: string) => void;
    initialCover?: string;
}

export default function CoverPicker3D({ onCoverSelected, initialCover }: CoverPicker3DProps) {
    const [customCover, setCustomCover] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0); // Commence sur la première carte (alignée à gauche)
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollX = useSharedValue(0); // Position initiale à gauche
    const scrollViewRef = useRef<Animated.ScrollView>(null);

    // Handler de scroll
    const handleScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
        onMomentumEnd: (event) => {
            const index = Math.round(event.contentOffset.x / SNAP_INTERVAL);
            if (index !== activeIndex) {
                runOnJS(setActiveIndex)(index);
                runOnJS(setSelectedIndex)(index);
                // Haptics
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

    // Initialiser avec la première random cover au montage
    useEffect(() => {
        // Par défaut, sélectionner la première random cover (pas l'upload vide)
        const defaultCover = RANDOM_COVERS[0];
        const assetSource = RNImage.resolveAssetSource(defaultCover);
        if (assetSource && assetSource.uri) {
            onCoverSelected(assetSource.uri);
        }
    }, []);

    // Gérer la sélection quand l'utilisateur change de cover
    useEffect(() => {
        if (selectedIndex === 0) {
            // Cover d'upload sélectionnée
            if (customCover) {
                onCoverSelected(customCover);
            }
            // Si pas de customCover, on ne fait rien (cover vide)
        } else if (selectedIndex >= 1 && selectedIndex <= 3) {
            // Random cover sélectionnée
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
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5, // 0.5 suffit largement pour une couverture de livre
            // Ça réduit la taille du fichier d'environ 60% vs 0.8
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setCustomCover(uri);
            onCoverSelected(uri);
            selectCover(0);
        }
    };

    const selectCover = (index: number) => {
        setSelectedIndex(index);
        setActiveIndex(index);
        scrollViewRef.current?.scrollTo({ x: index * SNAP_INTERVAL, animated: true });
        if (Platform.OS !== 'web') {
            try {
                Haptics.selectionAsync();
            } catch (error) {
                // Ignore
            }
        }
    };

    // Composant Card avec animation de perspective
    const Card = ({ index, children }: { index: number; children: React.ReactNode }) => {
        const animatedStyle = useAnimatedStyle(() => {
            const inputRange = [
                (index - 1) * SNAP_INTERVAL,
                index * SNAP_INTERVAL,
                (index + 1) * SNAP_INTERVAL,
            ];

            // Scale: la carte centrale est plus grande
            const scale = interpolate(
                scrollX.value,
                inputRange,
                [0.85, 1, 0.85],
                'clamp'
            );

            // Opacité
            const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.6, 1, 0.6],
                'clamp'
            );

            // Rotation légère pour l'effet de perspective
            const rotateY = interpolate(
                scrollX.value,
                inputRange,
                [15, 0, -15],
                'clamp'
            );

            return {
                transform: [
                    { scale },
                    { perspective: 1000 },
                    { rotateY: `${rotateY}deg` },
                ],
                opacity,
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
            {/* Titre */}
            <Text style={styles.title}>Choisir une couverture</Text>

            {/* ScrollView Horizontal */}
            <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate={0.98}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                {/* Padding gauche */}
                <View style={{ width: SIDE_PADDING }} />

                {/* Card d'upload (index 0) avec gradient border */}
                <Card index={0}>
                    <View style={styles.uploadCardWrapper}>
                        {/* Gradient border */}
                        <LinearGradient
                            colors={['rgba(15, 23, 42, 0.2)', 'rgba(15, 23, 42, 0.1)']} // Slate-900 20% → 10%
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.uploadCardGradientBorder}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.uploadCard,
                                    selectedIndex === 0 && styles.uploadCardSelected
                                ]}
                                onPress={() => {
                                    if (customCover) {
                                        selectCover(0);
                                    } else {
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
                                                e.stopPropagation();
                                                pickImage();
                                            }}
                                        >
                                            <Ionicons name="pencil" size={20} color="white" />
                                        </TouchableOpacity>
                                        {/* Checkmark moderne avec gradient */}
                                        {selectedIndex === 0 && (
                                            <View style={styles.checkmarkContainer}>
                                                <LinearGradient
                                                    colors={['#0F172A', '#1E293B']} // Slate-900 → Slate-800
                                                    style={styles.checkmarkGradient}
                                                >
                                                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                </LinearGradient>
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <View style={styles.uploadContent}>
                                        <View style={styles.addButton}>
                                            <Ionicons name="add" size={32} color="#FFFFFF" />
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </Card>

                {/* Random Covers (indices 1-3) */}
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
                                <View style={styles.checkmarkContainer}>
                                    <LinearGradient
                                        colors={['#0F172A', '#1E293B']} // Slate-900 → Slate-800
                                        style={styles.checkmarkGradient}
                                    >
                                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                    </LinearGradient>
                                </View>
                            )}
                        </TouchableOpacity>
                    </Card>
                ))}

                {/* Padding droit */}
                <View style={{ width: SIDE_PADDING }} />
            </Animated.ScrollView>

            {/* Indicateurs de position */}
            <View style={styles.indicators}>
                {[0, 1, 2, 3].map((i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => selectCover(i)}
                        style={[
                            styles.indicator,
                            selectedIndex === i && styles.indicatorActive
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'visible',
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'left',
        marginBottom: 8, // 8px comme gap label-input
        marginLeft: 0, // Aligné à gauche comme les labels des inputs
    },
    scrollView: {
        overflow: 'visible',
    },
    scrollContent: {
        alignItems: 'center',
        paddingVertical: 20, // Réduit pour rapprocher des indicateurs
    },
    cardContainer: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        marginRight: SPACING,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 2, // Border plus subtil
        borderColor: 'rgba(226, 232, 240, 0.6)', // Slate-200 avec alpha
        // Ombre normale
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardSelected: {
        borderWidth: 2.5,
        borderColor: '#0F172A', // Slate-900 - border plus moderne
        // Glow effect sur la carte sélectionnée
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    uploadCardWrapper: {
        width: '100%',
        height: '100%',
    },
    uploadCardGradientBorder: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        padding: 2, // Épaisseur du border gradient
        // Ombre subtile pour profondeur
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    uploadCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC', // Slate-50
        borderRadius: 14, // Légèrement plus petit pour le padding du gradient
    },
    uploadCardSelected: {
        // Effet quand sélectionné
        backgroundColor: '#FFFFFF',
    },
    uploadContent: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0F172A', // Slate-900 - dark moderne
        justifyContent: 'center',
        alignItems: 'center',
        // Glow effect subtil
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    imageCard: {
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        borderRadius: 16, // Force 16px pour les image cards
    },
    coverImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16, // 16px pour que l'image respecte le border radius
    },
    editOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderTopLeftRadius: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.85)', // Slate-900 avec alpha
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        // Ombre pour le checkmark (glow effect)
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    checkmarkGradient: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        // Border subtil pour definition
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    indicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#CBD5E1', // Slate-300
        // Transition subtile
        opacity: 0.5,
    },
    indicatorActive: {
        width: 24,
        height: 6,
        backgroundColor: '#0F172A', // Slate-900
        opacity: 1,
        // Glow subtil sur l'indicateur actif
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 2,
    },
});
