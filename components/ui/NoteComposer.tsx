/**
 * NoteComposer — annoter la page sur place, depuis « Ma page ».
 *
 * La feuille monte juste au-dessus du clavier, l'accueil s'assombrit derrière :
 * on annote sans quitter l'écran. ↗ la déplie en pleine page ; ↙ la replie.
 *
 *   (✕)  Page 157                (↗)  [✓]
 *   ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐
 *   ┆ À RETENIR                     ┆   la note, en autocollant (`NoteDraft`) :
 *   ┆ Une pensée, un avis…          ┆   texte, citation, vocal, tout dedans
 *   ┆ (🎙 ──────────────── 0:00)    ┆
 *   └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄◢┘
 *   [Coup de cœur] [Spicy] [Larmes] …     la couleur (`CategoryPicker`)
 *
 * Mêmes pièces que partout : `GlassButton` pour ✕ et ↗ (comme l'en-tête des
 * sheets), `RoundButton` pour ✓ (comme ✓ enregistrer), `NoteDraft` et
 * `CategoryPicker` comme dans l'éditeur de note.
 *
 * Toucher un bouton pendant qu'on tape agit tout de suite, sans d'abord fermer
 * le clavier. ✕ ou le fond : la feuille se referme et **garde le brouillon**.
 */

import { CheckIcon, Maximize2Icon, Minimize2Icon, XIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { VoiceClip } from '../../stores/annotationStore';
import type { AnnotationCategory } from '../../types/supabase';
import { ANNOTATION_CATEGORIES, DEFAULT_CATEGORY } from '../../utils/annotations';
import { colors, creamAlpha, fonts, motion, shadowAlpha, spacing } from '../../utils/constants';
import CategoryPicker from './CategoryPicker';
import GlassButton from './GlassButton';
import NoteDraft from './NoteDraft';
import RoundButton from './RoundButton';

/** Ce que la feuille garde quand on la ferme sans ajouter la note */
export interface ComposerDraft {
  body: string;
  category: AnnotationCategory;
}

export interface ComposedNote {
  body: string;
  quote: string | null;
  voice: VoiceClip | null;
  category: AnnotationCategory;
}

interface NoteComposerProps {
  visible: boolean;
  page: number;
  /** Le brouillon laissé la dernière fois */
  draft: ComposerDraft;
  /** Le passage cité (photo de la page), modifiable ; `null` : pas de citation */
  quote?: string | null;
  /** Fermer sans ajouter : on rend le brouillon */
  onClose: (draft: ComposerDraft) => void;
  /** Ajouter la note. `false` : ça n'a pas marché, la feuille reste ouverte. */
  onPost: (note: ComposedNote) => Promise<boolean>;
}

export const EMPTY_DRAFT: ComposerDraft = { body: '', category: DEFAULT_CATEGORY };

/** La feuille sur place ; plus haute avec une citation */
const SHEET_HEIGHT = 360;
const SHEET_HEIGHT_QUOTE = 440;
/** L'écart entre la feuille et le clavier */
const GAP = spacing.md;

export default function NoteComposer({ visible, page, draft, quote = null, onClose, onPost }: NoteComposerProps) {
  const [body, setBody] = useState(draft.body);
  const [category, setCategory] = useState(draft.category);
  const [passage, setPassage] = useState(quote ?? '');
  const [voice, setVoice] = useState<VoiceClip | null>(null);
  const [recording, setRecording] = useState(false);
  const [full, setFull] = useState(false);
  const [posting, setPosting] = useState(false);
  const input = useRef<TextInput>(null);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const reducedMotion = useReducedMotion();

  const shown = useSharedValue(0);
  const expanded = useSharedValue(0);
  const isQuote = quote !== null;
  const sheetHeight = isQuote ? SHEET_HEIGHT_QUOTE : SHEET_HEIGHT;

  // Chaque ouverture repart du brouillon (ou du passage cité), sur place
  useEffect(() => {
    if (!visible) return;
    setBody(draft.body);
    setCategory(draft.category);
    setPassage(quote ?? '');
    setVoice(null);
    setFull(false);
    expanded.value = 0;
    shown.value = withTiming(1, timing(reducedMotion));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleFull = () => {
    const next = !full;
    setFull(next);
    expanded.value = withTiming(next ? 1 : 0, timing(reducedMotion));
  };

  const leave = (then: () => void) => {
    shown.value = withTiming(0, timing(reducedMotion, 180));
    setTimeout(then, reducedMotion ? 0 : 180);
  };

  const close = () => leave(() => onClose({ body, category }));

  const empty = !body.trim() && !passage.trim() && !voice;

  const post = async () => {
    if (empty || recording || posting) return;
    setPosting(true);
    const done = await onPost({
      body: body.trim(),
      quote: isQuote ? passage.trim() || null : null,
      voice,
      category,
    });
    setPosting(false);
    if (done) leave(() => onClose(EMPTY_DRAFT));
  };

  const veilStyle = useAnimatedStyle(() => ({ opacity: shown.value }));

  // Sur place : posée au-dessus du clavier. Dépliée : tout l'écran au-dessus du clavier.
  const sheetStyle = useAnimatedStyle(() => {
    const kb = keyboard.height.value;
    const e = expanded.value;
    const placeTop = Math.max(insets.top, windowHeight - kb - GAP - sheetHeight);
    return {
      top: interpolate(e, [0, 1], [placeTop, 0]),
      bottom: interpolate(e, [0, 1], [kb + GAP, kb]),
      left: interpolate(e, [0, 1], [spacing.lg, 0]),
      right: interpolate(e, [0, 1], [spacing.lg, 0]),
      borderRadius: interpolate(e, [0, 1], [28, 0]),
      paddingTop: interpolate(e, [0, 1], [spacing.md, insets.top + spacing.sm]),
      opacity: shown.value,
      transform: [{ translateY: (1 - shown.value) * 24 }],
    };
  });

  const style = ANNOTATION_CATEGORIES[category];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.veil, veilStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Fermer, garder le brouillon" />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* `always` : un toucher sur ✓ ou ↗ agit tout de suite, clavier ouvert */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.head}>
            <GlassButton icon={XIcon} size={36} onPress={close} accessibilityLabel="Fermer, garder le brouillon" />
            <Text style={[styles.page, full && styles.pageFull]}>Page {page}</Text>
            <GlassButton
              icon={full ? Minimize2Icon : Maximize2Icon}
              size={36}
              onPress={toggleFull}
              accessibilityLabel={full ? 'Replier la note' : 'Annoter en pleine page'}
            />
            <RoundButton
              icon={CheckIcon}
              variant="dark"
              label="Ajouter la note au carnet de notes"
              disabled={empty || recording || posting}
              onPress={post}
            />
          </View>

          <NoteDraft
            ref={input}
            id="composer"
            color={style.color}
            label={style.label}
            quote={isQuote ? passage : null}
            onQuoteChange={setPassage}
            body={body}
            onBodyChange={setBody}
            placeholder={isQuote ? 'Ta pensée, ton avis sur ce passage…' : 'Une pensée, un avis, un élément à retenir…'}
            voice={voice}
            onVoiceChange={setVoice}
            onRecordingChange={setRecording}
            large={full}
            fill
            autoFocus
          />

          <CategoryPicker value={category} onChange={setCategory} layout="row" />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function timing(reducedMotion: boolean, duration = motion.duration.standard) {
  return {
    duration: reducedMotion ? 0 : duration,
    easing: Easing.bezier(...motion.easing.easeOutQuart),
  };
}

const styles = StyleSheet.create({
  veil: {
    backgroundColor: shadowAlpha(0.3),
  },
  sheet: {
    position: 'absolute',
    backgroundColor: creamAlpha(0.98),
    overflow: 'hidden',
    shadowColor: shadowAlpha(0.3),
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  page: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  pageFull: {
    fontSize: 28,
  },
});
