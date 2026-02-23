/**
 * ImageCropModal
 *
 * Modal de recadrage interactif avec ratio fixe 5:7 (= ratio exact des covers sur l'étagère).
 * L'image est visible en intégralité — la zone hors cadre est simplement assombrie,
 * ce qui rend la fenêtre de crop immédiatement compréhensible.
 * L'utilisateur glisse l'image pour choisir la zone à garder.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../../utils/constants';

const { width: SW } = Dimensions.get('window');

// Cadre de crop — ratio 5:7 exact (= COVER_RATIO_W / COVER_RATIO_H de BookStack)
const FRAME_W = SW - 80;
const FRAME_H = FRAME_W * (7 / 5);

// Couleur des zones hors-cadre
const OVERLAY_COLOR = 'rgba(0,0,0,0.65)';

export interface PendingImage {
  uri: string;
  width: number;
  height: number;
}

interface Props {
  visible: boolean;
  image: PendingImage | null;
  onConfirm: (croppedUri: string) => void;
  onCancel: () => void;
}

export default function ImageCropModal({ visible, image, onConfirm, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const [processing, setProcessing] = useState(false);
  const [zoneH, setZoneH] = useState(0);

  // Dimensions de l'image à l'écran — elle remplit le cadre au minimum
  const imgW = image?.width ?? 1;
  const imgH = image?.height ?? 1;
  const scale = Math.max(FRAME_W / imgW, FRAME_H / imgH);
  const dispW = imgW * scale;
  const dispH = imgH * scale;

  // Amplitude max du pan pour que l'image couvre toujours tout le cadre
  const maxX = Math.max(0, (dispW - FRAME_W) / 2);
  const maxY = Math.max(0, (dispH - FRAME_H) / 2);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Recentrer l'image à chaque nouvelle photo
  useEffect(() => {
    tx.value = 0;
    ty.value = 0;
  }, [image?.uri]);

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = Math.max(-maxX, Math.min(maxX, startX.value + e.translationX));
      ty.value = Math.max(-maxY, Math.min(maxY, startY.value + e.translationY));
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  // Position du cadre dans la frameZone
  const frameLeft = (SW - FRAME_W) / 2;
  const frameTop = zoneH > 0 ? (zoneH - FRAME_H) / 2 : 0;

  const handleZoneLayout = (e: LayoutChangeEvent) => {
    setZoneH(e.nativeEvent.layout.height);
  };

  const handleConfirm = async () => {
    if (!image) return;
    setProcessing(true);
    try {
      // Conversion des coordonnées écran → pixels originaux de l'image
      const originX = Math.round(((dispW - FRAME_W) / 2 - tx.value) / scale);
      const originY = Math.round(((dispH - FRAME_H) / 2 - ty.value) / scale);
      const cropW = Math.round(FRAME_W / scale);
      const cropH = Math.round(FRAME_H / scale);

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
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* En-tête */}
        <View style={styles.header}>
          <Pressable onPress={onCancel} hitSlop={16} style={styles.sideSlot}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
          <Text style={styles.title}>Recadrer</Text>
          <View style={styles.sideSlot} />
        </View>

        <Text style={styles.hint}>Glisse pour repositionner</Text>

        {/* Zone principale : image + overlay + cadre */}
        <View style={styles.frameZone} onLayout={handleZoneLayout}>
          {image && zoneH > 0 && (
            <>
              {/* Image pannable (pleine taille, pas clippée ici) */}
              <GestureDetector gesture={pan}>
                <Animated.View
                  style={[
                    {
                      width: dispW,
                      height: dispH,
                      position: 'absolute',
                      top: (zoneH - dispH) / 2,
                      left: (SW - dispW) / 2,
                    },
                    animStyle,
                  ]}
                >
                  <Image
                    source={{ uri: image.uri }}
                    style={{ width: dispW, height: dispH }}
                    contentFit="fill"
                  />
                </Animated.View>
              </GestureDetector>

              {/* Overlays sombres autour du cadre — pas interactifs */}
              {/* Bande du haut */}
              <View
                pointerEvents="none"
                style={[styles.overlay, { top: 0, left: 0, right: 0, height: frameTop }]}
              />
              {/* Bande du bas */}
              <View
                pointerEvents="none"
                style={[styles.overlay, { top: frameTop + FRAME_H, left: 0, right: 0, bottom: 0 }]}
              />
              {/* Bande gauche */}
              <View
                pointerEvents="none"
                style={[styles.overlay, { top: frameTop, left: 0, width: frameLeft, height: FRAME_H }]}
              />
              {/* Bande droite */}
              <View
                pointerEvents="none"
                style={[styles.overlay, { top: frameTop, right: 0, width: frameLeft, height: FRAME_H }]}
              />

              {/* Coins du cadre */}
              <View pointerEvents="none" style={[styles.corner, styles.cornerTL, { top: frameTop, left: frameLeft }]} />
              <View pointerEvents="none" style={[styles.corner, styles.cornerTR, { top: frameTop, right: frameLeft }]} />
              <View pointerEvents="none" style={[styles.corner, styles.cornerBL, { top: frameTop + FRAME_H - CORNER, left: frameLeft }]} />
              <View pointerEvents="none" style={[styles.corner, styles.cornerBR, { top: frameTop + FRAME_H - CORNER, right: frameLeft }]} />
            </>
          )}
        </View>

        {/* Bouton confirmer */}
        <View style={styles.bottomBar}>
          <Pressable
            onPress={handleConfirm}
            disabled={processing}
            style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85 }]}
          >
            {processing ? (
              <ActivityIndicator color={colors.dark900} />
            ) : (
              <Text style={styles.confirmText}>Utiliser cette photo</Text>
            )}
          </Pressable>
        </View>

      </View>
    </Modal>
  );
}

const CORNER = 22;
const THICK = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark950,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  sideSlot: {
    width: 72,
  },
  cancelText: {
    color: colors.alphaWhite90,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium as any,
  },
  title: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  frameZone: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    backgroundColor: OVERLAY_COLOR,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  cornerTL: {
    borderTopWidth: THICK,
    borderLeftWidth: THICK,
    borderColor: colors.white,
  },
  cornerTR: {
    borderTopWidth: THICK,
    borderRightWidth: THICK,
    borderColor: colors.white,
  },
  cornerBL: {
    borderBottomWidth: THICK,
    borderLeftWidth: THICK,
    borderColor: colors.white,
  },
  cornerBR: {
    borderBottomWidth: THICK,
    borderRightWidth: THICK,
    borderColor: colors.white,
  },
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
    color: colors.dark900,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold as any,
  },
});
