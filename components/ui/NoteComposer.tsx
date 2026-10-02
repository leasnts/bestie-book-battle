/**
 * NoteComposer — annoter la page sur place, depuis « Ma page » (✎).
 *
 * La feuille monte juste au-dessus du clavier, l'accueil s'assombrit derrière :
 * on annote sans quitter l'écran. ↗ la déplie en pleine page ; ↙ la replie.
 * Tout se fait ici : écrire, dire (🎙), citer (❝), choisir le thème.
 *
 *   (✕) (p. 157)                (↗) (✓)   une seule taille sur la ligne : 42 pt
 *   ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐
 *   ┆ ▌« le passage cité »          ┆   la note (`NoteDraft`) : courte au départ,
 *   ┆ Une pensée, un avis…          ┆   elle grandit avec le texte jusqu'à un
 *   ┆ note               (🎙) (❝)   ┆   plafond, puis défile
 *   └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘
 *     ╰📌╯╰♥╯╰🔥╯╰☁╯╰🎭╯╰💡╯            le thème, en intercalaires dessous
 *
 * - « p. 157 » : ma page enregistrée, qu'on peut changer (pavé numérique) ;
 * - 🎙 n'ouvre l'enregistreur qu'au toucher ; ❝ photographie la page, on
 *   touche les lignes (`QuotePicker`), le passage arrive en tête, modifiable.
 *
 * Mêmes pièces que partout : `GlassButton` pour ✕ et ↗, `RoundButton` pour ✓,
 * `NoteDraft` et `CategoryPicker` comme dans l'éditeur de note.
 *
 * Toucher un bouton pendant qu'on tape agit tout de suite, sans d'abord fermer
 * le clavier. ✕ ou le fond : la feuille se referme et **garde le brouillon**.
 */

