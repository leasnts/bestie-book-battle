/**
 * TEMP — Route /sound-lab : écouter les deux pistes de sons côte à côte (#160).
 *
 * Une ligne par moment de l'app. « Livre » = sons faits des matières (papier,
 * crayon, bois) ; « Cuelume » = les clics synthétiques de cuelume.dev, rendus
 * en fichiers. Chaque bouton joue le son ET la vibration prévue pour ce moment,
 * pour juger le ressenti complet. À retirer une fois la piste choisie.
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Volume2 } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from '../components/ui/PressableScale';
import SheetPage from '../components/ui/SheetPage';
import { borderRadius, colors, fonts, fontSize, paperFrameGradient, spacing } from '../utils/constants';

const { Light, Medium, Heavy, Soft, Rigid } = Haptics.ImpactFeedbackStyle;
const { Success, Error: Fail } = Haptics.NotificationFeedbackType;

type Buzz = () => void;
const impact = (style: Haptics.ImpactFeedbackStyle) => () => Haptics.impactAsync(style).catch(() => {});
const later = (ms: number, buzz: Buzz) => () => setTimeout(buzz, ms);
const all = (...buzzes: Buzz[]) => () => buzzes.forEach((b) => b());

const MOMENTS: { label: string; livre: number; cuelume: number; buzz: Buzz }[] = [
  {
    label: 'Glisser sa page',
    livre: require('../assets/sounds/lab/livre/crayon.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/select.wav'),
    buzz: () => Haptics.selectionAsync().catch(() => {}),
  },
  {
    label: 'Toucher un bouton',
    livre: require('../assets/sounds/lab/livre/carton.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/tap.wav'),
    buzz: impact(Light),
  },
  {
    label: 'Valider sa page',
    livre: require('../assets/sounds/lab/livre/tampon.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/type.wav'),
    buzz: impact(Rigid),
  },
  {
    label: 'Poster une note',
    livre: require('../assets/sounds/lab/livre/feuille.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/ready.wav'),
    buzz: all(impact(Soft), later(40, impact(Medium))),
  },
  {
    label: 'Réagir',
    livre: require('../assets/sounds/lab/livre/reaction.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/toggle.wav'),
    buzz: impact(Soft),
  },
  {
    label: 'Tourner une page',
    livre: require('../assets/sounds/lab/livre/page.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/navigate.wav'),
    buzz: later(150, impact(Light)),
  },
  {
    label: 'Fermer',
    livre: require('../assets/sounds/lab/livre/fermer.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/close.wav'),
    buzz: later(100, impact(Medium)),
  },
  {
    label: 'Objectif atteint',
    livre: require('../assets/sounds/lab/livre/reussite.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/success.wav'),
    buzz: () => Haptics.notificationAsync(Success).catch(() => {}),
  },
  {
    label: 'Série sauvée',
    livre: require('../assets/sounds/lab/livre/marque-page.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/attention.wav'),
    buzz: all(impact(Light), later(50, impact(Heavy))),
  },
  {
    label: 'Dépasser quelqu’un',
    livre: require('../assets/sounds/lab/livre/depasser.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/ready-strong.wav'),
    buzz: all(impact(Light), later(55, impact(Medium)), later(110, impact(Heavy))),
  },
  {
    label: 'Livre fini',
    livre: require('../assets/sounds/lab/livre/fete.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/success-strong.wav'),
    buzz: all(
      impact(Light),
      later(75, impact(Light)),
      later(150, impact(Medium)),
      later(225, () => Haptics.notificationAsync(Success).catch(() => {})),
    ),
  },
  {
    label: 'Erreur',
    livre: require('../assets/sounds/lab/livre/erreur.wav'),
    cuelume: require('../assets/sounds/lab/cuelume/error.wav'),
    buzz: () => Haptics.notificationAsync(Fail).catch(() => {}),
  },
];

// Les trois moments refaits (« horribles », Lea) : trois versions chacun, à choisir
const POSTER = MOMENTS[3].buzz;
// La vibration du carnet quand une nouvelle note part (NewNotesDeck)
const LUE = impact(Light);
const FINI = MOMENTS[10].buzz;
const VARIANTS: { label: string; sources: number[]; buzz: Buzz }[] = [
  {
    label: 'Poster une note',
    sources: [
      require('../assets/sounds/lab/v2/note-bulle.wav'),
      require('../assets/sounds/lab/v2/note-postit.wav'),
      require('../assets/sounds/lab/v2/note-kalimba.wav'),
    ],
    buzz: POSTER,
  },
  {
    label: 'Note lue',
    sources: [
      require('../assets/sounds/lab/v2/lue-envol.wav'),
      require('../assets/sounds/lab/v2/lue-pichenette.wav'),
      require('../assets/sounds/lab/v2/lue-kalimba.wav'),
    ],
    buzz: LUE,
  },
  {
    label: 'Livre fini',
    sources: [
      require('../assets/sounds/lab/v2/fin-accord.wav'),
      require('../assets/sounds/lab/v2/fin-referme.wav'),
      require('../assets/sounds/lab/v2/fin-boite-a-musique.wav'),
    ],
    buzz: FINI,
  },
];

function PlayButton({
  label,
  mark,
  narrow,
  onPress,
}: {
  label: string;
  mark?: string;
  narrow?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.94}
      style={[styles.play, narrow && styles.playNarrow]}
      accessibilityLabel={label}
    >
      <LinearGradient colors={paperFrameGradient} style={StyleSheet.absoluteFill} />
      {mark ? (
        <Text style={styles.mark}>{mark}</Text>
      ) : (
        <Volume2 size={18} color={colors.textSecondary} strokeWidth={2} />
      )}
    </PressableScale>
  );
}

export default function SoundLabRoute() {
  // Un lecteur par fichier, chargé d'avance : le son part au doigt, sans délai
  const players = useRef(new Map<number, AudioPlayer>());

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    for (const m of MOMENTS)
      for (const src of [m.livre, m.cuelume]) players.current.set(src, createAudioPlayer(src));
    for (const v of VARIANTS) for (const src of v.sources) players.current.set(src, createAudioPlayer(src));
    const map = players.current;
    return () => {
      map.forEach((p) => p.remove());
      map.clear();
    };
  }, []);

  const play = (src: number, buzz: Buzz) => {
    const player = players.current.get(src);
    if (player) {
      player.seekTo(0);
      player.play();
    }
    buzz();
  };

  return (
    <SheetPage title="Sons" fit={false}>
      <Text style={styles.section}>Nouvelles versions</Text>
      {VARIANTS.map((v) => (
        <View key={v.label} style={styles.row}>
          <Text style={styles.moment}>{v.label}</Text>
          <View style={styles.pair}>
            {v.sources.map((src, i) => (
              <PlayButton
                key={src}
                narrow
                mark={String(i + 1)}
                label={`${v.label}, version ${i + 1}`}
                onPress={() => play(src, v.buzz)}
              />
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.section, styles.sectionGap]}>Première écoute</Text>
      <View style={styles.legend}>
        <Text style={[styles.col, styles.colLabel]}>Livre</Text>
        <Text style={[styles.col, styles.colLabel]}>Cuelume</Text>
      </View>
      {MOMENTS.map((m) => (
        <View key={m.label} style={styles.row}>
          <Text style={styles.moment}>{m.label}</Text>
          <View style={styles.pair}>
            <PlayButton label={`${m.label}, Livre`} onPress={() => play(m.livre, m.buzz)} />
            <PlayButton label={`${m.label}, Cuelume`} onPress={() => play(m.cuelume, m.buzz)} />
          </View>
        </View>
      ))}
    </SheetPage>
  );
}

const PLAY_WIDTH = 72;

const styles = StyleSheet.create({
  section: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  sectionGap: { marginTop: spacing['2xl'] },
  playNarrow: { width: 52 },
  mark: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  col: { width: PLAY_WIDTH, textAlign: 'center' },
  colLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  moment: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  pair: { flexDirection: 'row', gap: spacing.sm },
  play: {
    width: PLAY_WIDTH,
    height: 44,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
