/**
 * BottomSheet — Composant réutilisable de bottom sheet
 *
 * Comportement iOS natif :
 * - Glisse vers le haut à l'ouverture (spring)
 * - Swipe vers le bas depuis N'IMPORTE OÙ sur le sheet → ferme
 * - Le sheet suit le doigt en temps réel pendant le drag
 * - Relâcher après 100px ou flick rapide → ferme avec spring
 * - Relâcher avant → snap back
 * - Tap sur le backdrop → ferme
 *
 * Le PanResponder couvre TOUT le sheet (pas juste le handle).
 * Il ne capture le geste qu'au MOUVEMENT (pas au touch), donc :
 * - Un tap sur un bouton → fonctionne normalement
 * - Un tap sur un TextInput → prend le focus normalement
 * - Un drag vertical vers le bas → le sheet suit le doigt
 *
 * Pour les sheets avec ScrollView : le scroll interne prend priorité
 * sur le PanResponder (onPanResponderTerminationRequest: true).
 * Les zones non-scrollables restent draggables.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
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

const OFFSCREEN = 1200;
const CLOSE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 0.5;

export default function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const [isModalMounted, setIsModalMounted] = useState(false);
  const translateY = useRef(new Animated.Value(OFFSCREEN)).current;

  const backdropOpacity = useRef(
    translateY.interpolate({
      inputRange: [0, 300, OFFSCREEN],
      outputRange: [1, 0.15, 0],
      extrapolate: 'clamp',
    })
  ).current;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isAnimatingOutRef = useRef(false);

  const animateOut = useCallback(() => {
    if (isAnimatingOutRef.current) return;
    isAnimatingOutRef.current = true;

    Animated.spring(translateY, {
      toValue: OFFSCREEN,
      damping: 28,
      stiffness: 360,
      mass: 0.8,
      useNativeDriver: false,
    }).start(() => {
      setIsModalMounted(false);
      isAnimatingOutRef.current = false;
    });

    setTimeout(() => {
      if (isAnimatingOutRef.current) {
        translateY.stopAnimation();
        setIsModalMounted(false);
        isAnimatingOutRef.current = false;
      }
    }, 500);
  }, [translateY]);

  useEffect(() => {
    if (visible) {
      isAnimatingOutRef.current = false;
      translateY.setValue(OFFSCREEN);
      setIsModalMounted(true);
    } else if (isModalMounted) {
      animateOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (isModalMounted && visible) {
      requestAnimationFrame(() => {
        Animated.spring(translateY, {
          toValue: 0,
          damping: 26,
          stiffness: 240,
          mass: 0.9,
          useNativeDriver: false,
        }).start();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalMounted]);

  const dismiss = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  /**
   * PanResponder sur TOUT le sheet (pas juste le handle).
   *
   * - onStartShouldSetPanResponder: false
   *   → Un simple tap ne déclenche PAS le PanResponder.
   *   → Les boutons, inputs, pressables reçoivent le tap normalement.
   *
   * - onMoveShouldSetPanResponder: true si dy > 8px ET mouvement vertical
   *   → Seulement un vrai glissement vers le bas capture le geste.
   *   → Un scroll horizontal ou un tout petit mouvement est ignoré.
   *
   * - onPanResponderTerminationRequest: true
   *   → Si un enfant (ScrollView par ex.) veut prendre le geste,
   *     on lui donne la priorité. Ça évite les conflits scroll/dismiss.
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderTerminationRequest: () => true,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > CLOSE_THRESHOLD || gs.vy > VELOCITY_THRESHOLD) {
          onCloseRef.current?.();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 26,
            stiffness: 240,
            mass: 0.9,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  if (!isModalMounted) return null;

  return (
    <Modal
      visible={isModalMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      {/*
        Le PanResponder est sur l'Animated.View du sheet entier.
        panHandlers contient les callbacks onResponderMove, etc.
        Tout le contenu du sheet est draggable vers le bas.
      */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.sheet, { transform: [{ translateY }] }]}
      >
        {/* Handle visuel (purement décoratif, la zone de drag = tout le sheet) */}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
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
