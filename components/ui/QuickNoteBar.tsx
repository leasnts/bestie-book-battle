/**
 * QuickNoteBar — la barre d'actions rapides de « Ma page ».
 *
 *             (✎) (☺)
 *
 * Deux façons d'annoter ma page enregistrée, sans quitter l'accueil, deux
 * ronds chocolat (`RoundButton` dark) centrés sur l'écran, icône seule :
 * - ✎ : la feuille (`NoteComposer`), où tout se fait : écrire, dire (🎙), citer
 *   (❝), choisir le thème et la page (`WriteNoteButton`, le même que dans le
 *   carnet) ;
 * - ☺ : une réaction en un geste, sans note : la liste à la mode sort au-dessus
 *   de la barre et défile ; « + » (secondaire, en verre) ouvre tous les emojis
 *   (/emoji-note).
 *
 * Hauteur fixe : la barre et la rangée ↺ +14 ✓ de « Ma page » prennent la même
 * place, rien ne saute.
 */

import { useRouter } from 'expo-router';
import { PlusIcon, SmilePlusIcon, XIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import { useQuickNote } from '../../hooks/useQuickNote';
import { creamAlpha, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import { TRENDING_EMOJIS } from '../../utils/emojis';
import PressableScale from './PressableScale';
import GlassButton from './GlassButton';
import RoundButton from './RoundButton';
import WriteNoteButton from './WriteNoteButton';

type Mode = 'idle' | 'emoji';

export const QUICK_BAR_HEIGHT = 52;

export default function QuickNoteBar() {
  const router = useRouter();
  const { add, posting, page } = useQuickNote();
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>('idle');

  const closeMode = useCallback(() => setMode('idle'), []);

  const entering = reducedMotion ? undefined : FadeIn.duration(180);
  const exiting = reducedMotion ? undefined : FadeOut.duration(120);

  return (
    <View style={styles.bar}>
      <WriteNoteButton onOpen={closeMode} />
      <RoundButton
        icon={mode === 'emoji' ? XIcon : SmilePlusIcon}
        variant="dark"
        onPress={() => setMode(mode === 'emoji' ? 'idle' : 'emoji')}
        label={mode === 'emoji' ? 'Fermer les emojis' : `Annoter la page ${page} d’un emoji`}
      />

      {mode === 'emoji' && (
        <Animated.View style={styles.emojis} entering={entering} exiting={exiting}>
          {/* La liste à la mode défile ; « + » ouvre tous les emojis */}
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

    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: QUICK_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  // Les emojis sortent au-dessus de la barre, sur toute sa largeur
  emojis: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: QUICK_BAR_HEIGHT + spacing.xs,
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
