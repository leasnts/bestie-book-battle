/**
 * NoteTabs — les intercalaires du carré Carnet de l'accueil.
 *
 *              ╭ ✎ ╮╭ ☺ ╮
 *    ┌┄┄┄┄┄┄┄┄┴┄┄┄┴┴┄┄┄┴┄┐
 *    ┆ la note à la une ┆
 *
 * Annoter ma page, c'est écrire dans le carnet : les deux actions sortent du
 * haut de sa note, ferrées à droite, en verre comme nos boutons ronds (Lea,
 * 2026-10-09 : plus de chocolat), comme les intercalaires de la feuille d'écriture
 * (`CategoryPicker`), au lieu de flotter seules sous la règle (Lea,
 * 2026-10-05).
 * - ✎ : la feuille (`NoteComposer`), où tout se fait (`useWriteNote`, la même
 *   que dans le carnet). Un brouillon laissé met un point lie de vin dessus.
 * - ☺ : une réaction en un geste, sans note. L'intercalaire se tire d'un cran ;
 *   la liste à la mode sort au-dessus, sur toute la largeur du bento, et
 *   défile ; « + » (en verre) ouvre tous les emojis (/emoji-note).
 *
 * À poser dans la cellule du carré, AVANT la note : le bas des intercalaires
 * glisse dessous (`NOTE_TABS_TUCK`). La cellule laisse `NOTE_TABS_HEIGHT` au-dessus.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PenLineIcon, PlusIcon, SmilePlusIcon, XIcon, type LucideIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useQuickNote } from '../../hooks/useQuickNote';
import { borderRadius, colors, creamAlpha, inkAlpha, motion, shadowAlpha, spacing } from '../../utils/constants';
import { TRENDING_EMOJIS } from '../../utils/emojis';
import GlassButton from './GlassButton';
import GlassMaterial from './GlassMaterial';
import PressableScale from './PressableScale';
import { useWriteNote } from './WriteNoteButton';

/** La part d'un intercalaire cachée sous la note */
export const NOTE_TABS_TUCK = 10;
/** La part visible : ce que la cellule laisse au-dessus de la note */
export const NOTE_TABS_HEIGHT = 36;
/** Ce que l'intercalaire tiré dépasse en plus */
const TAB_PULL = 8;
const TAB_WIDTH = 56;
const TAB_ICON = 20;
/** Tirer un intercalaire : lent à la fin, comme un onglet de papier qui glisse */
const TAB_IN_MS = 420;
/** Un voile sable sur le verre : nu, il sort blanc laiteux sur le papier (Lea, 2026-10-09) */
const TAB_TINT = ['rgba(214, 184, 150, 0.35)', 'rgba(183, 156, 127, 0.5)'] as const;



type Mode = 'idle' | 'emoji';