import * as ImagePicker from 'expo-image-picker';
import { CheckIcon, Maximize2Icon, Minimize2Icon, XIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
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
import { isAvailable as canReadPages } from '../../modules/page-text/src';
import type { VoiceClip } from '../../stores/annotationStore';
import type { AnnotationCategory } from '../../types/supabase';
import { ANNOTATION_CATEGORIES, DEFAULT_CATEGORY } from '../../utils/annotations';
import { colors, creamAlpha, fonts, glassControlVeil, motion, shadowAlpha, spacing } from '../../utils/constants';
import CategoryPicker, { tabStitchNotch } from './CategoryPicker';
import GlassButton from './GlassButton';
import GlassMaterial from './GlassMaterial';
import NoteDraft from './NoteDraft';
import QuotePicker, { type PagePhoto } from './QuotePicker';
import RoundButton, { ROUND_BUTTON_SIZE } from './RoundButton';

/** Ce que la feuille garde quand on la ferme sans ajouter la note */
export interface ComposerDraft {
  body: string;
  quote: string;
  category: AnnotationCategory;
}

export interface ComposedNote {
  body: string;
  quote: string | null;
  voice: VoiceClip | null;
  category: AnnotationCategory;
  page: number;
}

interface NoteComposerProps {
  visible: boolean;
  /** Ma page enregistrée : la page proposée */
  page: number;
  /** Le nombre de pages de mon édition, le plafond de la page choisie */
  maxPage: number;
  /** Le brouillon laissé la dernière fois */
  draft: ComposerDraft;
  /** Fermer sans ajouter : on rend le brouillon */
  onClose: (draft: ComposerDraft) => void;
  /** Ajouter la note. `false` : ça n'a pas marché, la feuille reste ouverte. */
  onPost: (note: ComposedNote) => Promise<boolean>;
}

export const EMPTY_DRAFT: ComposerDraft = { body: '', quote: '', category: DEFAULT_CATEGORY };

/** L'écart entre la feuille et le clavier */
const GAP = spacing.md;
/** Une seule taille de bouton sur la ligne du haut : celle de ✓ */
const HEAD_BUTTON = ROUND_BUTTON_SIZE;
/** iOS ne présente pas une vue par-dessus une autre qui se ferme : on attend la fin du fondu */
const MODAL_SWAP_MS = 450;

export default function NoteComposer({ visible, page, maxPage, draft, onClose, onPost }: NoteComposerProps) {
  const [body, setBody] = useState(draft.body);
  const [category, setCategory] = useState(draft.category);
  const [passage, setPassage] = useState(draft.quote);
  const [voice, setVoice] = useState<VoiceClip | null>(null);
  const [recording, setRecording] = useState(false);
  const [full, setFull] = useState(false);
  const [posting, setPosting] = useState(false);
  const [pageText, setPageText] = useState(String(page));
  const [photo, setPhoto] = useState<PagePhoto | null>(null);
  const input = useRef<TextInput>(null);
  const pageInput = useRef<TextInput>(null);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const reducedMotion = useReducedMotion();

  const shown = useSharedValue(0);
  const expanded = useSharedValue(0);
  /** La hauteur de ce que contient la feuille : elle se pose à sa taille */
  const contentHeight = useSharedValue(0);

  // Chaque ouverture repart du brouillon, sur ma page enregistrée
  useEffect(() => {
    if (!visible) return;
    setBody(draft.body);
    setCategory(draft.category);
    setPassage(draft.quote);
    setVoice(null);
    setFull(false);
    setPageText(String(page));
    expanded.value = 0;
    shown.value = withTiming(1, timing(reducedMotion));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /** La page choisie, toujours entre 1 et la dernière page de mon édition */
  const chosenPage = clampPage(Number(pageText), page, maxPage);

  const toggleFull = () => {
    const next = !full;
    setFull(next);
    expanded.value = withTiming(next ? 1 : 0, timing(reducedMotion));
  };

  const leave = (then: () => void) => {
    shown.value = withTiming(0, timing(reducedMotion, 180));
    setTimeout(then, reducedMotion ? 0 : 180);
  };

  const close = () => leave(() => onClose({ body, quote: passage, category }));

  const empty = !body.trim() && !passage.trim() && !voice;

  const post = async () => {
    if (empty || recording || posting) return;
    setPosting(true);
    const done = await onPost({
      body: body.trim(),
      quote: passage.trim() || null,
      voice,
      category,
      page: chosenPage,
    });
    setPosting(false);
    if (done) leave(() => onClose(EMPTY_DRAFT));
  };

  // ❝ : la photo de la page. Sans appareil (simulateur), on la choisit dans la photothèque.
  const takePhoto = async () => {
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
  };

  const veilStyle = useAnimatedStyle(() => ({ opacity: shown.value }));

  // Sur place : posée au-dessus du clavier, à la hauteur de son contenu.
  // Dépliée : tout l'écran au-dessus du clavier.
  const sheetStyle = useAnimatedStyle(() => {
    const kb = keyboard.height.value;
    const e = expanded.value;
    const placeTop = Math.max(insets.top, windowHeight - kb - GAP - contentHeight.value);
    return {
      top: interpolate(e, [0, 1], [placeTop, 0]),
      bottom: interpolate(e, [0, 1], [kb + GAP, kb]),
      left: interpolate(e, [0, 1], [spacing.lg, 0]),
      right: interpolate(e, [0, 1], [spacing.lg, 0]),
      borderRadius: interpolate(e, [0, 1], [28, 0]),
      // Le haut du contenu garde sa marge : l'ombre des boutons n'est jamais coupée
      paddingTop: interpolate(e, [0, 1], [0, insets.top]),
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
          contentContainerStyle={[styles.content, full && styles.contentFull]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={(_, height) => {
            if (!full) contentHeight.value = height;
          }}
        >
          <View style={styles.head}>
            <GlassButton
              icon={XIcon}
              onPress={close}
              accessibilityLabel="Fermer, garder le brouillon"
            />
            {/* La page de la note : ma page enregistrée, qu'on peut changer */}
            <Pressable
              style={styles.page}
              onPress={() => pageInput.current?.focus()}
              accessibilityRole="button"
              accessibilityLabel={`Page ${chosenPage}, changer la page`}
            >
              {/* Le même verre que les boutons ronds : on voit qu'elle se touche */}
              <GlassMaterial radius={HEAD_BUTTON / 2} veil={glassControlVeil} rim />
              <Text style={styles.pageLabel}>p.</Text>
              <TextInput
                ref={pageInput}
                style={styles.pageInput}
                value={pageText}
                onChangeText={(text) => setPageText(text.replace(/[^0-9]/g, '').slice(0, 5))}
                onEndEditing={() => setPageText(String(chosenPage))}
                keyboardType="number-pad"
                selectTextOnFocus
                maxLength={5}
                accessibilityLabel="Page de la note"
              />
            </Pressable>
            <View style={styles.grow} />
            <GlassButton
              icon={full ? Minimize2Icon : Maximize2Icon}
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

          {/* La note, puis le thème en intercalaires, collés : aucun écart entre les deux */}
          <View style={[styles.note, full && styles.grow]}>
            {/* Par-dessus : le haut des intercalaires glisse sous la note */}
            <View style={[styles.sticker, full && styles.grow]}>
              <NoteDraft
                ref={input}
                id="composer"
                color={style.color}
                label={style.label}
                quote={passage ? passage : null}
                onQuoteChange={setPassage}
                body={body}
                onBodyChange={setBody}
                placeholder={
                  passage ? 'Ta pensée, ton avis sur ce passage…' : 'Une pensée, un avis, un élément à retenir…'
                }
                voice={voice}
                onVoiceChange={setVoice}
                onRecordingChange={setRecording}
                large={full}
                corner="none"
                fill={full}
                tools
                onCite={canReadPages ? takePhoto : undefined}
                // La couture descend dans l'intercalaire choisi : une seule pièce
                stitchNotch={(width) => tabStitchNotch(width, category)}
                autoFocus
              />
            </View>
            <CategoryPicker value={category} onChange={setCategory} layout="tabs" />
          </View>
        </ScrollView>
      </Animated.View>

      <QuotePicker
        photo={photo}
        onClose={() => setPhoto(null)}
        onRetake={() => {
          setPhoto(null);
          setTimeout(takePhoto, MODAL_SWAP_MS);
        }}
        onCite={(cited) => {
          setPhoto(null);
          setPassage(cited);
        }}
      />
    </Modal>
  );
}

/** Une page tapée hors de l'édition revient dans ses bornes ; vide, ma page */
function clampPage(value: number, fallback: number, maxPage: number) {
  if (!Number.isFinite(value) || value < 1) return Math.max(1, fallback);
  return maxPage > 0 ? Math.min(maxPage, Math.round(value)) : Math.round(value);
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
  // Des marges tout autour, plus larges que l'ombre des boutons en verre :
  // le défilement coupe tout ce qui dépasse
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  contentFull: {
    flexGrow: 1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  grow: {
    flex: 1,
  },
  // La page : une gélule en verre qu'on touche pour la changer, de la hauteur
  // des boutons, avec la même ombre que `GlassButton`
  page: {
    height: HEAD_BUTTON,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md + 2,
    borderRadius: HEAD_BUTTON / 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  pageLabel: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textSecondary,
  },
  pageInput: {
    minWidth: 24,
    paddingVertical: 0,
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  // Un peu d'air entre la ligne du haut et la note
  note: {
    marginTop: spacing.sm,
  },
  sticker: {
    zIndex: 1,
  },
});
