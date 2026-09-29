/**
 * QuickNoteBar — la barre d'actions rapides de « Ma page ».
 *
 *   (  ✎  ) (  🎙  ) (  ❝  ) (  ☺  )
 *
 * Quatre façons d'annoter ma page enregistrée, sans quitter l'accueil : quatre
 * gélules égales, icône seule, aucune n'est « la principale ». Une note est une
 * pensée, un avis ou un élément à retenir ; elle rejoint le carnet de notes :
 * - ✎ écrire : la feuille rapide (`NoteComposer`), la note en autocollant ; un
 *   brouillon laissé met un point lie de vin sur le crayon ;
 * - 🎙 : la barre DEVIENT l'enregistreur (`VoiceRecorder`, le même que partout),
 *   qui part tout de suite ; ■, puis ✓ pour ajouter la note ;
 * - ❝ citer : photographier la page, toucher les lignes à citer (`QuotePicker`),
 *   puis la feuille rapide avec le passage, modifiable ;
 * - ☺ : la liste à la mode sort au-dessus de la barre et défile ; « + » ouvre
 *   tous les emojis (/emoji-note).
 *
 * Mêmes pièces que partout : les gélules sont des `GlassButton` étirés, de la
 * hauteur de l'enregistreur ; ✓ est un `RoundButton`.
 * Hauteur fixe : la barre, l'enregistreur et la rangée ↺ +14 ✓ de « Ma page »
 * prennent la même place, rien ne saute.
 */

import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { CheckIcon, MicIcon, PenLineIcon, PlusIcon, QuoteIcon, SmilePlusIcon, XIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import { useQuickNote, type QuickNote } from '../../hooks/useQuickNote';
import { isAvailable as canReadPages } from '../../modules/page-text/src';
import type { VoiceClip } from '../../stores/annotationStore';
import { colors, creamAlpha, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import { TRENDING_EMOJIS } from '../../utils/emojis';
import GlassButton from './GlassButton';
import NoteComposer, { EMPTY_DRAFT, type ComposerDraft } from './NoteComposer';
import PressableScale from './PressableScale';
import QuotePicker, { type PagePhoto } from './QuotePicker';
import RoundButton from './RoundButton';
import VoiceRecorder from './VoiceRecorder';

type Mode = 'idle' | 'voice' | 'emoji';

export const QUICK_BAR_HEIGHT = 52;
/** Le temps qu'une vue plein écran finisse de se fermer avant d'en ouvrir une autre */
const MODAL_SWAP_MS = 450;
const GLASS = 44;

export default function QuickNoteBar() {
  const router = useRouter();
  const { post, posting, page } = useQuickNote();
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>('idle');
  const [clip, setClip] = useState<VoiceClip | null>(null);
  const [recording, setRecording] = useState(false);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState<ComposerDraft>(EMPTY_DRAFT);
  const [photo, setPhoto] = useState<PagePhoto | null>(null);
  const [quote, setQuote] = useState<string | null>(null);

  const closeMode = useCallback(() => {
    setClip(null);
    setRecording(false);
    setMode('idle');
  }, []);

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

  // La photo de la page. Sans appareil (simulateur), on la choisit dans la photothèque.
  const takePhoto = useCallback(async () => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };
    let result: ImagePicker.ImagePickerResult;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Appareil photo', "Autorise l'appareil photo dans les réglages pour citer une page.", [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Réglages', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } catch {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    const asset = result.canceled ? null : result.assets[0];
    setPhoto(asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null);
  }, []);

  const entering = reducedMotion ? undefined : FadeIn.duration(180);
  const exiting = reducedMotion ? undefined : FadeOut.duration(120);

  if (mode === 'voice') {
    return (
      <Animated.View style={styles.bar} entering={entering} exiting={exiting}>
        <View style={styles.grow}>
          <VoiceRecorder clip={clip} onChange={setClip} onRecordingChange={setRecording} autoStart />
        </View>
        {clip && !recording ? (
          <RoundButton
            icon={CheckIcon}
            variant="dark"
            label="Ajouter la note vocale au carnet de notes"
            disabled={posting}
            onPress={async () => {
              if (await add({ voice: clip })) closeMode();
            }}
          />
        ) : (
          <GlassButton icon={XIcon} size={GLASS} onPress={closeMode} accessibilityLabel="Annuler la note vocale" />
        )}
      </Animated.View>
    );
  }

  return (
    <View style={styles.bar}>
      <GlassButton
        icon={PenLineIcon}
        size={QUICK_BAR_HEIGHT}
        stretch
        badge={!!draft.body}
        onPress={() => {
          setMode('idle');
          setWriting(true);
        }}
        accessibilityLabel={draft.body ? `Reprendre ma note sur la page ${page} : ${draft.body}` : `Annoter la page ${page} par écrit`}
      />
      <GlassButton
        icon={MicIcon}
        size={QUICK_BAR_HEIGHT}
        stretch
        onPress={() => setMode('voice')}
        accessibilityLabel={`Annoter la page ${page} en vocal`}
      />
      {canReadPages && (
        <GlassButton
          icon={QuoteIcon}
          size={QUICK_BAR_HEIGHT}
          stretch
          onPress={takePhoto}
          accessibilityLabel={`Annoter la page ${page} d’une citation : photographier la page`}
        />
      )}
      <GlassButton
        icon={mode === 'emoji' ? XIcon : SmilePlusIcon}
        size={QUICK_BAR_HEIGHT}
        stretch
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
        draft={draft}
        onClose={(left) => {
          setDraft(left);
          setWriting(false);
        }}
        onPost={({ body, voice, category }) => add({ body, voice, category })}
      />

      <QuotePicker
        photo={photo}
        onClose={() => setPhoto(null)}
        // iOS ne présente pas une vue par-dessus une autre qui se ferme : on attend la fin du fondu
        onRetake={() => {
          setPhoto(null);
          setTimeout(takePhoto, MODAL_SWAP_MS);
        }}
        onCite={(passage) => {
          setPhoto(null);
          setTimeout(() => setQuote(passage), MODAL_SWAP_MS);
        }}
      />

      {/* La citation : le passage (modifiable), puis ma pensée ou mon avis, écrit ou dit */}
      <NoteComposer
        visible={quote !== null}
        page={page}
        draft={EMPTY_DRAFT}
        quote={quote}
        onClose={() => setQuote(null)}
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
  grow: {
    flex: 1,
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
