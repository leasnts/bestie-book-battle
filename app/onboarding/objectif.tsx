/**
 * Combien par jour ? Un rythme, pas une deadline : la date de fin se calcule.
 *
 * - Papier : en pages (10, 20, 40), le temps en dessous dans l'autocollant.
 * - Liseuse ou audio : en temps (≈ 15 min, 30 min, 1 h), l'équivalent en %
 *   dans l'autocollant ; on enregistre des % par jour.
 * - « Libre » : pas de date.
 *
 * Au-dessus, le bloc de pages s'épaissit avec le choix ; dessous, un
 * autocollant réagit et donne la date (idées reprises de Basta).
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import PageBlock from '../../components/onboarding/PageBlock';
import StickerText from '../../components/onboarding/StickerText';
import OptionList from '../../components/onboarding/OptionList';
import { endDateFor } from '../../services/onboarding';
import { bookFormat, useOnboardingStore } from '../../stores/onboardingStore';
import { postIt, spacing } from '../../utils/constants';
import { nextStep } from '../../utils/onboardingFlow';

/** Les rythmes proposés, en pages papier par jour ; 0 = libre */
const PACES = [10, 20, 40, 0] as const;
type Pace = (typeof PACES)[number];

const MINUTES: Record<Pace, string> = { 10: '≈ 15 min', 20: '≈ 30 min', 40: '≈ 1 h', 0: 'Libre' };
const SAY: Record<Pace, string> = { 10: 'Tranquille, et ça tient.', 20: 'Le bon rythme.', 40: 'À fond.', 0: 'Sans date, sans pression.' };
/** L'épaisseur du bloc de pages pour chaque rythme */
const THICKNESS: Record<Pace, number> = { 10: 16, 20: 38, 40: 80, 0: 30 };

export default function ObjectifScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { flow, book, start, perDay, patch } = store;
  const percent = bookFormat(store) !== 'papier';
  if (!book) return null;

  /** Le rythme choisi, ramené en pages papier pour l'afficher */
  const pace: Pace = perDay === null ? 0 : nearestPace(percent ? (perDay / 100) * book.pages : perDay);

  const choose = (value: Pace) => {
    if (value === 0) return patch({ perDay: null });
    patch({ perDay: percent ? Math.max(1, Math.round((value / book.pages) * 100)) : value });
  };

  const remaining = (percent ? 100 : book.pages) - start;
  const end = endDateFor(remaining, perDay);
  const caption = end
    ? `${percent ? `${perDay} % par jour` : MINUTES[pace]} · fin vers le ${formatDay(end)}`
    : undefined;

  return (
    <OnboardingScreen
      step="objectif"
      title="Combien par jour ?"
      accent="jour"
      footer={
        <Button3D variant="primary" onPress={() => router.push(nextStep(flow, 'objectif'))} style={styles.wide}>
          Continuer
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)}>
        <PageBlock thickness={THICKNESS[pace]} faded={pace === 0} />
      </Animated.View>
      <Animated.View entering={rise(2)}>
        <OptionList
          options={PACES.map((p) => ({ key: String(p) as `${Pace}`, label: p === 0 ? 'Libre' : percent ? MINUTES[p] : `${p} p.` }))}
          value={String(pace) as `${Pace}`}
          onChange={(key) => choose(Number(key) as Pace)}
        />
      </Animated.View>
      <Animated.View entering={rise(3)} style={styles.center}>
        <StickerText id="objectif-say" text={SAY[pace]} caption={caption} color={postIt.jaune} popKey={pace} width={300} height={112} />
      </Animated.View>
    </OnboardingScreen>
  );
}

function nearestPace(pages: number): Pace {
  return [10, 20, 40].reduce((a, b) => (Math.abs(b - pages) < Math.abs(a - pages) ? b : a)) as Pace;
}

/** « jeudi 19 novembre » */
function formatDay(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  center: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});

