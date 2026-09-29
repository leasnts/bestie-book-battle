/**
 * QuickNoteBar — la barre d'actions rapides de « Ma page ».
 *
 *   (✎) (☺)
 *
 * Deux façons d'annoter ma page enregistrée, sans quitter l'accueil, deux
 * ronds en verre ferrés à gauche, icône seule :
 * - ✎ : la feuille (`NoteComposer`), où tout se fait : écrire, dire (🎙), citer
 *   (❝), choisir le thème et la page. Un brouillon laissé met un point lie de
 *   vin sur le crayon ;
 * - ☺ : une réaction en un geste, sans note : la liste à la mode sort au-dessus
 *   de la barre et défile ; « + » ouvre tous les emojis (/emoji-note).
 *
 * Hauteur fixe : la barre et la rangée ↺ +14 ✓ de « Ma page » prennent la même
 * place, rien ne saute.
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { PenLineIcon, PlusIcon, SmilePlusIcon, XIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import { useQuickNote, type QuickNote } from '../../hooks/useQuickNote';
import { colors, creamAlpha, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import { TRENDING_EMOJIS } from '../../utils/emojis';
import GlassButton from './GlassButton';
import NoteComposer, { EMPTY_DRAFT, type ComposerDraft } from './NoteComposer';
import PressableScale from './PressableScale';

type Mode = 'idle' | 'emoji';

export const QUICK_BAR_HEIGHT = 52;

export default function QuickNoteBar() {
  const router = useRouter();
  const { post, posting, page, myPages } = useQuickNote();
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>('idle');
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState<ComposerDraft>(EMPTY_DRAFT);

  const closeMode = useCallback(() => setMode('idle'), []);

  /** Ajoute la note ; `false` si ça n'a pas marché (la personne est prévenue) */
  const add = useCallback(
    async (note: QuickNote) => {
      try {
        const done = await post(note);
        if (done) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        return done;
      } catch (error) {
        console.error('[Carnet] note rapide impossible', error);
        Alert.alert('Erreur', "La note n'a pas pu être ajoutée. Réessaie.");
        return false;
      }
    },
    [post],
  );

  const entering = reducedMotion ? undefined : FadeIn.duration(180);
  const exiting = reducedMotion ? undefined : FadeOut.duration(120);

  return (
    <View style={styles.bar}>
      <GlassButton
        icon={PenLineIcon}
        badge={!!(draft.body || draft.quote)}
        onPress={() => {
          setMode('idle');
          setWriting(true);
        }}
        accessibilityLabel={
          draft.body ? `Reprendre ma note sur la page ${page} : ${draft.body}` : `Écrire une note sur la page ${page}`
        }
      />
      <GlassButton
        icon={mode === 'emoji' ? XIcon : SmilePlusIcon}
        onPress={() => setMode(mode === 'emoji' ? 'idle' : 'emoji')}
        accessibilityLabel={mode === 'emoji' ? 'Fermer les emojis' : `Annoter la page ${page} d’un emoji`}
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
          <PressableScale
            style={styles.more}
            pressedScale={0.9}
            onPress={() => {
              closeMode();
              router.push('/emoji-note');
            }}
            accessibilityRole="button"
            accessibilityLabel="Tous les emojis"
          >
            <PlusIcon size={20} color={colors.dark900} strokeWidth={2.4} />
          </PressableScale>
        </Animated.View>
      )}

      <NoteComposer
        visible={writing}
        page={page}
        maxPage={myPages}
        draft={draft}
        onClose={(left) => {
          setDraft(left);
          setWriting(false);
        }}
        onPost={(note) => add(note)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: QUICK_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
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
  more: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: inkAlpha(0.07),
  },
});
