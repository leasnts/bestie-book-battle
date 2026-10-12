/**
 * feel — le vocabulaire sensoriel de l'app : un son + une vibration par moment (#160).
 *
 *    feel('poster')   → la bulle qui éclate + deux tapotements
 *
 * Un nom = un seul rôle, partout le même (idée reprise de cuelume.dev). Les
 * sons sont faits des matières du livre : mine de crayon, carton, tampon,
 * marimba en bois, marque-page, livre qu'on referme. Choisis à l'oreille par
 * Lea sur l'écran d'écoute ; fabriqués par `scripts/sounds/` (CC0 Kenney pour
 * le livre qui se referme).
 *
 * - Les sons respectent le mode silencieux de l'iPhone et ne coupent pas la
 *   musique en cours (`restoreAmbientAudio`).
 * - Réglages « Sons » et « Vibrations » du profil : `stores/feelStore.ts`.
 * - Toute vibration de l'app passe par ici, `feel` pour un moment, `buzz` pour
 *   suivre un geste (carte armée, règle de page) : le réglage vaut partout.
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useFeelStore } from '../stores/feelStore';

export type FeelName =
  | 'tic' // glisser sa page, choisir dans une liste
  | 'appui' // toucher un bouton principal
  | 'valider' // la page enregistrée
  | 'poster' // une note postée
  | 'reagir' // une réaction ajoutée
  | 'lue' // une nouvelle note glissée, lue
  | 'fermer' // refermer
  | 'objectif' // un cap atteint
  | 'serie' // la série sauvée par un marque-page
  | 'depasser' // passer devant quelqu'un au classement
  | 'fini' // le livre fini
  | 'erreur'; // quelque chose n'a pas marché

const SOUNDS: Record<FeelName, number> = {
  tic: require('../assets/sounds/tic.wav'),
  appui: require('../assets/sounds/appui.wav'),
  valider: require('../assets/sounds/valider.wav'),
  poster: require('../assets/sounds/poster.wav'),
  reagir: require('../assets/sounds/reagir.wav'),
  lue: require('../assets/sounds/lue.wav'),
  fermer: require('../assets/sounds/fermer.wav'),
  objectif: require('../assets/sounds/objectif.wav'),
  serie: require('../assets/sounds/serie.wav'),
  depasser: require('../assets/sounds/depasser.wav'),
  fini: require('../assets/sounds/fini.wav'),
  erreur: require('../assets/sounds/erreur.wav'),
};

/** Volume des sons : présents sans couvrir la musique ni la voix d'une note */
const VOLUME = 0.6;

const { Light, Medium, Heavy, Soft, Rigid } = Haptics.ImpactFeedbackStyle;
type Tap = Haptics.ImpactFeedbackStyle | 'selection' | 'success' | 'error';

/** La vibration de chaque moment : des tapotements, chacun à son délai (ms) */
const HAPTICS: Record<FeelName, [number, Tap][]> = {
  tic: [[0, 'selection']],
  appui: [[0, Light]],
  valider: [[0, Rigid]],
  poster: [[0, Soft], [40, Medium]],
  reagir: [[0, Soft]],
  lue: [[0, Light]],
  fermer: [[100, Medium]],
  objectif: [[0, 'success']],
  serie: [[0, Light], [50, Heavy]],
  depasser: [[0, Light], [55, Medium], [110, Heavy]],
  fini: [[0, Medium], [220, Light], [290, Light], [360, Medium], [430, 'success']],
  erreur: [[0, 'error']],
};

function tap(kind: Tap) {
  const done =
    kind === 'selection'
      ? Haptics.selectionAsync()
      : kind === 'success'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : kind === 'error'
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          : Haptics.impactAsync(kind);
  done.catch(() => {});
}

const players = new Map<FeelName, AudioPlayer>();

function player(name: FeelName): AudioPlayer {
  let p = players.get(name);
  if (!p) {
    p = createAudioPlayer(SOUNDS[name]);
    p.volume = VOLUME;
    players.set(name, p);
  }
  return p;
}

/**
 * Remet l'audio en mode « ambiance » : muet en silencieux, mélangé à la
 * musique. À rappeler après une note vocale, qui passe en lecture pleine.
 */
export function restoreAmbientAudio() {
  setAudioModeAsync({
    playsInSilentMode: false,
    allowsRecording: false,
    interruptionMode: 'mixWithOthers',
  }).catch(() => {});
}

/** Au lancement : mode ambiance et sons chargés d'avance, pour partir au doigt */
export function prepareFeel() {
  restoreAmbientAudio();
  (Object.keys(SOUNDS) as FeelName[]).forEach(player);
}

/** Joue un moment : son et vibration, selon les réglages du profil */
export function feel(name: FeelName) {
  const { sounds, haptics } = useFeelStore.getState();
  if (haptics)
    for (const [delay, kind] of HAPTICS[name]) {
      if (delay === 0) tap(kind);
      else setTimeout(() => tap(kind), delay);
    }
  if (sounds) {
    const p = player(name);
    p.seekTo(0);
    p.play();
  }
}

/** Une vibration seule, pour suivre un geste. Respecte le réglage « Vibrations ». */
export function buzz(kind: Tap = Light) {
  if (useFeelStore.getState().haptics) tap(kind);
}
