/**
 * VoicePlayer — écouter un vocal, dans une note.
 *
 * `[▶] [onde] [0:24]` : l'onde se remplit à mesure qu'on écoute, la durée devient
 * le temps écoulé pendant la lecture.
 *
 * - Un vocal envoyé vit dans un bucket privé : son URL signée n'est demandée
 *   qu'au premier ▶, pas pour chaque note de la liste.
 * - Un seul vocal parle à la fois : en lancer un met le précédent en pause.
 * - L'app passe en arrière-plan (appel, verrouillage) : la lecture s'arrête.
 * - Le vocal s'entend même en mode silencieux, comme un message vocal.
 */

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PauseIcon, PlayIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { getAudioUrl } from '../../services/supabase/annotations';
import { formatVoiceDuration, VOICE_BARS } from '../../utils/annotations';
import { borderRadius, colors, creamAlpha, fonts, inkAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

interface VoicePlayerProps {
  /** Un vocal envoyé : son chemin dans le bucket */
  path?: string | null;
  /** Un vocal tout juste enregistré : son fichier sur le téléphone */
  uri?: string | null;
  seconds: number;
  /** L'onde, de 0 à 100. Sans elle, une ligne régulière. */
  levels?: number[] | null;
}

/** Le vocal qui parle en ce moment, pour le couper quand un autre démarre */
let pauseCurrent: (() => void) | null = null;

export default function VoicePlayer({ path, uri, seconds, levels }: VoicePlayerProps) {
  const player = useAudioPlayer(null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [loading, setLoading] = useState(false);
  /** La source déjà confiée au lecteur : on ne la recharge pas à chaque ▶ */
  const loadedSource = useRef<string | null>(null);

  const pause = useCallback(() => player.pause(), [player]);

  // Arrivé au bout : on revient au début, prêt à réécouter
  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
      player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  // Appel, verrouillage, autre app : on se tait
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') player.pause();
    });
    return () => {
      sub.remove();
      if (pauseCurrent === pause) pauseCurrent = null;
    };
  }, [player, pause]);

  const toggle = useCallback(async () => {
    if (status.playing) {
      player.pause();
      return;
    }

    const source = uri ?? path ?? null;
    if (!source) return;

    if (loadedSource.current !== source) {
      setLoading(true);
      const url = uri ?? (path ? await getAudioUrl(path) : null);
      setLoading(false);
      if (!url) return;
      player.replace({ uri: url });
      loadedSource.current = source;
    }

    if (pauseCurrent && pauseCurrent !== pause) pauseCurrent();
    pauseCurrent = pause;

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'doNotMix',
    });
    player.play();
  }, [status.playing, player, uri, path, pause]);

  const duration = status.duration > 0 ? status.duration : seconds;
  const progress = duration > 0 ? Math.min(1, status.currentTime / duration) : 0;
  const started = status.playing || status.currentTime > 0;
  const bars = levels && levels.length > 0 ? levels : FLAT;

  return (
    <View style={styles.player}>
      <PressableScale
        style={styles.play}
        pressedScale={0.9}
        hitSlop={8}
        disabled={loading}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause' : `Écouter le vocal, ${formatVoiceDuration(seconds)}`}
      >
        {status.playing ? (
          <PauseIcon size={13} color={colors.white} fill={colors.white} strokeWidth={2} />
        ) : (
          <PlayIcon size={13} color={colors.white} fill={colors.white} strokeWidth={2} style={styles.playIcon} />
        )}
      </PressableScale>

      <View style={styles.wave} importantForAccessibility="no-hide-descendants">
        {bars.map((level, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              { height: Math.max(3, (level / 100) * WAVE_HEIGHT) },
              index / bars.length < progress ? styles.barPlayed : null,
            ]}
          />
        ))}
      </View>

      <Text style={styles.duration}>
        {formatVoiceDuration(started ? status.currentTime : duration)}
      </Text>
    </View>
  );
}

const WAVE_HEIGHT = 20;
const PLAY_SIZE = 30;
/** Sans onde enregistrée : une ligne régulière plutôt qu'une onde inventée */
const FLAT = Array.from({ length: VOICE_BARS }, () => 20);

const styles = StyleSheet.create({
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
    paddingLeft: 5,
    paddingRight: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: creamAlpha(0.55),
  },
  play: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark900,
  },
  // Le triangle est plus lourd à gauche : on le recentre à l'œil
  playIcon: {
    marginLeft: 2,
  },
  wave: {
    flex: 1,
    height: WAVE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 1.5,
    backgroundColor: inkAlpha(0.28),
  },
  barPlayed: {
    backgroundColor: inkAlpha(0.8),
  },
  duration: {
    minWidth: 30,
    textAlign: 'right',
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
