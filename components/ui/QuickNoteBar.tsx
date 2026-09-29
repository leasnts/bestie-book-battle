/**
 * QuickNoteBar — la barre d'actions rapides de « Ma page ».
 *
 *   [ ✎ p. 157…            ] [🎙] [📷] [☺]
 *
 * Chaque action pose une note sur ma page enregistrée, sans quitter l'accueil :
 * - la ligne de cahier : écrire (la note s'ouvre) ;
 * - 🎙 : la barre DEVIENT l'enregistreur (`VoiceRecorder`, le même que partout),
 *   l'enregistrement part tout de suite ; ■, puis ✓ pour coller ;
 * - 📷 : photographier un passage pour le citer ;
 * - ☺ : une rangée d'emojis sort de la barre, un toucher pose la réaction.
 *
 * La note collée apparaît dans le carré du carnet, à côté.
 * Hauteur fixe : la barre, l'enregistreur et la rangée ↺ +14 ✓ de « Ma page »
 * prennent la même place, rien ne saute.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraIcon, CheckIcon, MicIcon, PenLineIcon, SmilePlusIcon, XIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import { useQuickNote } from '../../hooks/useQuickNote';
import type { VoiceClip } from '../../stores/annotationStore';
import { colors, creamAlpha, fonts, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import { QUICK_REACTIONS } from '../../utils/emojis';
import PressableScale from './PressableScale';
import VoiceRecorder from './VoiceRecorder';

interface QuickNoteBarProps {
  /** Écrire : ouvre la note sur ma page */
  onWrite: () => void;
  /** Photographier un passage. Sans elle, pas de bouton. */
  onCamera?: () => void;
}

type Mode = 'idle' | 'voice' | 'emoji';

export const QUICK_BAR_HEIGHT = 52;
const BUTTON = 42;

export default function QuickNoteBar({ onWrite, onCamera }: QuickNoteBarProps) {
  const { post, posting, page } = useQuickNote();
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>('idle');
  const [clip, setClip] = useState<VoiceClip | null>(null);
  const [recording, setRecording] = useState(false);

  const close = useCallback(() => {
    setClip(null);
    setRecording(false);
    setMode('idle');
  }, []);

  const publish = useCallback(
    async (note: Parameters<typeof post>[0]) => {
      try {
        const done = await post(note);
        if (done) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        close();
      } catch (error) {
        console.error('[Carnet] note rapide impossible', error);
        Alert.alert('Erreur', "La note n'a pas pu être enregistrée. Réessaie.");
      }
    },
    [post, close],
  );

  const entering = reducedMotion ? undefined : FadeIn.duration(180);
  const exiting = reducedMotion ? undefined : FadeOut.duration(120);

  if (mode === 'voice') {
    return (
      <Animated.View style={styles.bar} entering={entering} exiting={exiting}>
        <View style={styles.recorder}>
          <VoiceRecorder clip={clip} onChange={setClip} onRecordingChange={setRecording} autoStart />
        </View>
        {clip && !recording ? (
          <Round icon={CheckIcon} variant="dark" label="Coller le vocal" disabled={posting} onPress={() => publish({ voice: clip })} />
        ) : (
          <Round icon={XIcon} variant="ghost" label="Annuler le vocal" onPress={close} />
        )}
      </Animated.View>
    );
  }

  return (
    <View style={styles.bar}>
      <PressableScale
        style={styles.write}
        pressedScale={0.97}
        onPress={onWrite}
        accessibilityRole="button"
        accessibilityLabel={`Écrire une note page ${page}`}
      >
        <LinearGradient colors={PAPER} style={StyleSheet.absoluteFill} />
        {/* La ligne de cahier : deux réglures et la marge lie de vin */}
        <View style={[styles.rule, { top: QUICK_BAR_HEIGHT * 0.36 }]} />
        <View style={[styles.rule, { top: QUICK_BAR_HEIGHT * 0.72 }]} />
        <View style={styles.margin} />
        <PenLineIcon size={16} color={colors.textSecondary} strokeWidth={2.2} />
        <Text style={styles.placeholder} numberOfLines={1}>
          p. {page}…
        </Text>
      </PressableScale>

      <Round icon={MicIcon} variant="ghost" label="Note vocale" onPress={() => setMode('voice')} />
      {onCamera && <Round icon={CameraIcon} variant="ghost" label="Photographier un passage" onPress={onCamera} />}
      <Round
        icon={mode === 'emoji' ? XIcon : SmilePlusIcon}
        variant={mode === 'emoji' ? 'dark' : 'ghost'}
        label={mode === 'emoji' ? 'Fermer les réactions' : 'Réagir en emoji'}
        onPress={() => setMode(mode === 'emoji' ? 'idle' : 'emoji')}
      />

      {mode === 'emoji' && (
        <Animated.View style={styles.emojis} entering={entering} exiting={exiting}>
          {QUICK_REACTIONS.map((emoji, index) => (
            <Animated.View
              key={emoji}
              entering={reducedMotion ? undefined : ZoomIn.delay(index * 30).duration(220)}
            >
              <PressableScale
                style={styles.emoji}
                pressedScale={0.85}
                disabled={posting}
                onPress={() => publish({ emoji })}
                accessibilityRole="button"
                accessibilityLabel={`Réagir ${emoji} à la page ${page}`}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </PressableScale>
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

/** Le bouton rond de la barre : même taille que ceux de « Ma page » */
function Round({
  icon: Icon,
  variant,
  label,
  onPress,
  disabled,
}: {
  icon: typeof MicIcon;
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

/** Le papier de la ligne de cahier : clair en haut, un peu plus chaud en bas */
const PAPER = [creamAlpha(0.85), 'rgba(242,236,228,0.7)'] as const;

const styles = StyleSheet.create({
  bar: {
    height: QUICK_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recorder: {
    flex: 1,
  },
  write: {
    flex: 1,
    height: QUICK_BAR_HEIGHT - 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 26,
    paddingRight: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: inkAlpha(0.08),
  },
  margin: {
    position: 'absolute',
    left: 17,
    top: 0,
    bottom: 0,
    width: 1.2,
    backgroundColor: 'rgba(140,59,76,0.35)',
  },
  placeholder: {
    flex: 1,
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 16,
    color: inkAlpha(0.45),
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

  // Les réactions sortent au-dessus de la barre, calées à droite
  emojis: {
    position: 'absolute',
    right: 0,
    bottom: QUICK_BAR_HEIGHT + spacing.xs,
    flexDirection: 'row',
    gap: 2,
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
