/**
 * La fin de l'onboarding : la carte de lecture se retourne et s'écrit
 * pendant que tout s'enregistre vraiment (essai A, Lea, 2026-11-12). Plus
 * d'écran de préparation à part : l'attente, c'est la carte qui s'écrit.
 *
 * Enregistre : le profil (s'il n'était qu'en attente), la lecture rejointe
 * ou créée, ma lecture de ce livre (format, édition, position, date de fin),
 * mes habitudes, le rappel à mon heure.
 */

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { registerPushToken } from '../services/notifications';
import { createReading, deadlineFrom, ensureProfile, saveReaderHabits, settleMyReading } from '../services/onboarding';
import { bookFormat, useOnboardingStore } from '../stores/onboardingStore';
import { useProjectStore } from '../stores/projectStore';
import { feel } from './feel';

/** Le temps de voir la carte s'écrire, même si tout est déjà enregistré */
const MIN_MS = 2000;
/** La carte se retourne, puis une ligne s'écrit toutes les… */
export const FLIP_MS = 750;
export const LINE_EVERY = 240;

/** Tout enregistrer, d'après le brouillon */
export async function saveOnboarding() {
  const store = useOnboardingStore.getState();
  const { flow, book, invitation, start, dated, days, moments, usualFormats } = store;
  const format = bookFormat(store);
  if (!book) throw new Error('Pas de livre');

  const userId = await ensureProfile();
  const percent = format !== 'papier';
  // La date de fin est celle du groupe : choisie en créant, reçue en rejoignant
  const end = invitation ? undefined : deadlineFrom(dated, days);

  // La lecture : rejointe, ou créée (à « Invite tes potes », sinon ici)
  let challengeId = invitation?.challengeId ?? store.createdChallengeId;
  if (invitation) {
    await useProjectStore.getState().joinChallenge(invitation.challengeId, userId);
  } else if (!challengeId) {
    challengeId = (await createReading(userId, book, end ?? null)).id;
    store.patch({ createdChallengeId: challengeId });
  }
  if (!challengeId) throw new Error('Pas de lecture');

  // Mon édition papier, si elle n'est pas celle de la lecture rejointe
  const ownEdition =
    !percent && invitation && (book.pages !== invitation.pages || book.cover !== invitation.cover || book.publisher)
      ? { pages: book.pages, cover: book.cover, publisher: book.publisher }
      : undefined;
  await settleMyReading(challengeId, userId, { format, edition: ownEdition, start, targetEndDate: end });

  // Mes habitudes : seulement quand on les a demandées (première fois)
  if (flow === 'create' || flow === 'join') {
    await saveReaderHabits(userId, moments, usualFormats);
    // Déjà autorisé (un autre livre, une réinstallation) : le serveur a besoin de l'adresse du téléphone
    registerPushToken(userId).catch((e) => console.warn('[notifs] jeton', e));
  }

  const projects = useProjectStore.getState();
  await projects.loadUserChallenges(userId);
  const reading = useProjectStore.getState().challenges.find((c) => c.id === challengeId);
  if (reading) projects.setActiveChallenge(reading);
  projects.loadMyProgress(userId);
}

export type FinishState = {
  /** La carte est retournée */
  turned: boolean;
  /** Le nombre de lignes déjà écrites */
  written: number;
  /** Tout est enregistré et écrit : le tampon tombe, le bouton arrive */
  done: boolean;
  failed: boolean;
  retry: () => void;
  /** « Ouvrir le livre » */
  open: () => void;
};

/**
 * Le déroulé de la fin, lancé quand `started` passe à true : la carte se
 * retourne après `flipAfter` ms, ses `lines` lignes s'écrivent, et le tampon
 * attend que l'enregistrement soit fini.
 */
export function useFinishOnboarding(started: boolean, lines: number, flipAfter = 0): FinishState {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [turned, setTurned] = useState(false);
  const [written, setWritten] = useState(0);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Retourner la carte, puis écrire les lignes une à une
  useEffect(() => {
    if (!started) return;
    if (reducedMotion) {
      setTurned(true);
      setWritten(lines);
      return;
    }
    const timers = [
      setTimeout(() => {
        setTurned(true);
        feel('tic');
      }, flipAfter),
      ...Array.from({ length: lines }, (_, i) => setTimeout(() => setWritten(i + 1), flipAfter + FLIP_MS + i * LINE_EVERY)),
    ];
    return () => timers.forEach(clearTimeout);
  }, [started, lines, flipAfter, reducedMotion]);

  // Enregistrer pendant ce temps, au moins le temps de la voir s'écrire
  useEffect(() => {
    if (!started) return;
    let alive = true;
    setFailed(false);
    Promise.all([saveOnboarding(), new Promise((done) => setTimeout(done, reducedMotion ? 0 : MIN_MS))])
      .then(() => alive && setSaved(true))
      .catch((error) => {
        console.error('Enregistrement de la lecture :', error);
        if (!alive) return;
        feel('erreur');
        setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [started, attempt, reducedMotion]);

  const done = saved && written >= lines;

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const open = useCallback(async () => {
    feel('appui');
    const { flow } = useOnboardingStore.getState();
    // Première fois : les notifications, sur le seuil de l'accueil (si iOS n'a pas déjà sa réponse)
    if (flow === 'create' || flow === 'join') {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'undetermined') return router.replace('/onboarding/notifications');
    }
    useOnboardingStore.getState().reset();
    router.replace('/(tabs)');
  }, [router]);

  return { turned, written, done, failed, retry, open };
}
