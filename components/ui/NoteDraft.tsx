/**
 * NoteDraft — la note qu'on écrit, en autocollant.
 *
 * Une note = l'autocollant brodé (`NoteSticker`), aussi pendant qu'on l'écrit :
 * pas de feuille de cahier à part (retour de Lea, 2026-09-29). Tout se fait
 * DANS l'autocollant, à la couleur de sa catégorie :
 *
 *   ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐
 *   ┆ ▌« le passage cité »    ┆   la citation, modifiable
 *   ┆ Une pensée, un avis…    ┆   le texte
 *   ┆ (🎙 ─────────── 0:00)   ┆   le vocal : le même `VoiceRecorder` que partout
 *   └┄important┄┄┄┄┄┄┄┄┄┄◢┘   la catégorie en filigrane, coupée par les bords
 *
 * Un seul composant pour l'éditeur de note et la feuille rapide de « Ma page ».
 */

import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from 'react-native';
import type { VoiceClip } from '../../stores/annotationStore';
import { colors, fonts, inkAlpha, spacing } from '../../utils/constants';
import { STICKER_BASE_LARGE } from './NoteCard';
import NoteSticker from './NoteSticker';
import VoiceRecorder from './VoiceRecorder';

export interface DraftVoice {
  uri?: string;
  path?: string | null;
  seconds: number;
  levels?: number[] | null;
}

interface NoteDraftProps {
  color: string;
  /** Le nom de la catégorie, en filigrane dans le fond de la note */
  label: string;
  body: string;
  onBodyChange: (body: string) => void;
  placeholder: string;
  /** Le passage cité ; `null` : pas de citation */
  quote?: string | null;
  onQuoteChange?: (quote: string) => void;
  /** Un emoji seul, en grand (l'éditeur) */
  emoji?: string | null;
  voice: DraftVoice | null;
  onVoiceChange: (clip: VoiceClip | null) => void;
  onRecordingChange?: (recording: boolean) => void;
  /** Prend toute la hauteur que son parent lui donne */
  fill?: boolean;
  /** Pleine page : texte plus grand */
  large?: boolean;
  autoFocus?: boolean;
  /** Le coin décollé ; `none` quand des intercalaires sortent du bas de la note */
  corner?: 'bottom-right' | 'none';
  id: string;
}

const NoteDraft = forwardRef<TextInput, NoteDraftProps>(function NoteDraft(
  {
    color,
    label,
    body,
    onBodyChange,
    placeholder,
    quote = null,
    onQuoteChange,
    emoji = null,
    voice,
    onVoiceChange,
    onRecordingChange,
    fill = false,
    large = false,
    autoFocus = false,
    corner = 'bottom-right',
    id,
  },
  ref,
) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View style={[styles.note, fill && styles.fill]} onLayout={onLayout}>
      {size && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <NoteSticker
            id={id}
            color={color}
            width={size.width}
            height={size.height}
            maxBase={STICKER_BASE_LARGE}
            corner={corner}
            watermark={label}
          />
        </View>
      )}

      {quote !== null && (
        <TextInput
          style={[styles.quote, large && styles.quoteLarge]}
          value={quote}
          onChangeText={onQuoteChange}
          multiline
          scrollEnabled={false}
          placeholder="Le passage…"
          placeholderTextColor={inkAlpha(0.35)}
          accessibilityLabel="Le passage cité"
        />
      )}

      {emoji && <Text style={styles.emoji}>{emoji}</Text>}

      <TextInput
        ref={ref}
        style={[styles.input, large && styles.inputLarge, fill && styles.inputFill]}
        value={body}
        onChangeText={onBodyChange}
        placeholder={placeholder}
        placeholderTextColor={inkAlpha(0.4)}
        multiline
        autoFocus={autoFocus}
        maxLength={2000}
        accessibilityLabel="Texte de la note"
      />

      {/* Le vocal vit dans la note, comme le texte ; il s'arrête avant le coin corné */}
      <View style={corner !== 'none' && styles.voice}>
        <VoiceRecorder clip={voice} onChange={onVoiceChange} onRecordingChange={onRecordingChange} />
      </View>
    </View>
  );
});

export default NoteDraft;

const styles = StyleSheet.create({
  note: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    minHeight: 180,
  },
  fill: {
    flex: 1,
  },
  // Le passage cité : un filet lie de vin à gauche, comme sur la note publiée
  quote: {
    paddingLeft: spacing.md,
    paddingVertical: 0,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  quoteLarge: {
    fontSize: 21,
    lineHeight: 30,
  },
  emoji: {
    fontSize: 34,
  },
  input: {
    minHeight: 48,
    paddingVertical: 0,
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  inputLarge: {
    fontSize: 20,
    lineHeight: 28,
  },
  inputFill: {
    flex: 1,
  },
  voice: {
    marginRight: 26,
  },
});
