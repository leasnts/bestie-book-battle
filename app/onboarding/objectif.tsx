/**
 * On se donne une date de fin ? Pour tout le groupe : pas de rythme en pages,
 * qui avantagerait qui lit vite (Lea, 2026-10-30).
 *
 *    [ Non ]           chacun·e avance à son rythme
 *    [ Oui ]
 *         dim. 15 nov.             la roulette de la date
 *    ▱ Fin dans 2 semaines      ◢  l'autocollant, toute la largeur, en bas
 *
 * « Oui » propose 2 semaines d'emblée.
 * « Non » : rien de plus. On rejoint : pas cet écran,
 * la date est celle du groupe.
 */

import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import OptionList from '../../components/onboarding/OptionList';
import StickerText from '../../components/onboarding/StickerText';
import { TORN_EDGE_H } from '../../components/onboarding/TornEdge';
import { deadlineFrom } from '../../services/onboarding';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, postIt, spacing } from '../../utils/constants';
import { nextStep } from '../../utils/onboardingFlow';

/** Ce que « Oui » propose d'emblée */
const FIRST_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function ObjectifScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const dated = useOnboardingStore((s) => s.dated);
  const days = useOnboardingStore((s) => s.days);
  const patch = useOnboardingStore((s) => s.patch);
  const [stickerWidth, setStickerWidth] = useState(0);

  const end = deadlineFrom(dated, days);
  const ready = dated === false || !!end;

  /** La roulette : des jours entiers depuis aujourd'hui */
  const onWheel = (date: Date) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const picked = new Date(date);
    picked.setHours(12, 0, 0, 0);
    patch({ days: Math.max(1, Math.round((picked.getTime() - today.getTime()) / DAY_MS)) });
  };

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
            { key: 'non', label: 'Non' },
            { key: 'oui', label: 'Oui' },
          ]}
          value={dated === null ? null : dated ? 'oui' : 'non'}
          onChange={(key) => patch(key === 'oui' ? { dated: true, days: days ?? FIRST_DAYS } : { dated: false })}
        />
      </Animated.View>
      {dated && end && (
        <Animated.View entering={rise(0)} style={styles.when}>
          <DateTimePicker
            value={new Date(`${end}T12:00:00`)}
            mode="date"
            display="spinner"
            minimumDate={new Date(Date.now() + DAY_MS)}
            onChange={(_event, date) => date && onWheel(date)}
            locale="fr-FR"
            textColor={colors.textPrimary}
          />
        </Animated.View>
      )}
      {/* L'autocollant, toute la largeur, ferré en bas : 16 pt au-dessus du bord déchiré */}
      <View style={styles.bottom} onLayout={(e) => setStickerWidth(e.nativeEvent.layout.width)}>
        {dated && stickerWidth > 0 && (
          <Animated.View entering={rise(0)}>
            <StickerText
              id="objectif-say"
              text={`Fin dans ${inTime(days ?? FIRST_DAYS)}`}
              color={postIt.jaune}
              popKey={days ?? FIRST_DAYS}
              width={stickerWidth}
              height={72}
            />
          </Animated.View>
        )}
      </View>
    </OnboardingScreen>
  );
}

/** « 2 semaines », « 10 jours » */
function inTime(days: number) {
  if (days % 7 === 0) return days === 7 ? '1 semaine' : `${days / 7} semaines`;
  return days === 1 ? '1 jour' : `${days} jours`;
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  when: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  bottom: {
    marginTop: 'auto',
    marginBottom: spacing.lg + TORN_EDGE_H - spacing.xl,
  },
});
