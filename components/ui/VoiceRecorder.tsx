/**
 * VoiceRecorder — enregistrer le vocal d'une note.
 *
 * Aussi simple qu'un texte : **un toucher pour démarrer, un pour arrêter**. Pas
 * d'appui long, qui exclut les personnes qui ont du mal à maintenir un geste.
 *
 * Une gélule, des places fixes, seules les icônes changent. **Le même
 * enregistreur partout** (règle de Lea, 2026-09-29) : dans l'éditeur de note, dans
 * la barre d'actions rapides de « Ma page », pour commenter une citation.
 * Pendant l'enregistrement, la gélule passe en lie de vin :
 *
 * |            | gauche      | centre                    | droite       |
 * |------------|-------------|---------------------------|--------------|
 * | rien       | 🎙 démarrer | onde au repos             | `0:00`       |
 * | enregistre | ■ arrêter   | onde en direct, fluide    | `0:09`, gras |
 * | enregistré | ↺ refaire   | ▶ réécouter (VoicePlayer) | 🗑 supprimer |
 *
 * Le toucher passe **aussitôt** en lie de vin, sans attendre que le micro
 * s'ouvre.
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
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, AppState, Linking, StyleSheet, Text, View } from 'react-native';
import type { VoiceClip } from '../../stores/annotationStore';
import {
  downsampleLevels,
  formatVoiceDuration,
  levelFromMetering,
  MAX_VOICE_SECONDS,
} from '../../utils/annotations';
import { accentGradient, colors, creamAlpha, fonts, inkAlpha, spacing } from '../../utils/constants';
import RoundButton, { ROUND_BUTTON_SIZE } from './RoundButton';
import VoicePlayer from './VoicePlayer';

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
const LIVE_BARS = 26;

interface VoiceRecorderProps {
  /** Le vocal de la note, s'il y en a un */
  clip: { seconds: number; levels?: number[] | null; uri?: string; path?: string | null } | null;
  /** Un nouvel enregistrement, ou `null` quand on le supprime ou le refait */
  onChange: (clip: VoiceClip | null) => void;
  /** Pendant l'enregistrement, la note ne peut pas être publiée */
  onRecordingChange?: (recording: boolean) => void;
  /** Démarre dès l'affichage : le micro de la barre d'actions rapides */
  autoStart?: boolean;
  /**
   * La gélule à la hauteur des boutons d'en-tête (`ROUND_BUTTON_SIZE`) : dans la
   * feuille rapide, elle s'aligne sur ✕ et ↗ (retour de Lea, 2026-09-29)
   */
  compact?: boolean;
}

