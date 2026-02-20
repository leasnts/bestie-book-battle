/**
 * BottomSheet — Bottom sheet fiable sans swipe-to-dismiss
 *
 * Fermeture par :
 * - Tap sur le backdrop (fond sombre)
 * - Bouton retour Android (onRequestClose)
 *
 * Animations d'ouverture (spring) et de fermeture (timing) gérées
 * avec l'API Animated native — aucune dépendance tierce.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../utils/constants';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const OFFSCREEN = SCREEN_HEIGHT;

export default function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const translateY = useRef(new Animated.Value(OFFSCREEN)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isClosingRef = useRef(false);

  const backdropOpacity = useRef(
    translateY.interpolate({
      inputRange: [0, OFFSCREEN * 0.4, OFFSCREEN],
      outputRange: [0.45, 0.1, 0],
      extrapolate: 'clamp',
    }),
  ).current;

  const animateClose = useCallback(
    (notifyParent: boolean) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;

      Animated.timing(translateY, {
        toValue: OFFSCREEN,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
        isClosingRef.current = false;
        if (notifyParent) onCloseRef.current?.();
      });
    },
    [translateY],
  );

  const animateOpen = useCallback(() => {
    isClosingRef.current = false;
    translateY.setValue(OFFSCREEN);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 20,
      stiffness: 200,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

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

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handleArea}>
          <View style={styles.handleBar} />
        </View>
        {children}
      </Animated.View>
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
    maxHeight: SCREEN_HEIGHT * 0.88,
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
  handleArea: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSubtle,
    borderRadius: 9999,
  },
});
