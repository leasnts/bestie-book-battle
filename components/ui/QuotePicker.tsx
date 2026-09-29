/**
 * QuotePicker — citer un passage à partir d'une photo de la page.
 *
 * La photo s'affiche en grand ; le téléphone y lit le texte (`page-text`, Vision
 * d'Apple, rien ne quitte l'appareil). On touche les lignes à citer, elles se
 * surlignent comme au stabilo ; « Citer » ouvre la note avec le passage, pour y
 * ajouter une pensée ou un avis.
 *
 *   [✕]      Touche les lignes à citer
 *   ┌─────────────────────────┐
 *   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   ← lignes surlignées
 *   └─────────────────────────┘
 *   Reprendre                 [❝ Citer]
 *
 * Pendant la lecture, un voile balaie la photo (jamais de roue qui tourne).
 */

import { Image } from 'expo-image';
import { QuoteIcon, XIcon } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recognizePage, type PageLine } from '../../modules/page-text/src';
import { colors, creamAlpha, fonts, spacing } from '../../utils/constants';
import GlassButton from './GlassButton';
import PressableScale from './PressableScale';

export interface PagePhoto {
  uri: string;
  width: number;
  height: number;
}

interface QuotePickerProps {
  photo: PagePhoto | null;
  onClose: () => void;
  onRetake: () => void;
  onCite: (quote: string) => void;
}

/** Le surligneur : le jaune des post-it « Mdr », un peu transparent */
const HIGHLIGHT = 'rgba(240,214,120,0.85)';

export default function QuotePicker({ photo, onClose, onRetake, onCite }: QuotePickerProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [lines, setLines] = useState<PageLine[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [box, setBox] = useState({ width: 0, height: 0 });

  // Une nouvelle photo : on relit tout
  useEffect(() => {
    if (!photo) return;
    let alive = true;
    setLines(null);
    setSelected(new Set());
    recognizePage(photo.uri)
      .then((found) => {
        if (!alive) return;
        setLines(found);
      })
      .catch((error) => {
        console.warn('[Carnet] lecture de la page', error);
        if (alive) setLines([]);
      });
    return () => {
      alive = false;
    };
  }, [photo]);

  // La photo tient dans sa zone sans être coupée : on calcule où elle se pose
  const frame = useMemo(() => {
    if (!photo || !box.width) return null;
    const scale = Math.min(box.width / photo.width, box.height / photo.height);
    const width = photo.width * scale;
    const height = photo.height * scale;
    return { width, height, left: (box.width - width) / 2, top: (box.height - height) / 2 };
  }, [photo, box]);

  const toggle = (index: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const cite = () => {
    if (!lines) return;
    const text = [...selected]
      .sort((a, b) => a - b)
      .map((index) => lines[index].text.trim())
      .join(' ')
      // Un mot coupé en fin de ligne se recolle : « aus- sitôt » → « aussitôt »
      .replace(/(\p{L})- (\p{Ll})/gu, '$1$2');
    onCite(text);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  };

  const hint =
    lines === null ? 'Lecture de la page…' : lines.length === 0 ? 'Aucun texte lu' : 'Touche les lignes à citer';

  return (
    <Modal visible={photo !== null} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.head}>
          <GlassButton icon={XIcon} size={36} onPress={onClose} accessibilityLabel="Fermer" />
          <View style={styles.hint}>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
          <View style={styles.spacer} />
        </View>

        <View style={styles.stage} onLayout={onLayout}>
          {photo && frame && (
            <View style={[styles.photo, frame]}>
              <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="fill" />
              {lines === null && !reducedMotion && <Sweep height={frame.height} />}
              {lines?.map((line, index) => {
                const on = selected.has(index);
                return (
                  <Pressable
                    key={index}
                    onPress={() => toggle(index)}
                    // Une ligne est fine : la zone de toucher déborde un peu
                    hitSlop={{ top: 4, bottom: 4 }}
                    style={[
                      styles.line,
                      {
                        left: line.x * frame.width - 3,
                        top: line.y * frame.height - 2,
                        width: line.width * frame.width + 6,
                        height: line.height * frame.height + 4,
                      },
                      on && styles.lineOn,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={line.text}
                  />
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.foot}>
          <PressableScale
            style={styles.retake}
            pressedScale={0.95}
            onPress={onRetake}
            accessibilityRole="button"
            accessibilityLabel="Reprendre la photo"
          >
            <Text style={styles.retakeText}>Reprendre</Text>
          </PressableScale>
          <PressableScale
            style={styles.cite}
            pressedScale={0.95}
            disabled={selected.size === 0}
            onPress={cite}
            accessibilityRole="button"
            accessibilityLabel={`Citer ${selected.size} ${selected.size > 1 ? 'lignes' : 'ligne'}`}
          >
            <QuoteIcon size={18} color={colors.dark900} strokeWidth={2.2} />
            <Text style={styles.citeText}>Citer</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

/** Le voile qui balaie la page pendant la lecture */
function Sweep({ height }: { height: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: progress.value * (height - 60) }] }));
  return <Animated.View entering={FadeIn} style={[styles.sweep, style]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#120c09',
    gap: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  spacer: {
    width: 36,
  },
  hint: {
    flex: 1,
    alignItems: 'center',
  },
  hintText: {
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: creamAlpha(0.92),
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  stage: {
    flex: 1,
    marginHorizontal: spacing.lg,
  },
  photo: {
    position: 'absolute',
    borderRadius: 6,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    borderRadius: 3,
  },
  // Comme un stabilo : la couleur se mélange à l'encre au lieu de la couvrir
  lineOn: {
    backgroundColor: HIGHLIGHT,
    mixBlendMode: 'multiply',
  },
  sweep: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: creamAlpha(0.18),
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  retake: {
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
  },
  retakeText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: creamAlpha(0.85),
  },
  cite: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  citeText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
});