export default function VoiceRecorder({
  clip,
  onChange,
  onRecordingChange,
  autoStart = false,
  compact = false,
}: VoiceRecorderProps) {
  const height = compact ? VOICE_BAR_HEIGHT_COMPACT : HEIGHT;
  const recorder = useAudioRecorder(VOICE_RECORDING);
  const state = useAudioRecorderState(recorder, 100);
  // Le démarrage attend la permission et le micro : entre-temps l'enregistreur a
  // pu être recréé (écran remonté). On prend toujours le dernier, et on renonce
  // si l'enregistreur n'est plus affiché.
  const latest = useRef(recorder);
  latest.current = recorder;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
    // Le rouge tout de suite : le micro met quelques dixièmes à s'ouvrir, le
    // toucher doit répondre sans attendre (retour de Lea, 2026-09-29)
    setRecordingBoth(true);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setRecordingBoth(false);
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
      if (!mounted.current) return;
      const current = latest.current;
      await current.prepareToRecordAsync();
      if (!mounted.current) return;
      current.record({ forDuration: MAX_VOICE_SECONDS });
    } catch (error) {
      console.error('[Carnet] enregistrement impossible', error);
      Alert.alert('Erreur', "Le vocal n'a pas pu démarrer. Réessaie.");
      setRecordingBoth(false);
    }
  }, [recorder, onChange, setRecordingBoth]);

  // Le micro de la barre : un toucher suffit, l'enregistrement part tout de suite
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    start();
    // Une seule fois, à l'ouverture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const recorded = clip && !recording ? clip : null;

  return (
    <View
      style={[
        styles.row,
        { minHeight: height, borderRadius: height / 2 },
        compact && styles.rowCompact,
        !recording && styles.rowIdle,
      ]}
    >
      {recording && (
        <LinearGradient colors={accentGradient} style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]} />
      )}

      {recording ? (
        <RoundButton icon={SquareIcon} variant="light" filled label="Arrêter le vocal" onPress={finish} />
      ) : recorded ? (
        <RoundButton icon={RotateCcwIcon} variant="ghost" label="Refaire le vocal" onPress={start} />
      ) : (
        <RoundButton icon={MicIcon} variant="dark" label="Enregistrer une note vocale" onPress={start} />
      )}

      {recorded ? (
        // Enregistré : on peut le réécouter avant de l'ajouter, avec le lecteur du carnet
        <View style={styles.player}>
          <VoicePlayer
            uri={recorded.uri}
            path={recorded.path}
            seconds={recorded.seconds}
            levels={recorded.levels}
            compact={compact}
          />
        </View>
      ) : (
        <>
          <View
            style={[styles.live, compact && styles.liveCompact]}
            importantForAccessibility="no-hide-descendants"
          >
            {Array.from({ length: LIVE_BARS }).map((_, index) => (
              // Les barres arrivent par la droite
              <LiveBar
                key={index}
                level={live[index - (LIVE_BARS - live.length)]}
                on={recording}
                max={compact ? LIVE_HEIGHT_COMPACT : LIVE_HEIGHT}
              />
            ))}
          </View>
          <Text
            style={[styles.counter, compact && styles.counterCompact, recording && styles.counterOn]}
            accessibilityLabel={`${formatVoiceDuration(elapsed)} sur ${formatVoiceDuration(MAX_VOICE_SECONDS)}`}
          >
            {formatVoiceDuration(elapsed)}
          </Text>
        </>
      )}

      {recorded && (
        <RoundButton
          icon={Trash2Icon}
          variant="ghost"
          label="Supprimer le vocal"
          onPress={() => onChange(null)}
        />
      )}
    </View>
  );
}

/** Une barre de l'onde : sa hauteur glisse vers le nouveau niveau, sans à-coup */
function LiveBar({ level, on, max }: { level: number | undefined; on: boolean; max: number }) {
  const height = useSharedValue(BAR_MIN);
  useEffect(() => {
    const target = level === undefined ? BAR_MIN : Math.max(BAR_MIN, level * max);
    height.value = withTiming(target, { duration: 140, easing: Easing.out(Easing.quad) });
  }, [level, max, height]);
  const style = useAnimatedStyle(() => ({ height: height.value }));
  return <Animated.View style={[styles.liveBar, on ? styles.liveBarOn : styles.liveBarIdle, style]} />;
}

const LIVE_HEIGHT = 28;
const LIVE_HEIGHT_COMPACT = 20;
const BAR_MIN = 4;
/** La gélule : le bouton rond, et 5 pt tout autour */
const PAD = 5;
const HEIGHT = ROUND_BUTTON_SIZE + PAD * 2;
/**
 * La gélule compacte : de la hauteur des ronds posés à côté (🎙 ❝ ✕), sans
 * marge autour de son bouton, qui garde sa taille de rond (`ROUND_BUTTON_SIZE`)
 */
export const VOICE_BAR_HEIGHT_COMPACT = ROUND_BUTTON_SIZE;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: PAD,
    paddingRight: spacing.lg,
    overflow: 'hidden',
  },
  rowCompact: {
    padding: 0,
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  rowIdle: {
    backgroundColor: inkAlpha(0.06),
  },
  player: {
    flex: 1,
  },
  live: {
    flex: 1,
    height: LIVE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveCompact: {
    height: LIVE_HEIGHT_COMPACT,
  },
  liveBar: {
    width: 4,
    borderRadius: 2,
  },
  liveBarOn: {
    backgroundColor: creamAlpha(0.92),
  },
  liveBarIdle: {
    backgroundColor: inkAlpha(0.15),
  },
  // Le temps, ferré à droite, en gras
  counter: {
    minWidth: 40,
    textAlign: 'right',
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  counterCompact: {
    minWidth: 34,
    fontSize: 14,
  },
  counterOn: {
    color: colors.white,
  },
});
