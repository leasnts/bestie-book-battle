/**
 * NoteComposer — écrire une note sur place, depuis la ligne de cahier de
 * « Ma page ».
 *
 * La feuille monte juste au-dessus du clavier, le reste de l'accueil s'assombrit
 * derrière : on écrit sans quitter l'écran. ↗ la déplie en pleine page, pour
 * écrire long ; ↙ la replie.
 *
 *   [✕]  Page 157          [↗] [✓]
 *   ─────────────────────────────
 *   │ Une pensée, un avis, un élément à retenir…
 *   ─────────────────────────────
 *
 * ✕ ou toucher le fond : la feuille se referme et **garde le brouillon**, qui
 * reste écrit sur la ligne de cahier. ✓ ajoute la note au carnet de notes (grisé
 * tant que c'est vide).
 *
 * Avec une citation (photo d'un passage) : le passage en tête, en italique, puis
 * ma pensée ou mon avis, à écrire ou à dire avec l'enregistreur (`VoiceRecorder`, le
 * même que partout).
 */

import { CheckIcon, Maximize2Icon, Minimize2Icon, XIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
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
import { colors, creamAlpha, fonts, inkAlpha, motion, shadowAlpha, spacing } from '../../utils/constants';
import type { VoiceClip } from '../../stores/annotationStore';
import PressableScale from './PressableScale';
import VoiceRecorder from './VoiceRecorder';

interface NoteComposerProps {
  visible: boolean;
  page: number;
  /** Le brouillon laissé la dernière fois */
  draft: string;
  /** Le passage cité, s'il y en a un */
  quote?: string | null;
  /** Fermer sans coller : on rend le brouillon */
  onClose: (draft: string) => void;
  /** Coller la note. `false` : ça n'a pas marché, la feuille reste ouverte. */
  onPost: (note: { body: string; voice: VoiceClip | null }) => Promise<boolean>;
}

/** La feuille sur place : quatre lignes de cahier ; plus haute avec une citation */
const SHEET_HEIGHT = 250;
const SHEET_HEIGHT_QUOTE = 400;
/** L'écart entre la feuille et le clavier */
const GAP = spacing.md;
const LINE = 26;

export default function NoteComposer({
  visible,
  page,
  draft,
  quote = null,
  onClose,
  onPost,
}: NoteComposerProps) {
  const [text, setText] = useState(draft);
  const [full, setFull] = useState(false);
  const [posting, setPosting] = useState(false);
  const [clip, setClip] = useState<VoiceClip | null>(null);
  const [recording, setRecording] = useState(false);
  const sheetHeight = quote ? SHEET_HEIGHT_QUOTE : SHEET_HEIGHT;
  const input = useRef<TextInput>(null);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const reducedMotion = useReducedMotion();

  const shown = useSharedValue(0);
  const expanded = useSharedValue(0);

  // Chaque ouverture repart du brouillon, sur place
  useEffect(() => {
    if (!visible) return;
    setText(draft);
    setClip(null);
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

  const close = () => {
    shown.value = withTiming(0, timing(reducedMotion, 180));
    // Le fondu joue, puis la feuille rend le brouillon
    setTimeout(() => onClose(text), reducedMotion ? 0 : 180);
  };

  const empty = !quote && !text.trim() && !clip;

  const post = async () => {
    if (empty || recording || posting) return;
    setPosting(true);
    const done = await onPost({ body: text.trim(), voice: clip });
    setPosting(false);
    if (done) {
      shown.value = withTiming(0, timing(reducedMotion, 180));
      setTimeout(() => onClose(''), reducedMotion ? 0 : 180);
    }
  };

  const veilStyle = useAnimatedStyle(() => ({ opacity: shown.value }));

  // Sur place : posée au-dessus du clavier. Dépliée : tout l'écran au-dessus du clavier.
  const sheetStyle = useAnimatedStyle(() => {
    const kb = keyboard.height.value;
    const e = expanded.value;
    const placeTop = windowHeight - kb - GAP - sheetHeight;
    return {
      top: interpolate(e, [0, 1], [placeTop, 0]),
      bottom: interpolate(e, [0, 1], [kb + GAP, kb]),
      left: interpolate(e, [0, 1], [spacing.lg, 0]),
      right: interpolate(e, [0, 1], [spacing.lg, 0]),
      borderRadius: interpolate(e, [0, 1], [26, 0]),
      paddingTop: interpolate(e, [0, 1], [spacing.md, insets.top + spacing.sm]),
      opacity: shown.value,
      transform: [{ translateY: (1 - shown.value) * 24 }],
    };
  });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.veil, veilStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Fermer, garder le brouillon" />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.head}>
          <Round icon={XIcon} variant="ghost" label="Fermer, garder le brouillon" onPress={close} />
          <Text style={[styles.page, full && styles.pageFull]}>Page {page}</Text>
          <Round
            icon={full ? Minimize2Icon : Maximize2Icon}
            variant="ghost"
            label={full ? 'Replier la note' : 'Écrire en pleine page'}
            onPress={toggleFull}
          />
          <Round
            icon={CheckIcon}
            variant="dark"
            label="Ajouter la note au carnet de notes"
            disabled={empty || recording || posting}
            onPress={post}
          />
        </View>

        {!!quote && (
          <Text style={[styles.quote, full && styles.quoteFull]} numberOfLines={full ? 12 : 4}>
            {quote}
          </Text>
        )}

        {/* Le papier réglé, la marge lie de vin, et le texte posé sur les lignes */}
        <Pressable style={styles.paper} onPress={() => input.current?.focus()}>
          <View style={styles.margin} />
          {Array.from({ length: 40 }).map((_, index) => (
            <View key={index} style={[styles.rule, { top: spacing.sm + LINE * (index + 1) - 1 }]} />
          ))}
          <TextInput
            ref={input}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={quote ? 'Ta pensée, ton avis sur ce passage…' : 'Une pensée, un avis, un élément à retenir…'}
            placeholderTextColor={inkAlpha(0.38)}
            multiline
            autoFocus
            maxLength={2000}
            scrollEnabled
            accessibilityLabel={`Ma note sur la page ${page}`}
          />
        </Pressable>

        {!!quote && <VoiceRecorder clip={clip} onChange={setClip} onRecordingChange={setRecording} />}
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

function Round({
  icon: Icon,
  variant,
  label,
  onPress,
  disabled,
}: {
  icon: typeof XIcon;
  variant: 'dark' | 'ghost';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <PressableScale
      style={[styles.round, variant === 'dark' ? styles.roundDark : styles.roundGhost]}
      pressedScale={0.9}
      hitSlop={4}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={19} color={variant === 'dark' ? colors.white : colors.dark900} strokeWidth={2.2} />
    </PressableScale>
  );
}

const BUTTON = 42;

const styles = StyleSheet.create({
  veil: {
    backgroundColor: shadowAlpha(0.3),
  },
  sheet: {
    position: 'absolute',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: creamAlpha(0.98),
    overflow: 'hidden',
    shadowColor: shadowAlpha(0.3),
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 30,
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
  // Le passage cité : italique, un filet lie de vin à gauche
  quote: {
    paddingLeft: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  quoteFull: {
    fontSize: 21,
    lineHeight: 30,
  },
  paper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(245,240,233,0.9)',
    borderWidth: 1,
    borderColor: inkAlpha(0.06),
  },
  margin: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    width: 1.4,
    backgroundColor: 'rgba(140,59,76,0.35)',
  },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: inkAlpha(0.1),
  },
  input: {
    flex: 1,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm,
    paddingLeft: 30,
    paddingRight: spacing.md,
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: LINE,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },

  round: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundDark: {
    backgroundColor: colors.dark900,
    shadowColor: shadowAlpha(0.25),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  roundGhost: {
    backgroundColor: inkAlpha(0.07),
  },
});
