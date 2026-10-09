/**
 * Route /streak-save — hier manqué : poser un marque-page pour garder ma série.
 *
 * S'ouvre seul sur l'accueil, une fois par jour, quand la dernière lecture date
 * d'avant-hier et qu'il me reste un marque-page sur ce livre (3 par livre).
 * Le marque-page couvre hier : la série ne grandit pas ce jour-là, mais elle
 * ne retombe pas à 1. Sinon, « Pas cette fois » la laisse s'éteindre.
 *
 * À faire avant d'enregistrer une page : lire aujourd'hui sans marque-page
 * relance la série à 1 (trigger update_streak).
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import Button3D from '../components/Button3D';
import BonusPill from '../components/ui/BonusPill';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import StreakHero from '../components/ui/StreakHero';
import { useMyStreak } from '../hooks/useMyStreak';
import { spendStreakBonus } from '../services/supabase/database';
import { useProgressStore } from '../stores/progressStore';

export default function StreakSaveRoute() {
  const router = useRouter();
  const { challengeId, days, bonusesLeft } = useMyStreak();
  const loadChallengeProgress = useProgressStore((s) => s.loadChallengeProgress);
  const [isSaving, setIsSaving] = useState(false);

  const handleUse = useCallback(async () => {
    if (!challengeId) return;
    setIsSaving(true);
    try {
      const saved = await spendStreakBonus(challengeId);
      await loadChallengeProgress(challengeId);
      if (saved) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Erreur', "Impossible de poser le marque-page.");
    } finally {
      setIsSaving(false);
    }
  }, [challengeId, loadChallengeProgress, router]);

  return (
    <SheetPage
      title="Garder ma série"
      accent="série"
      subtitle="Hier, pas de lecture"
      actions={<BonusPill left={bonusesLeft} />}
    >
      <StreakHero days={days} flame="dim" />

      <SheetFooter>
        <Button3D onPress={handleUse} variant="primary" loading={isSaving} disabled={bonusesLeft === 0}>
          Utiliser un marque-page
        </Button3D>
        <Button3D onPress={() => router.back()} variant="secondary" disabled={isSaving}>
          Pas cette fois
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}
