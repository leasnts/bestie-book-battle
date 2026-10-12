/**
 * Route /streak-save — hier manqué : poser un marque-page pour garder ma série.
 *
 * S'ouvre seul sur l'accueil, une fois par jour, quand la dernière lecture date
 * d'avant-hier et qu'il me reste un marque-page sur ce livre (3 par livre).
 * Le marque-page couvre hier : la série ne grandit pas ce jour-là, mais elle
 * ne retombe pas à 1. Sinon, « Pas cette fois » la laisse s'éteindre.
 *
 * Pas d'explication en phrases : on voit la semaine, comme le calendrier de
 * /streak — ma série en ruban, puis hier, vide, qui la coupe. « Poser un
 * marque-page » le fait descendre dans la case d'hier, le ruban se recoud, la
 * flamme se rallume, puis le sheet se ferme.
 *
 * À faire avant d'enregistrer une page : lire aujourd'hui sans marque-page
 * relance la série à 1 (trigger update_streak).
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import Button3D from '../components/Button3D';
import BonusPill from '../components/ui/BonusPill';
import GlassSection from '../components/ui/GlassSection';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { addDays, DaysRow, WeekdayRow, weekdayOf } from '../components/ui/StreakDays';
import StreakHero from '../components/ui/StreakHero';
import { useMyStreak } from '../hooks/useMyStreak';
import { getReadingDays, spendStreakBonus } from '../services/supabase/database';
import { useProgressStore } from '../stores/progressStore';
import { spacing } from '../utils/constants';
import { dayString } from '../utils/streak';

/** Le temps de voir le marque-page se poser et le ruban se recoudre, avant de fermer */
const CLOSE_AFTER = 1100;

export default function StreakSaveRoute() {
  const router = useRouter();
  const { userId, challengeId, days, bonusesLeft, bonusDates } = useMyStreak();
  const loadChallengeProgress = useProgressStore((s) => s.loadChallengeProgress);
  const [isSaving, setIsSaving] = useState(false);
  // Hier, gardé à l'instant : le marque-page s'affiche tout de suite
  const [dropped, setDropped] = useState(false);

  const today = dayString(0);
  const yesterday = dayString(1);
  // Une semaine glissante : cinq jours avant aujourd'hui, et demain qui s'efface
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i - 5)), [today]);

  const [readDays, setReadDays] = useState<string[]>([]);
  useEffect(() => {
    if (!userId || !challengeId) return;
    getReadingDays(challengeId, userId, addDays(today, -6))
      .then(setReadDays)
      .catch(() => {});
  }, [userId, challengeId, today]);

  const read = useMemo(() => new Set(readDays), [readDays]);
  const saved = useMemo(
    () => new Set(dropped ? [...bonusDates, yesterday] : bonusDates),
    [bonusDates, dropped, yesterday],
  );

  // Le marque-page posé se décompte tout de suite, une seule fois (pas encore
  // rechargé, puis rechargé)
  const pillLeft = dropped && !bonusDates.includes(yesterday) ? Math.max(0, bonusesLeft - 1) : bonusesLeft;

  const [width, setWidth] = useState(0);
  const cellWidth = width / 7;

  const handleUse = useCallback(async () => {
    if (!challengeId || dropped) return;
    setIsSaving(true);
    setDropped(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const ok = await spendStreakBonus(challengeId);
      if (!ok) {
        setDropped(false);
        router.back();
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Promise.all([
        loadChallengeProgress(challengeId),
        new Promise((resolve) => setTimeout(resolve, CLOSE_AFTER)),
      ]);
      router.back();
    } catch {
      setDropped(false);
      Alert.alert('Erreur', 'Impossible de poser le marque-page.');
    } finally {
      setIsSaving(false);
    }
  }, [challengeId, dropped, loadChallengeProgress, router]);

  return (
    <SheetPage
      title="Garder ma série"
      accent="série"
      subtitle="Hier, pas de lecture"
      actions={<BonusPill left={pillLeft} />}
    >
      <StreakHero days={days} flame={dropped ? 'lit' : 'dim'} />

      <GlassSection paper style={{ marginTop: spacing.lg }}>
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 && (
            <>
              <WeekdayRow letters={week.map(weekdayOf)} cellWidth={cellWidth} />
              <DaysRow
                days={week}
                cellWidth={cellWidth}
                today={today}
                read={read}
                saved={saved}
                dropping={dropped ? yesterday : undefined}
                awaiting={yesterday}
              />
            </>
          )}
        </View>
      </GlassSection>

      <SheetFooter>
        <Button3D
          onPress={handleUse}
          variant="primary"
          loading={isSaving && !dropped}
          disabled={bonusesLeft === 0 && !dropped}
        >
          Poser un marque-page
        </Button3D>
        <Button3D onPress={() => router.back()} variant="secondary" disabled={isSaving}>
          Pas cette fois
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}
