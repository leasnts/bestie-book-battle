/**
 * BottomSheet — Bottom sheet fiable sans swipe-to-dismiss
 *
 * Fermeture par :
 * - Tap sur le backdrop (fond sombre)
 * - Bouton retour Android (onRequestClose)
 *
 * Gestion clavier :
 * - La modal remonte de la hauteur exacte du clavier (keyboardOffset)
 * - Sa maxHeight se réduit pour ne jamais dépasser le haut de l'écran (maxHeightAnim)
 * → Le bouton fixe reste toujours visible au-dessus du clavier.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../utils/constants';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Rendu à l'intérieur du même Modal, au-dessus du sheet. Idéal pour un crop plein écran sans Modal imbriqué. */
  overlay?: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const OFFSCREEN = SCREEN_HEIGHT;
const MAX_HEIGHT_DEFAULT = SCREEN_HEIGHT * 0.88;

export default function BottomSheet({ visible, onClose, children, overlay }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  // translateY : animation d'ouverture/fermeture du sheet (de OFFSCREEN → 0)
  const translateY = useRef(new Animated.Value(OFFSCREEN)).current;
  // keyboardOffset : décalage vertical quand le clavier est ouvert (0 → -keyboardHeight)
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  // maxHeightAnim : hauteur max du sheet, se réduit quand le clavier ouvre pour ne pas dépasser le haut de l'écran
  const maxHeightAnim = useRef(new Animated.Value(MAX_HEIGHT_DEFAULT)).current;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isClosingRef = useRef(false);

  // L'opacité du backdrop suit translateY (s'assombrit à l'ouverture)
  const backdropOpacity = useRef(
    translateY.interpolate({
      inputRange: [0, OFFSCREEN * 0.4, OFFSCREEN],
      outputRange: [0.45, 0.1, 0],
      extrapolate: 'clamp',
    }),
  ).current;

  // Écoute le clavier et anime le sheet en conséquence
  // useNativeDriver: false est obligatoire car maxHeight ne peut pas passer par le thread natif
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const kh = e.endCoordinates.height;
      const duration = Platform.OS === 'ios' ? e.duration : 220;
      // Nouvelle hauteur max : l'espace disponible entre le safe area top et le haut du clavier
      const newMaxHeight = SCREEN_HEIGHT - kh - insets.top - 16;
      Animated.parallel([
        Animated.timing(keyboardOffset, { toValue: -kh, duration, useNativeDriver: false }),
        Animated.timing(maxHeightAnim, { toValue: newMaxHeight, duration, useNativeDriver: false }),
      ]).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      const duration = Platform.OS === 'ios' ? e.duration : 220;
      Animated.parallel([
        Animated.timing(keyboardOffset, { toValue: 0, duration, useNativeDriver: false }),
        Animated.timing(maxHeightAnim, { toValue: MAX_HEIGHT_DEFAULT, duration, useNativeDriver: false }),
      ]).start();
    });

    return () => { showSub.remove(); hideSub.remove(); };
  }, [insets.top, keyboardOffset, maxHeightAnim]);

  const animateClose = useCallback(
    (notifyParent: boolean) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;

      Animated.parallel([
        Animated.timing(translateY, { toValue: OFFSCREEN, duration: 250, useNativeDriver: false }),
        // Remet le clavier à zéro pour la prochaine ouverture
        Animated.timing(keyboardOffset, { toValue: 0, duration: 150, useNativeDriver: false }),
        Animated.timing(maxHeightAnim, { toValue: MAX_HEIGHT_DEFAULT, duration: 150, useNativeDriver: false }),
      ]).start(() => {
        setModalVisible(false);
        isClosingRef.current = false;
        if (notifyParent) onCloseRef.current?.();
      });
    },
    [translateY, keyboardOffset, maxHeightAnim],
  );

  const animateOpen = useCallback(() => {
    isClosingRef.current = false;
    // Reset clean à chaque ouverture
    translateY.setValue(OFFSCREEN);
    keyboardOffset.setValue(0);
    maxHeightAnim.setValue(MAX_HEIGHT_DEFAULT);

    Animated.spring(translateY, {
      toValue: 0,
      damping: 20,
      stiffness: 200,
      mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [translateY, keyboardOffset, maxHeightAnim]);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
    } else if (modalVisible) {
      animateClose(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (modalVisible && visible) animateOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalVisible]);

  const dismiss = useCallback(() => animateClose(true), [animateClose]);

  if (!modalVisible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      {/* Backdrop — tap pour fermer */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      {/* Sheet — remonte avec le clavier, maxHeight garantit qu'il ne dépasse pas le haut */}
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: maxHeightAnim,
            transform: [{ translateY: Animated.add(translateY, keyboardOffset) }],
          },
        ]}
      >
        {children}
      </Animated.View>

      {/* Overlay plein écran dans le même Modal (ex: crop cover) */}
      {overlay}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
});
