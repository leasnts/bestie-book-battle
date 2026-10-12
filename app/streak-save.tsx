/**
 * Route /streak-save — des jours manqués : un marque-page sur chacun pour
 * garder ma série.
 *
 * S'ouvre seul sur l'accueil, une fois par jour, quand la dernière lecture date
 * d'avant-hier ou plus tôt et qu'il me reste un marque-page par jour manqué sur
 * ce livre (3 par livre). Les marque-pages couvrent ces jours : la série ne
 * grandit pas, mais elle ne retombe pas à 1.
 *
 * Pas d'explication en phrases : on voit la semaine, comme le calendrier de
 * /streak — ma série en ruban, puis hier qui la coupe, son marque-page en
 * filigrane ; la flamme et le chiffre pâlis. « Poser un marque-page » demande
 * d'abord au serveur, puis joue la série sauvée : le marque-page descend dans
 * chaque case manquée, le ruban se
 * recoud jusqu'à lui, puis la flamme reprend vie (halo, braises) et le chiffre
 * sa couleur, chaque temps marqué d'un retour haptique. Puis le sheet se ferme.
 * « Perdre ma série » la laisse s'éteindre.
 *
 * À faire avant d'enregistrer une page : lire aujourd'hui sans marque-page
 * relance la série à 1 (trigger update_streak).
 */

import { buzz, feel } from '../utils/feel';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import Button3D from '../components/Button3D';
import BonusPill from '../components/ui/BonusPill';
import GlassSection from '../components/ui/GlassSection';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { addDays, BOOKMARK_LANDS, DaysRow, WeekdayRow, weekdayOf } from '../components/ui/StreakDays';
import StreakHero from '../components/ui/StreakHero';
import { useMyStreak } from '../hooks/useMyStreak';
import { getReadingDays, spendStreakBonus } from '../services/supabase/database';
import { useProgressStore } from '../stores/progressStore';
import { spacing } from '../utils/constants';
import { dayString } from '../utils/streak';

/** La flamme se rallume une fois le ruban recousu */
const REVIVE_AT = BOOKMARK_LANDS + 360;
/** Le temps de voir la série reprendre vie, avant de fermer */
const CLOSE_AFTER = REVIVE_AT + 1300;

export default function StreakSaveRoute() {
  const router = useRouter();
  const { userId, challengeId, days, missedDays, bonusesLeft, bonusDates } = useMyStreak();
  const loadChallengeProgress = useProgressStore((s) => s.loadChallengeProgress);
  const [isSaving, setIsSaving] = useState(false);
  // Les jours manqués, gardés à l'instant (figés au moment de poser : le
  // rechargement les vide) : les marque-pages s'affichent tout de suite
  const [dropped, setDropped] = useState<string[] | null>(null);

  const today = dayString(0);
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
    () => new Set(dropped ? [...bonusDates, ...dropped] : bonusDates),
    [bonusDates, dropped],
  );

  // Les marque-pages posés se décomptent tout de suite, une seule fois (pas
  // encore rechargé, puis rechargé)
  const pillLeft = dropped && !bonusDates.includes(dropped[0])
    ? Math.max(0, bonusesLeft - dropped.length)
    : bonusesLeft;

  // Les jours à garder, figés une fois posés (le rechargement vide missedDays)
  const toKeep = dropped ?? missedDays;

  const [width, setWidth] = useState(0);
  const cellWidth = width / 7;

  const handleUse = useCallback(async () => {
    if (!challengeId || dropped || isSaving) return;
    const days = missedDays;
    setIsSaving(true);
    try {
      // Le serveur d'abord : on ne joue la série sauvée que s'il l'a gardée
      const ok = await spendStreakBonus(challengeId);
      if (!ok) {
        await loadChallengeProgress(challengeId);
        Alert.alert('Série perdue', 'Plus assez de marque-pages.');
        router.back();
        return;
      }
      setDropped(days);
      // Un retour haptique par temps : le marque-page se pose, la flamme repart
      buzz();
      setTimeout(() => feel('serie'), BOOKMARK_LANDS);
      setTimeout(() => buzz('success'), REVIVE_AT);
      await Promise.all([
        loadChallengeProgress(challengeId),
        new Promise((resolve) => setTimeout(resolve, CLOSE_AFTER)),
      ]);
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de poser le marque-page.');
    } finally {
      setIsSaving(false);
    }
  }, [challengeId, dropped, isSaving, missedDays, loadChallengeProgress, router]);

  return (
    <SheetPage
      title="Garder ma série"
      accent="série"
      actions={<BonusPill left={pillLeft} />}
    >
      <StreakHero days={days} flame="dim" revive={!!dropped} delay={REVIVE_AT} />

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
                dropping={dropped ?? undefined}
                awaiting={toKeep}
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
          disabled={!dropped && (missedDays.length === 0 || missedDays.length > bonusesLeft)}
        >
          {toKeep.length > 1 ? `Poser ${toKeep.length} marque-pages` : 'Poser un marque-page'}
        </Button3D>
        <Button3D onPress={() => router.back()} variant="secondary" disabled={isSaving}>
          Perdre ma série
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}
