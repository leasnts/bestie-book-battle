/**
 * EditBookSheet
 *
 * Bottom sheet pour modifier les informations d'un livre.
 *
 * Le crop de la cover est un overlay plein écran rendu à l'intérieur
 * du MÊME Modal (via la prop `overlay` de BottomSheet).
 * Aucun Modal imbriqué → aucun conflit iOS.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  InputAccessoryView,
  Keyboard,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, creamAlpha, fonts, fontSize, shadowAlpha, shadows, spacing } from '../../utils/constants';
import Button3D from '../Button3D';
import BottomSheet from './BottomSheet';
import { CameraIcon, CloudUploadIcon, XIcon } from 'lucide-react-native';

const { width: SW } = Dimensions.get('window');
const CROP_RATIO = 5 / 7; // ratio exact de l'étagère
const OVERLAY_COLOR = shadowAlpha(0.65);
const CORNER_S = 20;
const CORNER_T = 3;

type Mode = 'form' | 'crop';

interface PendingImage {
  uri: string;
  width: number;
  height: number;
}

// ─── Crop plein écran (overlay dans le même Modal) ───────────────────────────

interface CropOverlayProps {
  image: PendingImage;
  insetTop: number;
  insetBottom: number;
  onConfirm: (uri: string) => void;
  onCancel: () => void;
}

function CropOverlay({ image, insetTop, insetBottom, onConfirm, onCancel }: CropOverlayProps) {
  const [zoneH, setZoneH] = useState(0);
  const [processing, setProcessing] = useState(false);

  const frameW = SW - 80;
  const frameH = frameW / CROP_RATIO;

  const scale = Math.max(frameW / image.width, frameH / image.height);
  const dispW = image.width * scale;
  const dispH = image.height * scale;

  const maxX = Math.max(0, (dispW - frameW) / 2);
  const maxY = Math.max(0, (dispH - frameH) / 2);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => { startX.value = tx.value; startY.value = ty.value; })
    .onUpdate((e) => {
      tx.value = Math.max(-maxX, Math.min(maxX, startX.value + e.translationX));
      ty.value = Math.max(-maxY, Math.min(maxY, startY.value + e.translationY));
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  const frameLeft = (SW - frameW) / 2;
  const frameTop = zoneH > 0 ? (zoneH - frameH) / 2 : 0;

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const originX = Math.round(((dispW - frameW) / 2 - tx.value) / scale);
      const originY = Math.round(((dispH - frameH) / 2 - ty.value) / scale);
      const cropW = Math.round(frameW / scale);
      const cropH = Math.round(frameH / scale);
      // Crop puis resize : max 900px de large (largement suffisant pour une cover à 3x)
      const result = await ImageManipulator.manipulateAsync(
        image.uri,
        [
          { crop: { originX, originY, width: cropW, height: cropH } },
          { resize: { width: 900 } },
        ],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
      );
      onConfirm(result.uri);
    } catch (e) {
      console.error('Crop failed', e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={[cropStyles.container, { paddingTop: insetTop, paddingBottom: insetBottom }]}>
      {/* En-tête */}
      <View style={cropStyles.header}>
        <Pressable onPress={onCancel} hitSlop={16} style={cropStyles.sideSlot}>
          <Text style={cropStyles.cancelText}>Annuler</Text>
        </Pressable>
        <Text style={cropStyles.title}>Recadrer</Text>
        <View style={cropStyles.sideSlot} />
      </View>

      <Text style={cropStyles.hint}>Glisse pour repositionner</Text>

      {/* Zone image + overlays */}
      <View
        style={cropStyles.zone}
        onLayout={(e: LayoutChangeEvent) => setZoneH(e.nativeEvent.layout.height)}
      >
        {zoneH > 0 && (
          <>
            <GestureDetector gesture={pan}>
              <Animated.View
                style={[{
                  width: dispW, height: dispH,
                  position: 'absolute',
                  top: (zoneH - dispH) / 2,
                  left: (SW - dispW) / 2,
                }, animStyle]}
              >
                <Image source={{ uri: image.uri }} style={{ width: dispW, height: dispH }} contentFit="fill" />
              </Animated.View>
            </GestureDetector>

            {/* Overlays sombres hors-cadre */}
            <View pointerEvents="none" style={[cropStyles.overlay, { top: 0, left: 0, right: 0, height: frameTop }]} />
            <View pointerEvents="none" style={[cropStyles.overlay, { top: frameTop + frameH, left: 0, right: 0, bottom: 0 }]} />
            <View pointerEvents="none" style={[cropStyles.overlay, { top: frameTop, left: 0, width: frameLeft, height: frameH }]} />
            <View pointerEvents="none" style={[cropStyles.overlay, { top: frameTop, right: 0, width: frameLeft, height: frameH }]} />

            {/* Coins du cadre */}
            <View pointerEvents="none" style={[cropStyles.corner, cropStyles.cTL, { top: frameTop, left: frameLeft }]} />
            <View pointerEvents="none" style={[cropStyles.corner, cropStyles.cTR, { top: frameTop, right: frameLeft }]} />
            <View pointerEvents="none" style={[cropStyles.corner, cropStyles.cBL, { top: frameTop + frameH - CORNER_S, left: frameLeft }]} />
            <View pointerEvents="none" style={[cropStyles.corner, cropStyles.cBR, { top: frameTop + frameH - CORNER_S, right: frameLeft }]} />
          </>
        )}
      </View>

      {/* Bouton confirmer */}
      <View style={cropStyles.bottomBar}>
        <Pressable
          onPress={handleConfirm}
          disabled={processing}
          style={({ pressed }) => [cropStyles.confirmBtn, pressed && { opacity: 0.85 }]}
        >
          {processing
            ? <ActivityIndicator color={colors.dark900} />
            : <Text style={cropStyles.confirmText}>Utiliser cette photo</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

const cropStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.dark950,
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  sideSlot: { width: 72 },
  cancelText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.alphaWhite90,
    fontSize: fontSize.md,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    color: creamAlpha(0.45),
    fontSize: fontSize.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontFamily: fonts.body,
    color: creamAlpha(0.35),
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  zone: { flex: 1 },
  overlay: { position: 'absolute', backgroundColor: OVERLAY_COLOR },
  corner: { position: 'absolute', width: CORNER_S, height: CORNER_S },
  cTL: { borderTopWidth: CORNER_T, borderLeftWidth: CORNER_T, borderColor: colors.white },
  cTR: { borderTopWidth: CORNER_T, borderRightWidth: CORNER_T, borderColor: colors.white },
  cBL: { borderBottomWidth: CORNER_T, borderLeftWidth: CORNER_T, borderColor: colors.white },
  cBR: { borderBottomWidth: CORNER_T, borderRightWidth: CORNER_T, borderColor: colors.white },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  confirmBtn: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: fonts.bodyBold,
    color: colors.dark900,
    fontSize: fontSize.md,
  },
});

