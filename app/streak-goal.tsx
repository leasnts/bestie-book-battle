/**
 * Route /streak-goal — viser un palier de série (#236).
 *
 * Deux moments, le même sheet :
 * - ma série est finie (trop de jours manqués pour les marque-pages) : la
 *   flamme éteinte et son ancien total, puis relancer en visant 3, 7 ou 14
 *   jours. S'ouvre seul une fois par série finie.
 * - `?reached=7` : le palier est atteint, la flamme brûle ; on vise les trois
 *   paliers suivants. S'ouvre seul une fois par palier.
 *
 * Rien de pré-choisi : le bouton s'allume quand un palier est touché. « Plus
 * tard » retire le palier (il est fini, ou il appartenait à la série d'avant) :
 * la gélule redevient un simple nombre.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import Button3D from '../components/Button3D';
import ChoiceRow from '../components/ui/ChoiceRow';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import StreakHero from '../components/ui/StreakHero';
import { useMyStreak } from '../hooks/useMyStreak';
import { setStreakGoal } from '../services/supabase/database';
import { useProgressStore } from '../stores/progressStore';
import { spacing } from '../utils/constants';
import { buzz } from '../utils/feel';
import { oops } from '../utils/notice';
import { nextStreakGoals } from '../utils/streak';

export default function StreakGoalRoute() {
  const router = useRouter();
  const { reached: reachedParam } = useLocalSearchParams<{ reached?: string }>();
  const reached = Number(reachedParam) || 0;
  const { userId, challengeId, days, lastDays } = useMyStreak();
  const loadChallengeProgress = useProgressStore((s) => s.loadChallengeProgress);
  const [picked, setPicked] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const goals = nextStreakGoals(reached);

  const save = useCallback(
    async (goal: number | null) => {
      if (!userId || !challengeId || saving) return;
      setSaving(true);
      try {
        await setStreakGoal(challengeId, userId, goal);
        if (goal) buzz('success');
        await loadChallengeProgress(challengeId);
        router.back();
      } catch (error) {
        oops('Palier pas enregistré', error, { retry: () => save(goal) });
      } finally {
        setSaving(false);
      }
    },
    [userId, challengeId, saving, loadChallengeProgress, router],
  );

  return (
    <SheetPage
      title={reached ? 'Palier atteint' : 'Ma série est finie'}
      accent={reached ? 'atteint' : 'finie'}
    >
      <StreakHero days={reached ? days : lastDays} flame={reached ? 'lit' : 'off'} />

      {/* L'air sous le chiffre, comme la semaine de /streak-save */}
      <View style={{ marginTop: spacing.lg }}>
        {goals.map((goal) => (
          <ChoiceRow
            key={goal}
            single
            label={`${goal} jours`}
            selected={picked === goal}
            onPress={() => setPicked(goal)}
          />
        ))}
      </View>

      <SheetFooter>
        <Button3D
          onPress={() => picked && save(picked)}
          variant="primary"
          disabled={!picked}
          loading={saving && !!picked}
        >
          {reached ? 'Viser plus loin' : 'Relancer ma série'}
        </Button3D>
        <Button3D onPress={() => save(null)} variant="secondary" disabled={saving}>
          Plus tard
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}
