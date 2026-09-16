/**
 * VoiceRecorder — enregistrer le vocal d'une note.
 *
 * Aussi simple qu'un texte : **un toucher pour démarrer, un pour arrêter**. Pas
 * d'appui long, qui exclut les personnes qui ont du mal à maintenir un geste.
 *
 * Une rangée, des places fixes, seules les icônes changent :
 *
 * |               | gauche       | centre                  | droite      |
 * |---------------|--------------|-------------------------|-------------|
 * | rien          | 🎙 démarrer  | `0:00 / 2:00`           | —           |
 * | enregistre    | ■ arrêter    | onde en direct + compteur | —         |
 * | enregistré    | ↺ refaire    | `0:24`                  | 🗑 supprimer |
 *
 * La réécoute se fait dans le post-it, avec le même lecteur que le club verra.
 *
 * - AAC mono ≈ 32 kbps (≈ 240 Ko/min) : le Go gratuit de Supabase tient ≈ 70 h.
 * - 2 minutes au maximum, le compteur le montre ; l'enregistrement s'arrête seul.
 * - Appel, mise en veille, autre app : l'enregistrement s'arrête et **garde ce
 *   qui a été dit**, plutôt que de tout perdre.
 */

import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import { MicIcon, RotateCcwIcon, SquareIcon, Trash2Icon } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, StyleSheet, Text, View } from 'react-native';
import type { VoiceClip } from '../../stores/annotationStore';
import {
  downsampleLevels,
  formatVoiceDuration,
  levelFromMetering,
  MAX_VOICE_SECONDS,
} from '../../utils/annotations';
import { colors, fonts, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

/** La voix n'a pas besoin de plus : 22 kHz mono, AAC à 32 kbps */
const VOICE_RECORDING: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 22050,
  numberOfChannels: 1,
  bitRate: 32000,
  isMeteringEnabled: true,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 32000,
  },
};

/** Un toucher trop bref pour être un vocal : on ne garde rien */
const MIN_VOICE_MS = 700;
/** Les barres visibles pendant l'enregistrement, les plus récentes à droite */
const LIVE_BARS = 32;

interface VoiceRecorderProps {
  /** Le vocal de la note, s'il y en a un */
  clip: { seconds: number } | null;
  /** Un nouvel enregistrement, ou `null` quand on le supprime ou le refait */
  onChange: (clip: VoiceClip | null) => void;
  /** Pendant l'enregistrement, la note ne peut pas être publiée */
  onRecordingChange?: (recording: boolean) => void;
}

