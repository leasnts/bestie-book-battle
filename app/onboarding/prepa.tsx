/**
 * La préparation : trois livres tombent et s'empilent pendant que tout
 * s'enregistre vraiment (idée reprise de Basta). Pas un spinner : une
 * animation de marque d'environ 2 s, calée sur l'enregistrement.
 *
 * Enregistre : le profil (s'il n'était qu'en attente), la lecture rejointe,
 * ma lecture de ce livre (format, édition, position, date de fin), mes habitudes,
 * le rappel à mon heure. Puis la carte de lecture.
 */

import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Keyframe, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import Button3D from '../../components/Button3D';
import Spine from '../../components/onboarding/Spine';
import { Seam } from '../../components/ui/GoalTrack';
import { scheduleEveningReminder } from '../../services/notifications';
import { createReading, deadlineFrom, ensureProfile, reminderTime, saveReaderHabits, settleMyReading } from '../../services/onboarding';
import { bookFormat, useOnboardingStore } from '../../stores/onboardingStore';
import { useProjectStore } from '../../stores/projectStore';
import { colors, fonts, lowki, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';

/** Le temps de voir la pile se faire, même si tout est déjà enregistré */
const MIN_MS = 2000;

const BOOKS = [
  { width: 150, colors: [lowki.chocolate.light, lowki.chocolate.dark], angle: -1 },
  { width: 128, colors: [lowki.red.light, lowki.red.dark], angle: 2 },
  { width: 140, colors: [lowki.beige.light, lowki.beige.dark], angle: -3 },
] as const;
/** Un livre tombe toutes les 380 ms */
const DROP_EVERY = 380;
const DROP_MS = 550;

/** La chute, relative : l'inclinaison au repos est sur la vue d'au-dessus */
const fall = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -230 }, { rotate: '-28deg' }] },
  60: { opacity: 1 },
  100: { opacity: 1, transform: [{ translateY: 0 }, { rotate: '0deg' }] },
}).duration(DROP_MS);

export default function PrepaScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [text, setText] = useState('On prépare ta lecture…');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const save = useCallback(async () => {
    const store = useOnboardingStore.getState();
    const { flow, book, invitation, start, dated, days, moments, usualFormats } = store;
    const format = bookFormat(store);
    if (!book) throw new Error('Pas de livre');

    const userId = await ensureProfile();
    const percent = format !== 'papier';
    // La date de fin est celle du groupe : choisie en créant, reçue en rejoignant
    const end = invitation ? undefined : deadlineFrom(dated, days);

    // La lecture : rejointe, ou créée (à « On invite qui ? », sinon ici)
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
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') await scheduleEveningReminder(reminderTime(moments));
    }

    const projects = useProjectStore.getState();
    await projects.loadUserChallenges(userId);
    const reading = useProjectStore.getState().challenges.find((c) => c.id === challengeId);
    if (reading) projects.setActiveChallenge(reading);
    projects.loadMyProgress(userId);
  }, []);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    const textTimer = setTimeout(() => alive && setText('Ta carte se remplit…'), 1000);
    const ticks = reducedMotion ? [] : BOOKS.map((_, i) => setTimeout(() => feel('tic'), i * DROP_EVERY + DROP_MS - 80));

    Promise.all([save(), new Promise((done) => setTimeout(done, MIN_MS))])
      .then(() => alive && router.replace('/onboarding/carte'))
      .catch((error) => {
        console.error('Préparation de la lecture :', error);
        if (!alive) return;
        feel('erreur');
        setFailed(true);
      });

    return () => {
      alive = false;
      clearTimeout(textTimer);
      ticks.forEach(clearTimeout);
    };
  }, [attempt, save, router, reducedMotion]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <View style={styles.pile} accessible={false}>
          {BOOKS.map((book, i) => (
            <View key={`${attempt}-${i}`} style={{ transform: [{ rotate: `${book.angle}deg` }] }}>
              <Animated.View entering={reducedMotion ? undefined : fall.delay(i * DROP_EVERY)}>
                <Spine width={book.width} colors={book.colors} />
              </Animated.View>
            </View>
          ))}
        </View>
        {failed ? (
          <>
            <Text style={styles.text}>Ça n’a pas marché. Le réseau ?</Text>
            <Button3D variant="secondary" onPress={() => setAttempt((a) => a + 1)}>
              Réessayer
            </Button3D>
          </>
        ) : (
          <>
            <Text style={styles.text} accessibilityLiveRegion="polite">{text}</Text>
            <SewingThread key={attempt} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/** Le fil qui se coud pendant la préparation */
function SewingThread() {
  const [width, setWidth] = useState(0);
  const [read, setRead] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / MIN_MS);
      setRead(t);
      if (t >= 1) clearInterval(timer);
    }, 60);
    return () => clearInterval(timer);
  }, []);
  return (
    <View style={styles.thread} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={6}>
          <Seam width={width} readUntil={width * read} y={3} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
  },
  pile: {
    height: 120,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'column-reverse',
    gap: 3,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  thread: {
    width: 160,
    height: 6,
  },
});
