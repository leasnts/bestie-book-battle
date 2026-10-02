/**
 * ReactionOverlay — réagir à une note d'un appui long, comme sur WhatsApp.
 *
 *        ( 😭 🫶 😂 🔥 😱 👀  + )     ← la barre de verre, au-dessus de la note
 *    ┌───────────────────────────┐
 *    │ Emma          ≈ p. 43     │     ← la note, nette, à sa place
 *    │ Le narrateur qui…         │
 *    └───────────────────────────┘
 *        (le reste du carnet, flouté et assombri)
 *
 * - La note reste exactement où elle était (`frame`) et grossit à peine : on
 *   sait de quelle note on parle.
 * - Les six réactions rapides, puis « + » pour tous les emojis (`onMore`).
 *   Toucher un emoji pose ma réaction (ou la retire si c'était déjà la mienne :
 *   un point lie de vin la signale), puis tout se referme.
 * - Toucher à côté referme sans rien faire.
 * - Si la note est trop haut pour la barre, elle descend juste assez.
 */

import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { PlusIcon } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import { colors, glassControlVeil, motion, shadowAlpha, spacing } from '../../utils/constants';
import { QUICK_REACTIONS } from '../../utils/emojis';
import GlassMaterial from './GlassMaterial';
import NoteCard, { type NoteFrame } from './NoteCard';
import PressableScale from './PressableScale';

interface ReactionOverlayProps {
  note: AnnotationWithAuthor;
  frame: NoteFrame;
  myUserId?: string;
  myTotalPages: number;
  isMine: boolean;
  onReact: (emoji: string) => void;
  onMore: () => void;
  onClose: () => void;
}

/** La barre : une touche par emoji, 44 pt, dans une gélule de verre */
const KEY = 44;
const BAR_PAD = 4;
const BAR_HEIGHT = KEY + BAR_PAD * 2;
/** L'écart entre la barre et la note */
const GAP = spacing.sm;

export default function ReactionOverlay({
  note,
  frame,
  myUserId,
  myTotalPages,
  isMine,
  onReact,
  onMore,
  onClose,
}: ReactionOverlayProps) {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  // La note descend juste assez pour que la barre tienne au-dessus
  const minTop = insets.top + spacing.md + BAR_HEIGHT + GAP;
  const noteTop = Math.max(frame.y, minTop);
  const barWidth = BAR_PAD * 2 + KEY * (QUICK_REACTIONS.length + 1);
  const barLeft = Math.min(Math.max(spacing.lg, frame.x), screenWidth - spacing.lg - barWidth);

  const mine = new Set(note.reactions.filter((r) => r.user_id === myUserId).map((r) => r.emoji));

  const react = (emoji: string) => {
    Haptics.selectionAsync().catch(() => {});
    onReact(emoji);
    onClose();
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Le carnet derrière : flouté, assombri ; le toucher referme */}
      <Animated.View
        entering={FadeIn.duration(motion.duration.standard)}
        exiting={FadeOut.duration(motion.duration.instant)}
        style={StyleSheet.absoluteFill}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer les réactions">
          <BlurView intensity={18} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
        </Pressable>
      </Animated.View>

      {/* La note, à sa place, nette */}
      <Animated.View
        entering={reduced ? undefined : ZoomIn.duration(motion.duration.standard).springify().damping(18)}
        style={[styles.note, { top: noteTop, left: frame.x, width: frame.width }]}
        pointerEvents="none"
      >
        <NoteCard note={note} myTotalPages={myTotalPages} isMine={isMine} myUserId={myUserId} hideReactions />
      </Animated.View>

      {/* Les réactions, au-dessus */}
      <Animated.View
        entering={reduced ? FadeIn : ZoomIn.duration(motion.duration.standard).springify().damping(16)}
        style={[styles.bar, { top: noteTop - GAP - BAR_HEIGHT, left: barLeft, width: barWidth }]}
        accessibilityRole="toolbar"
      >
        <GlassMaterial radius={BAR_HEIGHT / 2} veil={glassControlVeil} rim />
        {QUICK_REACTIONS.map((emoji) => (
          <PressableScale
            key={emoji}
            style={styles.key}
            pressedScale={0.8}
            onPress={() => react(emoji)}
            accessibilityRole="button"
            accessibilityLabel={emoji}
            accessibilityState={{ selected: mine.has(emoji) }}
            accessibilityHint={mine.has(emoji) ? 'Retire ma réaction' : 'Ajoute ma réaction'}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            {/* Ma réaction : un point lie de vin dessous, comme WhatsApp */}
            {mine.has(emoji) && <View style={styles.mineDot} />}
          </PressableScale>
        ))}
        <PressableScale
          style={styles.key}
          pressedScale={0.8}
          onPress={() => {
            onClose();
            onMore();
          }}
          accessibilityRole="button"
          accessibilityLabel="Tous les emojis"
        >
          <PlusIcon size={20} color={colors.dark900} strokeWidth={2.4} />
        </PressableScale>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    backgroundColor: shadowAlpha(0.18),
  },
  note: {
    position: 'absolute',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  bar: {
    position: 'absolute',
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BAR_PAD,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  key: {
    width: KEY,
    height: KEY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  mineDot: {
    position: 'absolute',
    bottom: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
  },
});
