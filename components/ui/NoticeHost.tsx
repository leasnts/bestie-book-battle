/**
 * NoticeHost — le bandeau d'erreur de l'app (#205), monté une fois à la racine.
 *
 * On l'appelle par `oops()` ou `nudge()` (utils/notice.ts), jamais directement.
 *
 * - Une gélule en verre dépoli qui descend sous la Dynamic Island : une icône
 *   Lucide, ce qui s'est passé, quoi faire, et « Réessayer » en encre quand
 *   l'action peut être relancée.
 * - Au-dessus de tout, sheets natifs compris : `FullWindowOverlay` la pose dans
 *   sa propre fenêtre iOS. Une vue à la racine passerait sous un formSheet.
 * - Elle part seule (5 s, 8 s avec « Réessayer »), ou au toucher.
 * - Née dans une vue en fondu : le verre reste translucide (GlassMaterial).
 * - Reduce Motion : fondu seul, sans glissé.
 * - VoiceOver lit le message dès qu'il apparaît.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { CircleAlert, Info, RotateCw, WifiOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, inkGradient, motion, spacing } from '../../utils/constants';
import { useNoticeStore, type Notice } from '../../utils/notice';
import GlassMaterial from './GlassMaterial';
import PressableScale from './PressableScale';

const RADIUS = 24;
const LIFETIME = 5000;
const LIFETIME_WITH_RETRY = 8000;
/** D'où descend la gélule */
const DROP = -28;

const ICONS = { error: CircleAlert, offline: WifiOff, hint: Info } as const;

export default function NoticeHost() {
  const current = useNoticeStore((s) => s.current);
  const hide = useNoticeStore((s) => s.hide);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  // Le bandeau affiché reste à l'écran le temps de sa sortie, même une fois effacé du store
  const [shown, setShown] = useState<Notice | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (current) {
      setShown(current);
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: motion.duration.entrance,
        easing: Easing.bezier(...motion.easing.easeOutQuart),
      });
      AccessibilityInfo.announceForAccessibility(
        [current.title, current.hint].filter(Boolean).join('. '),
      );
      const timer = setTimeout(
        () => hide(current.id),
        current.retry ? LIFETIME_WITH_RETRY : LIFETIME,
      );
      return () => clearTimeout(timer);
    }
    progress.value = withTiming(
      0,
      { duration: motion.duration.standard, easing: Easing.bezier(...motion.easing.easeInQuart) },
      (finished) => {
        if (finished) runOnJS(setShown)(null);
      },
    );
  }, [current, hide, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reducedMotion ? 0 : (1 - progress.value) * DROP }],
  }));

  if (!shown) return null;

  const Icon = ICONS[shown.kind];
  const retry = shown.retry;

  const banner = (
    <View style={[styles.layer, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
      <Animated.View style={[styles.shadow, animatedStyle]}>
        <Pressable
          style={styles.banner}
          onPress={() => hide(shown.id)}
          accessibilityRole="alert"
          accessibilityLabel={[shown.title, shown.hint].filter(Boolean).join('. ')}
          accessibilityHint="Touche pour fermer"
        >
          <GlassMaterial radius={RADIUS} veil={0.72} rim frosted />
          <Icon size={20} color={colors.textPrimary} strokeWidth={2.2} />
          <View style={styles.texts}>
            <Text style={styles.title} numberOfLines={2}>
              {shown.title}
            </Text>
            {shown.hint ? (
              <Text style={styles.hint} numberOfLines={2}>
                {shown.hint}
              </Text>
            ) : null}
          </View>
          {retry ? (
            <PressableScale
              pressedScale={0.94}
              onPress={() => {
                hide(shown.id);
                retry();
              }}
              accessibilityRole="button"
              accessibilityLabel="Réessayer"
              hitSlop={8}
            >
              <LinearGradient colors={inkGradient} style={styles.retry}>
                <RotateCw size={14} color={colors.white} strokeWidth={2.4} />
                <Text style={styles.retryText}>Réessayer</Text>
              </LinearGradient>
            </PressableScale>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );

  return Platform.OS === 'ios' ? <FullWindowOverlay>{banner}</FullWindowOverlay> : banner;
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  // L'ombre vit hors du verre, sans overflow (comme GlassButton)
  shadow: {
    borderRadius: RADIUS,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  banner: {
    minHeight: 56,
    borderRadius: RADIUS,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
  },
  retry: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
});
