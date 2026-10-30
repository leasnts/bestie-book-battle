/**
 * On se donne une date de fin ? Pour tout le groupe : pas de rythme en pages,
 * qui avantagerait qui lit vite (Lea, 2026-10-30).
 *
 *    [ Oui ]                       une date, choisie juste dessous
 *    [ Non, tranquille ]           chacun·e avance à son rythme
 *      [ 2 semaines ] [ 1 mois ] [ 2 mois ]
 *
 * Dessous, un autocollant au coin corné se colle à chaque choix et donne le
 * jour. Rien de choisi d'avance. On rejoint : pas cet écran, la date est celle
 * du groupe.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import OptionList from '../../components/onboarding/OptionList';
import StickerText from '../../components/onboarding/StickerText';
import { deadlineFrom } from '../../services/onboarding';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { postIt, spacing } from '../../utils/constants';
import { nextStep } from '../../utils/onboardingFlow';

const DURATIONS = [
  { key: '14', label: '2 semaines' },
  { key: '30', label: '1 mois' },
  { key: '60', label: '2 mois' },
] as const;
type Duration = (typeof DURATIONS)[number]['key'];

export default function ObjectifScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const dated = useOnboardingStore((s) => s.dated);
  const days = useOnboardingStore((s) => s.days);
  const patch = useOnboardingStore((s) => s.patch);

  const end = deadlineFrom(dated, days);
  const ready = dated === false || !!end;

  return (
    <OnboardingScreen
      step="objectif"
      title="On se donne une date de fin ?"
      accent="date"
      footer={
        <Button3D variant="primary" onPress={() => router.push(nextStep(flow, 'objectif'))} disabled={!ready} style={styles.wide}>
          Continuer
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)}>
        <OptionList
          options={[
            { key: 'oui', label: 'Oui' },
            { key: 'non', label: 'Non, tranquille' },
          ]}
          value={dated === null ? null : dated ? 'oui' : 'non'}
          onChange={(key) => patch({ dated: key === 'oui' })}
        />
      </Animated.View>
      {dated && (
        <Animated.View entering={rise(0)}>
          <OptionList
            options={[...DURATIONS]}
            value={days ? (String(days) as Duration) : null}
            onChange={(key) => patch({ days: Number(key) })}
          />
        </Animated.View>
      )}
      {(dated === false || end) && (
        <Animated.View entering={rise(0)} style={styles.center}>
          <StickerText
            id="objectif-say"
            text={end ? `Fin le ${formatDay(end)}` : 'Sans date, sans pression.'}
            color={postIt.jaune}
            popKey={end ?? 'libre'}
            width={300}
            height={96}
          />
        </Animated.View>
      )}
    </OnboardingScreen>
  );
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
