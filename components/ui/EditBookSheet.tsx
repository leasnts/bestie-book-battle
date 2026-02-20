/**
 * EditBookSheet
 *
 * Bottom sheet pour modifier les informations d'un livre.
 * - Titre « Modifier le livre »
 * - Upload cover (cliquable)
 * - 3 inputs : Titre, Auteur, Nb pages
 * - Bouton « Enregistrer »
 *
 * Utilise BottomSheet (custom) pour le glissement-pour-fermer natif.
 * Le handle (zone de drag) est au-dessus — les inputs et le scroll
 * en dessous gardent leur comportement normal sans conflit.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '../../utils/constants';
import Button3D from '../Button3D';
import BottomSheet from './BottomSheet';

interface EditBookSheetProps {
  visible: boolean;
  onClose: () => void;
  currentBook: {
    title: string;
    author: string;
    totalPages: number;
    coverUrl: string | null;
  };
  onSave: (data: {
    title: string;
    author: string;
    totalPages: number;
    coverUri?: string;
  }) => Promise<void>;
}

export default function EditBookSheet({
  visible,
  onClose,
  currentBook,
  onSave,
}: EditBookSheetProps) {
  const insets = useSafeAreaInsets();

  const titleRef = useRef<TextInput>(null);
  const authorRef = useRef<TextInput>(null);
  const pagesRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [title, setTitle] = useState(currentBook.title);
  const [author, setAuthor] = useState(currentBook.author);
  const [totalPages, setTotalPages] = useState(currentBook.totalPages.toString());
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Écouter l'ouverture/fermeture du clavier pour adapter le padding bas
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Réinitialise les champs à chaque ouverture
  useEffect(() => {
    if (visible) {
      setTitle(currentBook.title);
      setAuthor(currentBook.author);
      setTotalPages(currentBook.totalPages.toString());
      setCoverUri(null);
    }
  }, [visible, currentBook]);

  const handlePickImage = useCallback(async () => {
    try {
      setIsPickingImage(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          "Nous avons besoin d'accéder à ta galerie pour changer la couverture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setCoverUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Titre manquant', 'Entre un titre pour le livre.');
      return;
    }
    if (!author.trim()) {
      Alert.alert('Auteur manquant', "Entre un nom d'auteur.");
      return;
    }

    const pages = parseInt(totalPages, 10);
    if (!pages || pages <= 0) {
      Alert.alert('Pages invalides', 'Entre un nombre de pages valide.');
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        author: author.trim(),
        totalPages: pages,
        coverUri: coverUri || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', "Impossible d'enregistrer les modifications.");
    } finally {
      setIsSaving(false);
    }
  }, [title, author, totalPages, coverUri, onSave, onClose]);

  const displayCoverUrl = coverUri || currentBook.coverUrl;

  return (
    <>
      {/* Supprime la barre "Done" native sur le clavier numérique iOS */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="editbook-pages-empty">
          <View />
        </InputAccessoryView>
      )}

      <BottomSheet visible={visible} onClose={onClose}>
        {/*
          KeyboardAvoidingView pousse le contenu au-dessus du clavier.
          Il est à l'intérieur du BottomSheet (pas autour) pour ne pas
          interférer avec l'animation de la modal.
        */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.keyboardAvoid}
        >
          <Text style={styles.title}>Modifier le livre</Text>

          <ScrollView
            ref={scrollRef}
            style={styles.scrollContent}
            contentContainerStyle={[
              styles.scrollContentInner,
              {
                paddingBottom: isKeyboardVisible
                  ? 12
                  : Math.max(32, insets.bottom + 16),
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cover upload */}
            <Pressable
              onPress={handlePickImage}
              disabled={isPickingImage}
              style={styles.coverButton}
            >
              {displayCoverUrl ? (
                <View style={styles.coverWrapper}>
                  <Image
                    source={{ uri: displayCoverUrl }}
                    style={styles.coverImage}
                    contentFit="cover"
                  />
                  <View style={styles.coverOverlay}>
                    <Ionicons name="camera-outline" size={20} color={colors.white} />
                    <Text style={styles.coverOverlayText}>Modifier</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={32}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.coverPlaceholderText}>
                    Ajouter une couverture
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={styles.formContainer}>
              <TextInput
                ref={titleRef}
                style={styles.input}
                placeholder="Titre du livre"
                placeholderTextColor={colors.textPlaceholder}
                value={title}
                onChangeText={setTitle}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => authorRef.current?.focus()}
                onFocus={() => {
                  setTimeout(
                    () => scrollRef.current?.scrollTo({ y: 200, animated: true }),
                    300
                  );
                }}
              />

              <TextInput
                ref={authorRef}
                style={styles.input}
                placeholder="Auteur du livre"
                placeholderTextColor={colors.textPlaceholder}
                value={author}
                onChangeText={setAuthor}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => pagesRef.current?.focus()}
                onFocus={() => {
                  setTimeout(
                    () => scrollRef.current?.scrollTo({ y: 260, animated: true }),
                    300
                  );
                }}
              />

              <TextInput
                ref={pagesRef}
                style={styles.input}
                placeholder="Nombre de pages"
                placeholderTextColor={colors.textPlaceholder}
                value={totalPages}
                onChangeText={setTotalPages}
                keyboardType="number-pad"
                inputAccessoryViewID="editbook-pages-empty"
                onFocus={() => {
                  setTimeout(
                    () => scrollRef.current?.scrollToEnd({ animated: true }),
                    300
                  );
                }}
              />
            </View>

            <View style={styles.footer}>
              <Button3D
                onPress={handleSave}
                variant="primary"
                disabled={isSaving}
                style={{ width: '100%' }}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button3D>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    maxHeight: '90%',
  },
  title: {
    fontFamily: 'Rokkitt_Medium',
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: -0.72,
    lineHeight: 44,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    textAlign: 'left',
  },
  scrollContent: {
    flexGrow: 0,
  },
  scrollContentInner: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },

  // ═══ COVER ═══
  coverButton: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  coverWrapper: {
    position: 'relative',
    width: 120,
    height: 180,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  coverOverlayText: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 12,
    color: colors.white,
    letterSpacing: 0.3,
  },
  coverPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  coverPlaceholderText: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // ═══ FORM ═══
  formContainer: {
    gap: spacing.md,
  },
  input: {
    fontFamily: 'WorkSans',
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular as any,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    letterSpacing: -0.3,
    ...shadows.xs,
    textAlignVertical: 'center',
  },

  // ═══ FOOTER ═══
  footer: {
    paddingTop: spacing.lg,
  },
});
