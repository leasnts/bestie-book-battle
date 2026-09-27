/**
 * Route /edit-profile — ma photo et mon prénom.
 *
 * Sheet natif (`SheetPage`), ouvert par « Modifier » sur l'onglet Profil.
 * La photo change tout de suite (aperçu local pendant l'envoi) ; le prénom
 * s'enregistre avec le bouton.
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { RotateCcwIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Button3D from '../components/Button3D';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { pickImage, uploadProfilePhoto } from '../services/supabase/storage';
import { useAuthStore } from '../stores/authStore';
import { borderRadius, colors, fonts, fontSize, shadowAlpha, shadows, spacing } from '../utils/constants';
import { resolvePhotoSource } from '../utils/profilePhoto';

// Retire la barre « OK » native au-dessus du clavier d'iOS
const ACCESSORY_ID = 'edit-profile-no-done';

export default function EditProfileRoute() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const handleChangePhoto = async () => {
    if (!user) return;
    try {
      const imageUri = await pickImage(true, [1, 1], 0.8);
      if (!imageUri) return;
      // La photo locale s'affiche tout de suite, sans attendre l'envoi
      setLocalPhotoUri(imageUri);
      setIsUploadingPhoto(true);
      const { url } = await uploadProfilePhoto(user.id, imageUri);
      await updateProfile({ profile_photo_url: url });
    } catch {
      setLocalPhotoUri(null);
      Alert.alert('Erreur', 'Impossible de changer ta photo. Réessaie.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const trimmed = firstName.trim();
    if (!trimmed) {
      Alert.alert('Erreur', 'Le prénom ne peut pas être vide.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ first_name: trimmed });
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessaie.');
    } finally {
      setIsSaving(false);
    }
  };

  // Priorité : photo locale (aperçu instantané) > photo serveur > défaut
  const photoSource = localPhotoUri
    ? { uri: localPhotoUri }
    : resolvePhotoSource(user?.profile_photo_url, user?.updated_at);

  return (
    <SheetPage title="Modifier le profil">
      <InputAccessoryView nativeID={ACCESSORY_ID}>
        <View />
      </InputAccessoryView>

      <Pressable
        style={styles.photoButton}
        onPress={handleChangePhoto}
        disabled={isUploadingPhoto}
        accessibilityRole="button"
        accessibilityLabel="Changer ma photo"
      >
        <View style={styles.photo}>
          <Image source={photoSource} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.photoOverlay}>
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <RotateCcwIcon size={28} color={colors.white} strokeWidth={2.5} />
            )}
          </View>
        </View>
      </Pressable>

      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Ton prénom"
        placeholderTextColor={colors.textPlaceholder}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        inputAccessoryViewID={ACCESSORY_ID}
        autoCapitalize="words"
      />

      <SheetFooter>
        <Button3D variant="primary" onPress={handleSave} loading={isSaving}>
          Enregistrer
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  photoButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: shadowAlpha(0.35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.xs,
  },
});