export default function NoteTabs() {
  const router = useRouter();
  const { add, posting, page } = useQuickNote();
  const { open, draft, sheet } = useWriteNote();
  const reducedMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();
  const [mode, setMode] = useState<Mode>('idle');

  const closeMode = useCallback(() => setMode('idle'), []);
  const entering = reducedMotion ? undefined : FadeIn.duration(180);
  const exiting = reducedMotion ? undefined : FadeOut.duration(120);
  const emojiOpen = mode === 'emoji';

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <View style={styles.tabs}>
      <Tab
        icon={PenLineIcon}
        badge={!!(draft.body || draft.quote)}
        label={draft.body ? `Reprendre ma note sur la page ${page} : ${draft.body}` : `Écrire une note sur la page ${page}`}
        onPress={() => {
          closeMode();
          open();
        }}
      />
      <Tab
        icon={emojiOpen ? XIcon : SmilePlusIcon}
        pulled={emojiOpen}
        label={emojiOpen ? 'Fermer les emojis' : `Annoter la page ${page} d’un emoji`}
        onPress={() => setMode(emojiOpen ? 'idle' : 'emoji')}
      />
      </View>

      {emojiOpen && (
        // Sur toute la largeur du bento, ferrée sur le bord droit du carré
        <Animated.View
          style={[styles.emojis, { width: screenWidth - spacing.lg * 2 }]}
          entering={entering}
          exiting={exiting}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
            {TRENDING_EMOJIS.map((emoji, index) => (
              <Animated.View key={emoji} entering={reducedMotion ? undefined : ZoomIn.delay(index * 25).duration(200)}>
                <PressableScale
                  style={styles.emoji}
                  pressedScale={0.85}
                  disabled={posting}
                  onPress={async () => {
                    if (await add({ emoji })) closeMode();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Annoter la page ${page} de ${emoji}`}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </PressableScale>
              </Animated.View>
            ))}
          </ScrollView>
          {/* Secondaire : le rond en verre, jamais un bouton-icône redessiné */}
          <GlassButton
            icon={PlusIcon}
            accessibilityLabel="Tous les emojis"
            onPress={() => {
              closeMode();
              router.push('/emoji-note');
            }}
          />
        </Animated.View>
      )}

      {sheet}
    </View>
  );
}

function Tab({
  icon: Icon,
  label,
  onPress,
  pulled = false,
  badge = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  pulled?: boolean;
  badge?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const out = useSharedValue(pulled ? 1 : 0);

  useEffect(() => {
    const to = pulled ? 1 : 0;
    if (reducedMotion) {
      out.value = to;
      return;
    }
    out.value = withTiming(to, {
      duration: pulled ? TAB_IN_MS : motion.duration.slow,
      easing: pulled ? Easing.bezier(...motion.easing.easeOutExpo) : Easing.bezier(...motion.easing.easeOutQuart),
    });
  }, [pulled, reducedMotion, out]);

  // Tiré, il monte : le bas reste glissé sous la note
  const tabStyle = useAnimatedStyle(() => ({
    height: NOTE_TABS_HEIGHT + NOTE_TABS_TUCK + out.value * TAB_PULL,
  }));

  return (
    <PressableScale
      style={styles.tabPress}
      pressedScale={0.94}
      // 44 pt touchables : la part visible, plus un peu au-dessus
      hitSlop={{ top: 8, left: 2, right: 2 }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tab, tabStyle]}>
        {/* Le verre de GlassButton : le bas, arrondi aussi, reste glissé sous la note */}
        <GlassMaterial radius={borderRadius.md} rim />
        <LinearGradient colors={TAB_TINT} style={[StyleSheet.absoluteFill, styles.tint]} pointerEvents="none" />
        <View style={styles.tabIcon}>
          <Icon size={TAB_ICON} color={colors.dark900} strokeWidth={2.25} />
          {badge && <View style={styles.badge} />}
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  // Toute la largeur du carré, posée sur son bord haut
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    marginBottom: -NOTE_TABS_TUCK,
  },
  // Ferrés à droite, au-dessus du « p. 197 »
  tabs: {
    paddingRight: spacing.lg,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs + 2,
  },
  tabPress: {
    justifyContent: 'flex-end',
  },
  // L'ombre douce de GlassButton, sans overflow pour ne pas la couper
  tab: {
    width: TAB_WIDTH,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    alignItems: 'center',
    paddingTop: (NOTE_TABS_HEIGHT - TAB_ICON) / 2,
  },
  tint: {
    borderRadius: borderRadius.md,
  },
  tabIcon: {
    width: TAB_ICON,
    height: TAB_ICON,
  },
  // Le point lie de vin de GlassButton
  badge: {
    position: 'absolute',
    top: -3,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  // Au-dessus de l'intercalaire tiré (sa part glissée sous la note comprise),
  // ferrée sur le bord droit du carré
  emojis: {
    position: 'absolute',
    right: 0,
    bottom: NOTE_TABS_HEIGHT + NOTE_TABS_TUCK + TAB_PULL + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 999,
    backgroundColor: creamAlpha(0.97),
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
    shadowColor: shadowAlpha(0.25),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  emojiRow: {
    gap: 2,
    paddingRight: spacing.xs,
  },
  emoji: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
});
