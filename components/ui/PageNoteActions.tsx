/**
 * PageNoteActions — écrire sur MA page, depuis Ma page.
 *
 *          351   (+)
 *          /650  (☺+)
 *    ●●●●●●●●●○○○○○○○○
 *
 * Deux ronds en verre au bout de la ligne du chiffre (essai B, Lea, 2026-11-10).
 * Ils étaient en intercalaires sur le carré Carnet : collés à la note à la une,
 * on croyait qu'ils ajoutaient quelque chose à CETTE note. Ici, ils sont à côté
 * de ma page, celle qu'ils annotent.
 * - + : la feuille d'écriture (`useWriteNote`). Un brouillon laissé = point rouge.
 * - ☺+ : une réaction en un geste, sans note. La liste à la mode sort dessous
 *   (Lea, 2026-11-10 : pas à côté), sur toute la largeur, et défile ; « + » ouvre tous les
 *   emojis (/emoji-note). ✕ referme.
 *
 * Quand la page a changé, ↺ et ✓ prennent la ligne : ces deux-là s'effacent.
 */

import { useRouter } from 'expo-router';
import { PlusIcon, SmilePlusIcon, XIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import { useQuickNote } from '../../hooks/useQuickNote';
import { creamAlpha, inkAlpha, ROUND_BUTTON_SIZE, shadowAlpha, spacing, dropShadow } from '../../utils/constants';
import { TRENDING_EMOJIS } from '../../utils/emojis';
import GlassButton from './GlassButton';
import PressableScale from './PressableScale';
import { useWriteNote } from './WriteNoteButton';

export default function PageNoteActions() {
  const router = useRouter();
  const { add, posting, page } = useQuickNote();
  const { open, draft, sheet } = useWriteNote();
  const reducedMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const close = () => setEmojiOpen(false);

  return (
    <View style={styles.column} pointerEvents="box-none">
      <GlassButton
        icon={PlusIcon}
        badge={!!(draft.body || draft.quote)}
        accessibilityLabel={
          draft.body ? `Reprendre ma note sur la page ${page} : ${draft.body}` : `Écrire une note sur la page ${page}`
        }
        onPress={() => {
          close();
          open();
        }}
      />
      <View>
        <GlassButton
          icon={emojiOpen ? XIcon : SmilePlusIcon}
          accessibilityLabel={emojiOpen ? 'Fermer les emojis' : `Annoter la page ${page} d’un emoji`}
          onPress={() => setEmojiOpen((o) => !o)}
        />
        {emojiOpen && (
          // Sous le rond, ferrée sur son bord droit, sur toute la largeur
          <Animated.View
            style={[styles.emojis, { width: screenWidth - spacing.lg * 2 }]}
            entering={reducedMotion ? undefined : FadeIn.duration(180)}
            exiting={reducedMotion ? undefined : FadeOut.duration(120)}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
              {TRENDING_EMOJIS.map((emoji, index) => (
                <Animated.View key={emoji} entering={reducedMotion ? undefined : ZoomIn.delay(index * 25).duration(200)}>
                  <PressableScale
                    style={styles.emoji}
                    pressedScale={0.85}
                    disabled={posting}
                    onPress={async () => {
                      if (await add({ emoji })) close();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Annoter la page ${page} de ${emoji}`}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </PressableScale>
                </Animated.View>
              ))}
            </ScrollView>
            <GlassButton
              icon={PlusIcon}
              accessibilityLabel="Tous les emojis"
              onPress={() => {
                close();
                router.push('/emoji-note');
              }}
            />
          </Animated.View>
        )}
      </View>
      {sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  // Ferrés au bord droit, centrés sur la hauteur du chiffre
  column: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emojis: {
    position: 'absolute',
    right: 0,
    top: ROUND_BUTTON_SIZE + spacing.sm,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 26,
    backgroundColor: creamAlpha(0.97),
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
    boxShadow: dropShadow(8, 16, 0.25),
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
