/**
 * TEMP — Route /sound-lab : choisir à l'oreille les sons à refaire (#160).
 *
 * Une ligne par moment : « Actuel » = le son en place, 1 à 3 = les nouvelles
 * versions. Chaque bouton joue le son ET la vibration du moment (renforcée).
 * À retirer une fois le choix fait.
 */

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from '../components/ui/PressableScale';
import SheetPage from '../components/ui/SheetPage';
import { borderRadius, colors, fonts, fontSize, paperFrameGradient, spacing } from '../utils/constants';
import { vibrate, type FeelName } from '../utils/feel';

const ROWS: { label: string; moment: FeelName; sources: number[] }[] = [
  {
    label: 'Valider sa page',
    moment: 'valider',
    sources: [
      require('../assets/sounds/valider.wav'),
      require('../assets/sounds/lab/valider-coche.wav'),
      require('../assets/sounds/lab/valider-carillon.wav'),
      require('../assets/sounds/lab/valider-marches.wav'),
    ],
  },
  {
    label: 'Réagir',
    moment: 'reagir',
    sources: [
      require('../assets/sounds/reagir.wav'),
      require('../assets/sounds/lab/reagir-bulle.wav'),
      require('../assets/sounds/lab/reagir-kalimba.wav'),
      require('../assets/sounds/lab/reagir-tinte.wav'),
    ],
  },
  {
    label: 'Note lue',
    moment: 'lue',
    sources: [
      require('../assets/sounds/lue.wav'),
      require('../assets/sounds/lab/lue-pichenette-aigue.wav'),
      require('../assets/sounds/lab/lue-kalimba-aigu.wav'),
      require('../assets/sounds/lab/lue-sifflet.wav'),
    ],
  },
];

const MARKS = ['Actuel', '1', '2', '3'];

export default function SoundLabRoute() {
  // Un lecteur par fichier, chargé d'avance : le son part au doigt
  const players = useRef(new Map<number, AudioPlayer>());

  useEffect(() => {
    for (const row of ROWS)
      for (const src of row.sources) {
        const p = createAudioPlayer(src);
        p.volume = 0.6;
        players.current.set(src, p);
      }
    const map = players.current;
    return () => {
      map.forEach((p) => p.remove());
      map.clear();
    };
  }, []);

  const play = (src: number, moment: FeelName) => {
    const p = players.current.get(src);
    if (p) {
      p.seekTo(0).catch(() => {});
      p.play();
    }
    vibrate(moment);
  };

  return (
    <SheetPage title="Sons" fit={false}>
      {ROWS.map((row) => (
        <View key={row.label} style={styles.block}>
          <Text style={styles.moment}>{row.label}</Text>
          <View style={styles.buttons}>
            {row.sources.map((src, i) => (
              <PressableScale
                key={src}
                onPress={() => play(src, row.moment)}
                pressedScale={0.94}
                style={[styles.play, i === 0 && styles.playCurrent]}
                accessibilityLabel={`${row.label}, ${MARKS[i]}`}
              >
                <LinearGradient colors={paperFrameGradient} style={StyleSheet.absoluteFill} />
                <Text style={styles.mark}>{MARKS[i]}</Text>
              </PressableScale>
            ))}
          </View>
        </View>
      ))}
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  moment: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  play: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCurrent: { flex: 1.6 },
  mark: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
