/**
 * Route /streak-goal — viser un palier de série (#236), à la Duolingo.
 *
 * Deux moments, le même sheet :
 * - ma série est finie (trop de jours manqués pour les marque-pages) : la
 *   flamme éteinte et son ancien total, en sable. S'ouvre seul une fois par
 *   série finie.
 * - `?reached=7` : le palier est atteint, la flamme brûle. S'ouvre seul une
 *   fois par palier.
 *
 *   🔥 17 jours                   le héros de /streak-save ; un palier touché :
 *   ┌──────────────────────────┐  la flamme se rallume, le chiffre devient le
 *   │ 3 jours       tranquille │  palier, « jours à tenir »
 *   └──────────────────────────┘  les lignes de l'onboarding (OptionList),
 *   [ Relancer ma série ]         brodées seulement une fois choisies
 *   [ Plus tard ]
 *
 * Rien de pré-choisi : le bouton s'allume quand un palier est touché. « Plus
 * tard » retire le palier : la gélule redevient un simple nombre.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import Button3D from '../components/Button3D';
import OptionList from '../components/onboarding/OptionList';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import StreakHero from '../components/ui/StreakHero';
import { useMyStreak } from '../hooks/useMyStreak';
import { setStreakGoal } from '../services/supabase/database';
import { useProgressStore } from '../stores/progressStore';
import { spacing } from '../utils/constants';
import { buzz } from '../utils/feel';
import { oops } from '../utils/notice';
import { nextStreakGoals } from '../utils/streak';

/** Le petit mot de chaque palier, à droite de sa ligne */
const GOAL_WORDS: Record<number, string> = {
  3: 'tranquille',
  7: 'bon rythme',
  14: 'gros mental',
  30: 'légendaire',
  60: 'inarrêtable',
  100: 'mythique',
  200: 'hors norme',
  365: 'une année',
};

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
      <StreakHero
        days={picked ?? (reached ? days : lastDays)}
        flame={reached || picked ? 'lit' : 'off'}
        unit={picked ? 'jours à tenir' : undefined}
      />

      <View style={{ marginTop: spacing.lg }}>
        <OptionList
          options={goals.map((goal) => ({
            key: String(goal),
            label: `${goal} jours`,
            detail: GOAL_WORDS[goal],
          }))}
          value={picked ? String(picked) : null}
          onChange={(key) => setPicked(Number(key))}
        />
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
