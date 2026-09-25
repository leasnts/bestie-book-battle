/**
 * Route /edit-book — modifier le livre, ou seulement mon édition.
 *
 * Sheet natif (`SheetPage`), ouvert par le menu « … » de la fiche du livre
 * (`?from=book`) : il se pose dessus, et un retour y ramène.
 *
 * - L'admin (la personne qui a créé le bbb) règle le livre : titre, auteur,
 *   pages, couverture. Son édition est celle de référence.
 * - Les autres ne règlent que LEUR édition : couverture et pages.
 *
 * Le recadrage de la couverture est `ImageCropModal`, plein écran, présenté
 * par-dessus le sheet.
 */

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraIcon, CloudUploadIcon } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Button3D from '../components/Button3D';
import ImageCropModal, { type PendingImage } from '../components/ui/ImageCropModal';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { myCoverUrl } from '../services/myEdition';
import { uploadBookCover } from '../services/supabase/storage';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import { borderRadius, colors, fonts, fontSize, shadowAlpha, shadows, spacing } from '../utils/constants';
import { extractCoverPalette, type CoverPalette } from '../utils/coverPalette';

// Retire la barre « OK » native au-dessus du clavier numérique d'iOS
const ACCESSORY_ID = 'editbook-pages-empty';

export default function EditBookRoute() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const user = useAuthStore((s) => s.user);
  const { activeChallenge, updateActiveChallenge, loadUserChallenges } = useProjectStore();
  const { participants, saveMyEdition } = useProgressStore();

  const mine = useMemo(
    () => participants.find((p) => p.user.id === user?.id)?.progress,
    [participants, user?.id],
  );
  const myPages = mine?.total_pages ?? activeChallenge?.total_pages ?? 0;
  const isAdmin = !!user?.id && activeChallenge?.admin_id === user.id;
  /** Seulement mon édition : couverture et pages, sans titre ni auteur */
  const editionOnly = !isAdmin;
  const currentCover = activeChallenge ? myCoverUrl(activeChallenge, mine) : null;

  const authorRef = useRef<TextInput>(null);
  const pagesRef = useRef<TextInput>(null);

  const [title, setTitle] = useState(activeChallenge?.book_title ?? '');
  const [author, setAuthor] = useState(activeChallenge?.book_author ?? '');
  const [totalPages, setTotalPages] = useState(myPages ? String(myPages) : '');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const handlePickImage = useCallback(async () => {
    try {
      setIsPickingImage(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "Nous avons besoin d'accéder à ta galerie pour changer la couverture.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPendingImage({ uri: asset.uri, width: asset.width, height: asset.height });
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeChallenge || !user?.id) return;
    if (!editionOnly) {
      if (!title.trim()) { Alert.alert('Titre manquant', 'Entre un titre pour le livre.'); return; }
      if (!author.trim()) { Alert.alert('Auteur manquant', "Entre un nom d'auteur."); return; }
    }
    const pages = parseInt(totalPages, 10);
    if (!pages || pages <= 0) { Alert.alert('Pages invalides', 'Entre un nombre de pages valide.'); return; }

    Keyboard.dismiss();
    setIsSaving(true);
    try {
      // Mes pages, dans tous les cas : c'est ma progression qui en dépend
      if (pages !== myPages) {
        await saveMyEdition(activeChallenge.id, user.id, { totalPages: pages });
      }

      if (editionOnly) {
        // Membre : sa couverture ne change que la sienne
        if (coverUri) await saveMyEdition(activeChallenge.id, user.id, { cover: coverUri });
      } else {
        // Admin : son édition est celle de référence du bbb (celle que voient les
        // invitées). Nouvelle couverture : upload et couleurs du fond en
        // parallèle. Si l'extraction échoue, la base efface l'ancienne palette et
        // l'accueil la recalcule (useCoverPalette).
        let coverUrl = activeChallenge.cover_url;
        let newPalette: CoverPalette | undefined;
        if (coverUri) {
          const [{ url }, palette] = await Promise.all([
            uploadBookCover(activeChallenge.id, coverUri),
            extractCoverPalette(coverUri).catch(() => undefined),
          ]);
          coverUrl = url;
          newPalette = palette;
        }
        await updateActiveChallenge({
          book_title: title.trim(),
          book_author: author.trim(),
          total_pages: pages,
          cover_url: coverUrl,
          ...(newPalette && { cover_palette: newPalette }),
        });
        await loadUserChallenges(user.id);
      }
      router.back();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', "Impossible d'enregistrer les modifications.");
    } finally {
      setIsSaving(false);
    }
  }, [
    activeChallenge, user?.id, editionOnly, title, author, totalPages, coverUri, myPages,
    saveMyEdition, updateActiveChallenge, loadUserChallenges, router,
  ]);

  const displayCoverUrl = coverUri || currentCover;

  return (
    <SheetPage
      title={editionOnly ? 'Mon édition' : 'Modifier le livre'}
      onBack={from ? () => router.back() : undefined}
    >
      <InputAccessoryView nativeID={ACCESSORY_ID}>
        <View />
      </InputAccessoryView>

      <Pressable
        onPress={handlePickImage}
        disabled={isPickingImage}
        style={styles.coverButton}
        accessibilityRole="button"
        accessibilityLabel={displayCoverUrl ? 'Changer la couverture' : 'Ajouter une couverture'}
      >
        {displayCoverUrl ? (
          <View style={styles.cover}>
            <Image source={{ uri: displayCoverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.coverOverlay}>
              <CameraIcon size={20} color={colors.white} />
              <Text style={styles.coverOverlayText}>Modifier</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <CloudUploadIcon size={32} color={colors.textTertiary} />
            <Text style={styles.coverPlaceholderText}>Ajouter une couverture</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.form}>
        {!editionOnly && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Titre du livre"
              placeholderTextColor={colors.textPlaceholder}
              value={title}
              onChangeText={setTitle}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => authorRef.current?.focus()}
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
            />
          </>
        )}
        <TextInput
          ref={pagesRef}
          style={styles.input}
          placeholder="Nombre de pages"
          placeholderTextColor={colors.textPlaceholder}
          value={totalPages}
          onChangeText={setTotalPages}
          keyboardType="number-pad"
          inputAccessoryViewID={ACCESSORY_ID}
        />
      </View>

      <SheetFooter>
        <Button3D onPress={handleSave} variant="primary" loading={isSaving}>
          Enregistrer
        </Button3D>
      </SheetFooter>

      <ImageCropModal
        visible={pendingImage !== null}
        image={pendingImage}
        onConfirm={(croppedUri) => {
          setPendingImage(null);
          setCoverUri(croppedUri);
        }}
        onCancel={() => setPendingImage(null)}
      />
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  coverButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  cover: {
    width: 120,
    height: 168,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: shadowAlpha(0.5),
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  coverOverlayText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.white,
    letterSpacing: 0.3,
  },
  coverPlaceholder: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  coverPlaceholderText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
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
