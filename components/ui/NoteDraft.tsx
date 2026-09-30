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
 *   └┄note┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄◢┘   la catégorie en filigrane, coupée par les bords
 *
 * Un seul composant pour l'éditeur de note et la feuille rapide de « Ma page ».
 */

import { MicIcon, QuoteIcon, XIcon } from 'lucide-react-native';
import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { VoiceClip } from '../../stores/annotationStore';
import { colors, fonts, inkAlpha, motion, spacing } from '../../utils/constants';
import { STICKER_BASE_LARGE } from './NoteCard';
import NoteSticker from './NoteSticker';
import GlassButton from './GlassButton';
import VoiceRecorder, { VOICE_BAR_HEIGHT_COMPACT } from './VoiceRecorder';

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
  /** Le coin décollé ; `none` quand des intercalaires sortent de la note */
  corner?: 'bottom-right' | 'none';
  /**
   * Les outils repliés (la feuille rapide) : 🎙 et ❝ en verre, en bas à droite de la note
   * (le thème en filigrane est en bas à gauche).
   * L'enregistreur ne s'ouvre que si on touche 🎙. Sans eux, l'enregistreur est
   * toujours là (l'éditeur de note).
   */
  tools?: boolean;
  /** La couture qui s'ouvre vers l'intercalaire choisi, selon la largeur de la note */
  stitchNotch?: (width: number) => { left: number; right: number };
  /** ❝ : ajouter une citation (photo de la page) ; absent, pas de bouton */
  onCite?: () => void;
  id: string;
}

/**
 * 🎙 ❝ ✕ : des ronds en verre de la taille des boutons d'en-tête, aussi hauts que
 * la gélule compacte du vocal. Toucher 🎙 ne change pas la hauteur de la note :
 * rien ne saute (retour de Lea, 2026-09-29).
 */
const TOOL = VOICE_BAR_HEIGHT_COMPACT;
/** Le coin corné : le vocal s'arrête avant */
const CORNER_GAP = 26;

const GROW = { duration: motion.duration.slow, easing: Easing.bezier(...motion.easing.easeOutQuart) };
const SHRINK = { duration: motion.duration.standard, easing: Easing.bezier(...motion.easing.easeInQuart) };

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
    tools = false,
    onCite,
    stitchNotch,
    id,
  },
  ref,
) {
  // Replié, l'enregistreur n'apparaît qu'au toucher de 🎙 (ou s'il y a déjà un vocal)
  const [voiceOpen, setVoiceOpen] = useState(!!voice);
  // La gélule naît du rond 🎙 : elle s'étire vers la gauche, et s'y replie au ✕.
  // À la main plutôt qu'en `entering` : les animations d'entrée ne jouent pas
  // dans le `Modal` de la feuille rapide.
  const open = useSharedValue(voice ? 1 : 0);
  const [dockWidth, setDockWidth] = useState(0);
  const barWidth = Math.max(TOOL, dockWidth - (corner !== 'none' ? CORNER_GAP : 0));
  const openVoice = () => {
    setVoiceOpen(true);
    open.value = withTiming(1, GROW);
  };
  const closeVoice = () => {
    onVoiceChange(null);
    onRecordingChange?.(false);
    open.value = withTiming(0, SHRINK, (done) => {
      if (done) runOnJS(setVoiceOpen)(false);
    });
  };
  const toolsStyle = useAnimatedStyle(() => ({ opacity: 1 - open.value }));
  const barStyle = useAnimatedStyle(() => ({
    width: TOOL + (barWidth - TOOL) * open.value,
    opacity: Math.min(1, open.value * 3),
  }));
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View style={[styles.note, tools && styles.noteTools, fill && styles.fill]} onLayout={onLayout}>
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
            watermarkInset={spacing.lg}
            notch={stitchNotch ? stitchNotch(size.width) : null}
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
        // Replié : la note grandit avec le texte jusqu'à un plafond, puis défile
        style={[styles.input, large && styles.inputLarge, fill && styles.inputFill, tools && !fill && styles.inputGrow]}
        value={body}
        onChangeText={onBodyChange}
        placeholder={placeholder}
        placeholderTextColor={inkAlpha(0.4)}
        multiline
        autoFocus={autoFocus}
        maxLength={2000}
        accessibilityLabel="Texte de la note"
      />

      {tools ? (
        // 🎙 et ❝ en bas à droite ; 🎙 s'étire en gélule, à la même hauteur
        <View style={styles.dock} onLayout={(e) => setDockWidth(e.nativeEvent.layout.width)}>
          <Animated.View style={[styles.tools, toolsStyle]} pointerEvents={voiceOpen ? 'none' : 'auto'}>
            <GlassButton icon={MicIcon} size={TOOL} onPress={openVoice} accessibilityLabel="Ajouter un vocal" />
            {onCite && (
              <GlassButton
                icon={QuoteIcon}
                size={TOOL}
                onPress={onCite}
                accessibilityLabel="Citer un passage : photographier la page"
              />
            )}
          </Animated.View>
          {voiceOpen && dockWidth > 0 && (
            <Animated.View style={[styles.bar, corner !== 'none' && styles.barCorner, barStyle]}>
              {/* Le contenu garde sa largeur finale : la gélule le dévoile sans l'écraser */}
              <View style={[styles.voiceRow, styles.barContent, { width: barWidth }]}>
                <View style={styles.grow}>
                  <VoiceRecorder clip={voice} onChange={onVoiceChange} onRecordingChange={onRecordingChange} autoStart compact />
                </View>
                <GlassButton icon={XIcon} size={TOOL} onPress={closeVoice} accessibilityLabel="Retirer le vocal" />
              </View>
            </Animated.View>
          )}
        </View>
      ) : (
        // Le vocal vit dans la note, comme le texte ; il s'arrête avant le coin corné
        <View style={[styles.voiceRow, corner !== 'none' && styles.voice]}>
          <View style={styles.grow}>
            <VoiceRecorder clip={voice} onChange={onVoiceChange} onRecordingChange={onRecordingChange} />
          </View>
        </View>
      )}
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
  // Replié : quatre lignes d’emblée, pour une note qui invite à écrire
  inputGrow: {
    minHeight: 24 * 4,
    maxHeight: 24 * 7,
  },
  noteTools: {
    minHeight: 0,
  },
  dock: {
    height: TOOL,
  },
  tools: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  grow: {
    flex: 1,
  },
  voice: {
    marginRight: CORNER_GAP,
  },
  // Ancrée à droite, là où est 🎙 : elle grandit vers la gauche
  bar: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: TOOL,
    borderRadius: TOOL / 2,
    overflow: 'hidden',
  },
  barCorner: {
    right: CORNER_GAP,
  },
  barContent: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: TOOL,
  },
});
