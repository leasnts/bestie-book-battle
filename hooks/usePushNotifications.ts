/**
 * usePushNotifications — ce que l'app fait des notifs du serveur (#178).
 * Monté une fois, dans app/_layout.tsx.
 *
 * - Connecté·e, hors onboarding : donne au serveur l'adresse du téléphone et
 *   son fuseau (à chaque retour dans l'app : on a pu voyager) ; efface les
 *   anciens rappels que le téléphone planifiait lui-même.
 * - App ouverte : aucune notif système (services/notifications.ts). Seule une
 *   note déposée par une pote fait un signe : un bandeau papier qui ouvre le carnet.
 * - Toucher une notif ouvre le bon écran, sur le bon livre, même app fermée.
 */

import * as Notifications from 'expo-notifications';
import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { registerPushToken, type PushData } from '../services/notifications';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { notePing } from '../utils/notice';

export function usePushNotifications() {
  const router = useRouter();
  const segments = useSegments();
  const userId = useAuthStore((s) => s.user?.id);
  const challengesLoaded = useProjectStore((s) => s.challengesLoaded);
  const inOnboarding = segments[0] === 'onboarding' || segments[0] === 'auth';
  // L'app est arrivée quelque part (accueil, carnet…) : on peut naviguer
  const ready = !inOnboarding && (segments as string[]).length > 0;

  /** Le bon livre au premier plan, puis le bon écran */
  const openRef = useRef((data: PushData) => {
    const { challenges, activeChallenge, setActiveChallenge } = useProjectStore.getState();
    if (data.challengeId && activeChallenge?.id !== data.challengeId) {
      const reading = challenges.find((c) => c.id === data.challengeId);
      if (reading) setActiveChallenge(reading);
    }
    if (!data.url || data.url === '/') router.navigate('/(tabs)');
    else router.push(data.url as Href);
  });

  // L'adresse du téléphone et son fuseau, à l'arrivée puis à chaque retour
  useEffect(() => {
    if (!userId || inOnboarding) return;
    const register = () => registerPushToken(userId).catch((e) => console.warn('[notifs] jeton', e));
    // Les rappels que le téléphone planifiait avant #178 : c'est le serveur qui s'en charge
    Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    register();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && register());
    return () => sub.remove();
  }, [userId, inOnboarding]);

  // App ouverte : seule une note déposée mérite un signe
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      const data = notification.request.content.data as unknown as PushData | undefined;
      if (data?.kind !== 'carnet' || !data.note || !title) return;
      notePing(title, body ?? undefined, () => openRef.current(data));
    });
    return () => sub.remove();
  }, []);

  // Toucher une notif : une seule fois chacune, dès que l'app est prête (lancée par la notif aussi)
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = response.notification.request.identifier;
    if (handled.current === id || !userId || !challengesLoaded || !ready) return;
    handled.current = id;
    const data = response.notification.request.content.data as unknown as PushData | undefined;
    if (data?.url) openRef.current(data);
    Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
  }, [response, userId, challengesLoaded, ready]);
}