export default function VoiceRecorder({ clip, onChange, onRecordingChange }: VoiceRecorderProps) {
  const recorder = useAudioRecorder(VOICE_RECORDING);
  const state = useAudioRecorderState(recorder, 100);

  const [recording, setRecording] = useState(false);
  /** Les niveaux du micro, un tous les 100 ms */
  const samples = useRef<number[]>([]);
  /** Le micro a vraiment démarré : un `isRecording` faux ensuite veut dire interruption */
  const started = useRef(false);
  const finishing = useRef(false);

  const setRecordingBoth = useCallback(
    (value: boolean) => {
      setRecording(value);
      onRecordingChange?.(value);
    },
    [onRecordingChange],
  );

  /** Arrête et garde ce qui a été dit */
  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;

    const durationMs = recorder.getStatus().durationMillis;
    try {
      await recorder.stop();
    } catch (error) {
      console.warn('[Carnet] arrêt du vocal', error);
    }
    // Rendre la sortie au haut-parleur : micro ouvert, iOS parle dans l'écouteur
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});

    const uri = recorder.uri;
    started.current = false;
    setRecordingBoth(false);
    finishing.current = false;

    if (!uri || durationMs < MIN_VOICE_MS) return;
    onChange({
      uri,
      seconds: Math.min(MAX_VOICE_SECONDS, Math.max(1, Math.round(durationMs / 1000))),
      levels: downsampleLevels(samples.current),
    });
  }, [recorder, onChange, setRecordingBoth]);

  const start = useCallback(async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Micro', 'Autorise le micro dans les réglages pour enregistrer un vocal.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réglages', onPress: () => Linking.openSettings() },
      ]);
      return;
    }

    // Refaire : l'ancien vocal s'en va dès qu'on recommence
    onChange(null);
    samples.current = [];

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: MAX_VOICE_SECONDS });
      setRecordingBoth(true);
    } catch (error) {
      console.error('[Carnet] enregistrement impossible', error);
      Alert.alert('Erreur', "Le vocal n'a pas pu démarrer. Réessaie.");
      setRecordingBoth(false);
    }
  }, [recorder, onChange, setRecordingBoth]);

  // Chaque relevé du micro : un niveau de plus pour l'onde
  useEffect(() => {
    if (!recording) return;
    if (state.isRecording) {
      started.current = true;
      samples.current.push(levelFromMetering(state.metering));
      return;
    }
    // Le micro s'est tu sans qu'on touche ■ : 2 minutes atteintes, appel,
    // Siri, services audio réinitialisés. On garde ce qui a été dit.
    if (started.current || state.mediaServicesDidReset) finish();
  }, [state, recording, finish]);

  // Mise en veille, autre app : on arrête proprement
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && recorder.isRecording) finish();
    });
    return () => sub.remove();
  }, [recorder, finish]);

  // La note se ferme en plein enregistrement : on libère le micro. Le hook
  // d'expo-audio a peut-être déjà relâché l'enregistreur, d'où le try.
  useEffect(
    () => () => {
      try {
        if (recorder.isRecording) recorder.stop().catch(() => {});
      } catch {}
      setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    },
    [recorder],
  );

  const elapsed = recording ? state.durationMillis / 1000 : 0;
  const live = samples.current.slice(-LIVE_BARS);

  return (
    <View style={styles.row}>
      {recording ? (
        <RoundButton icon={SquareIcon} variant="stop" label="Arrêter le vocal" onPress={finish} />
      ) : clip ? (
        <RoundButton icon={RotateCcwIcon} variant="ghost" label="Refaire le vocal" onPress={start} />
      ) : (
        <RoundButton icon={MicIcon} variant="dark" label="Enregistrer un vocal" onPress={start} />
      )}

      <View style={styles.middle}>
        {recording && (
          <View style={styles.live} importantForAccessibility="no-hide-descendants">
            {Array.from({ length: LIVE_BARS }).map((_, index) => {
              // Les barres arrivent par la droite
              const level = live[index - (LIVE_BARS - live.length)];
              return (
                <View
                  key={index}
                  style={[
                    styles.liveBar,
                    level === undefined
                      ? styles.liveBarEmpty
                      : { height: Math.max(3, level * LIVE_HEIGHT) },
                  ]}
                />
              );
            })}
          </View>
        )}

        <Text
          style={[styles.counter, recording && styles.counterOn]}
          accessibilityLabel={
            clip && !recording
              ? `Vocal de ${formatVoiceDuration(clip.seconds)}`
              : `${formatVoiceDuration(elapsed)} sur ${formatVoiceDuration(MAX_VOICE_SECONDS)}`
          }
        >
          {clip && !recording ? (
            formatVoiceDuration(clip.seconds)
          ) : (
            <>
              {formatVoiceDuration(elapsed)}
              <Text style={styles.counterMax}> / {formatVoiceDuration(MAX_VOICE_SECONDS)}</Text>
            </>
          )}
        </Text>
      </View>

      <View style={styles.slot}>
        {clip && !recording && (
          <RoundButton
            icon={Trash2Icon}
            variant="ghost"
            label="Supprimer le vocal"
            onPress={() => onChange(null)}
          />
        )}
      </View>
    </View>
  );
}

/** Même taille, même place : seule l'icône change */
function RoundButton({
  icon: Icon,
  variant,
  label,
  onPress,
}: {
  icon: typeof MicIcon;
  variant: 'dark' | 'ghost' | 'stop';
  label: string;
  onPress: () => void;
}) {
  const filled = variant !== 'ghost';
  return (
    <PressableScale
      style={[styles.button, filled ? styles.buttonDark : styles.buttonGhost]}
      pressedScale={0.9}
      hitSlop={6}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon
        size={variant === 'stop' ? 15 : 19}
        color={filled ? colors.white : colors.dark900}
        fill={variant === 'stop' ? colors.white : 'none'}
        strokeWidth={2.2}
      />
    </PressableScale>
  );
}

const BUTTON = 42;
const LIVE_HEIGHT = 22;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: BUTTON,
  },
  slot: {
    width: BUTTON,
    height: BUTTON,
  },
  middle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  live: {
    flex: 1,
    height: LIVE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  liveBar: {
    flex: 1,
    borderRadius: 1.5,
    backgroundColor: colors.dark900,
  },
  liveBarEmpty: {
    height: 3,
    backgroundColor: inkAlpha(0.15),
  },
  counter: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  counterOn: {
    color: colors.textPrimary,
  },
  counterMax: {
    fontFamily: fonts.bodyBold,
    color: colors.textPlaceholder,
  },

  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDark: {
    backgroundColor: colors.dark900,
    shadowColor: shadowAlpha(0.25),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  buttonGhost: {
    backgroundColor: inkAlpha(0.07),
  },
});