// ─── Composant principal ──────────────────────────────────────────────────────

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

  const [mode, setMode] = useState<Mode>('form');
  const [title, setTitle] = useState(currentBook.title);
  const [author, setAuthor] = useState(currentBook.author);
  const [totalPages, setTotalPages] = useState(currentBook.totalPages.toString());
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(show, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hide, () => setIsKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (visible) {
      setMode('form');
      setTitle(currentBook.title);
      setAuthor(currentBook.author);
      setTotalPages(currentBook.totalPages.toString());
      setCoverUri(null);
      setPendingImage(null);
    }
    // currentBook exclu volontairement : le reset ne doit se déclencher qu'à
    // l'ouverture/fermeture du sheet, pas à chaque re-render du parent qui
    // crée un nouvel objet référence à chaque fois (inline object literal).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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
        setMode('crop');
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) { Alert.alert('Titre manquant', 'Entre un titre pour le livre.'); return; }
    if (!author.trim()) { Alert.alert('Auteur manquant', "Entre un nom d'auteur."); return; }
    const pages = parseInt(totalPages, 10);
    if (!pages || pages <= 0) { Alert.alert('Pages invalides', 'Entre un nombre de pages valide.'); return; }

    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await onSave({ title: title.trim(), author: author.trim(), totalPages: pages, coverUri: coverUri || undefined });
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', "Impossible d'enregistrer les modifications.");
    } finally {
      setIsSaving(false);
    }
  }, [title, author, totalPages, coverUri, onSave, onClose]);

  const displayCoverUrl = coverUri || currentBook.coverUrl;

  // Le crop overlay est passé au BottomSheet pour être rendu dans le MÊME Modal
  const cropOverlay = mode === 'crop' && pendingImage ? (
    <CropOverlay
      image={pendingImage}
      insetTop={insets.top}
      insetBottom={insets.bottom}
      onConfirm={(croppedUri) => {
        setCoverUri(croppedUri);
        setPendingImage(null);
        setMode('form');
      }}
      onCancel={() => {
        setPendingImage(null);
        setMode('form');
      }}
    />
  ) : undefined;

  return (
    <>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="editbook-pages-empty">
          <View />
        </InputAccessoryView>
      )}

      <BottomSheet visible={visible} onClose={onClose} overlay={cropOverlay}>
        {/* ── Titre fixe (ne scroll pas) ── */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Modifier le livre</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <XIcon size={22} color={colors.textSubtle} />
          </Pressable>
        </View>

        {/* ── Contenu scrollable : cover + champs ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={handlePickImage} disabled={isPickingImage} style={styles.coverButton}>
            {displayCoverUrl ? (
              <View style={styles.coverWrapper}>
                <Image source={{ uri: displayCoverUrl }} style={styles.coverImage} contentFit="cover" />
                <View style={styles.coverOverlay}>
                  <CameraIcon size={20} color={colors.white} />
                  <Text style={styles.coverOverlayText}>Modifier</Text>
                </View>
              </View>
            ) : (
              <View style={styles.coverPlaceholder}>
                <CloudUploadIcon size={32} color={colors.textTertiary} />
                <Text style={styles.coverPlaceholderText}>Ajouter une couverture</Text>
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
              onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 300)}
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
              onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: 80, animated: true }), 300)}
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
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
            />
          </View>
        </ScrollView>

        {/* ── Bouton fixe au-dessus du clavier (hors ScrollView) ── */}
        <View style={[
          styles.footer,
          { paddingBottom: isKeyboardVisible ? spacing.md : Math.max(spacing.xl, insets.bottom + spacing.md) },
        ]}>
          <Button3D onPress={handleSave} variant="primary" disabled={isSaving} style={{ width: '100%' }}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button3D>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 44,
    textAlign: 'left',
  },
  closeBtn: { padding: 4 },
  // flex:1 pour que le ScrollView prenne tout l'espace disponible entre le titre et le footer
  scrollContent: { flex: 1 },
  scrollContentInner: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  coverButton: { alignItems: 'center', marginBottom: spacing['2xl'] },
  coverWrapper: {
    position: 'relative',
    width: 120,
    height: 168,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  coverImage: { width: '100%', height: '100%' },
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
    width: 120,
    height: 168,
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
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  formContainer: { gap: spacing.md },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    ...shadows.xs,
    textAlignVertical: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    // paddingBottom est appliqué dynamiquement en ligne (selon clavier ouvert ou non)
  },
});
