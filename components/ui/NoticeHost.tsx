/**
 * NoticeHost — le bandeau d'erreur de l'app (#205), monté une fois à la racine.
 *
 * On l'appelle par `oops()` ou `nudge()` (utils/notice.ts), jamais directement.
 *
 * - Une carte rouge Lowki (dégradé, jamais d'aplat) qui naît de la Dynamic
 *   Island, à la Opal : l'icône dans un rond cerclé, ce qui s'est passé, quoi faire, et « Réessayer » en pleine largeur dessous quand l'action peut être
 *   relancée. Rouge plutôt que chocolat : en chocolat, elle se lisait comme un
 *   bouton (Lea, 2026-11-05).
 * - Même marge intérieure partout (`PADDING`), entre le texte et le bouton aussi.
 * - Au-dessus de tout, sheets natifs compris : `FullWindowOverlay` la pose dans
 *   sa propre fenêtre iOS. Une vue à la racine passerait sous un formSheet.
 * - Elle part seule (5 s, 8 s avec « Réessayer »), ou au toucher.
 * - Reduce Motion : fondu seul, sans déploiement.
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
import { accentGradient, colors, fonts, lowki, motion, ROUND_BUTTON_SIZE, spacing, dropShadow } from '../../utils/constants';
import { useNoticeStore, type Notice } from '../../utils/notice';
import PressableScale from './PressableScale';

/** Marge intérieure, identique sur les quatre côtés et entre texte et bouton */
const PADDING = spacing.lg;
/** Concentrique avec les coins de l'écran, comme les cartes à la Opal */
const RADIUS = 32;
/** Le bouton, concentrique avec la carte */
const BUTTON_RADIUS = RADIUS - PADDING;
/** Texte sur le rouge : même teinte, très claire (≥ 5:1 sur le haut du dégradé) */
const ON_RED = '#fbe9ea';
const ON_RED_SOFT = '#f6dadc';
/** Le rond de l'icône : la taille des boutons ronds de l'app */
const BADGE = ROUND_BUTTON_SIZE;
const BADGE_ICON = 20;
const LIFETIME = 5000;
const LIFETIME_WITH_RETRY = 8000;
/** Taille de départ, ramassée comme la Dynamic Island */
const FROM_SCALE_X = 0.36;
const FROM_SCALE_Y = 0.2;

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
        easing: Easing.bezier(...motion.easing.easeOutQuint),
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

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: reducedMotion ? p : Math.min(1, p * 2.5),
      transform: reducedMotion
        ? []
        : [
            { scaleX: FROM_SCALE_X + (1 - FROM_SCALE_X) * p },
            { scaleY: FROM_SCALE_Y + (1 - FROM_SCALE_Y) * p },
          ],
    };
  });

  if (!shown) return null;

  const Icon = ICONS[shown.kind];
  const retry = shown.retry;

  const banner = (
    <View style={[styles.layer, { top: insets.top }]} pointerEvents="box-none">
      <Animated.View style={[styles.shadow, animatedStyle]}>
        <Pressable
          onPress={() => hide(shown.id)}
          accessibilityRole="alert"
          accessibilityLabel={[shown.title, shown.hint].filter(Boolean).join('. ')}
          accessibilityHint="Touche pour fermer"
        >
          <LinearGradient colors={accentGradient} style={styles.card}>
            <View style={styles.row}>
              {/* L'icône a sa place, dans un rond cerclé, comme les feuilles d'Opal */}
              <LinearGradient colors={[lowki.red.dark, lowki.red.deep]} style={styles.badge}>
                <Icon size={BADGE_ICON} color={ON_RED} strokeWidth={2.2} />
              </LinearGradient>
              <View style={styles.texts}>
                <Text style={styles.title}>{shown.title}</Text>
                {shown.hint ? <Text style={styles.hint}>{shown.hint}</Text> : null}
              </View>
            </View>
            {retry ? (
              <PressableScale
                pressedScale={0.97}
                onPress={() => {
                  hide(shown.id);
                  retry();
                }}
                accessibilityRole="button"
                accessibilityLabel="Réessayer"
              >
                <LinearGradient colors={[lowki.red.dark, lowki.red.deep]} style={styles.retry}>
                  <RotateCw size={15} color={ON_RED} strokeWidth={2.4} />
                  <Text style={styles.retryText}>Réessayer</Text>
                </LinearGradient>
              </PressableScale>
            ) : null}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );

  return Platform.OS === 'ios' ? <FullWindowOverlay>{banner}</FullWindowOverlay> : banner;
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
  },
  // L'ombre vit hors de la carte ; elle se déploie depuis le haut, comme l'île
  shadow: {
    borderRadius: RADIUS,
    transformOrigin: 'top',
    boxShadow: dropShadow(10, 24, 0.28),
  },
  card: {
    borderRadius: RADIUS,
    padding: PADDING,
    gap: PADDING,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,233,234,0.22)',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: ON_RED,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: ON_RED_SOFT,
  },
  retry: {
    height: 44,
    borderRadius: BUTTON_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: ON_RED,
  },
});
