/**
 * useMyStreak — ma série sur le livre en cours, au même endroit pour
 * l'accueil, la semaine (/streak) et le marque-page (/streak-save).
 */

import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import { bonusesLeft, getStreakState } from '../utils/streak';

export function useMyStreak() {
  const userId = useAuthStore((s) => s.user?.id);
  const challengeId = useProjectStore((s) => s.activeChallenge?.id);
  const progress = useProgressStore((s) =>
    s.participants.find(
      (p) => p.progress.user_id === userId && p.progress.challenge_id === challengeId,
    )?.progress,
  );
  const bonusDates = progress?.streak_bonus_dates ?? [];
  const { state, days } = getStreakState(
    progress?.streak_count ?? 0,
    progress?.last_streak_date ?? null,
    bonusDates,
  );
  return {
    userId,
    challengeId,
    loaded: !!progress,
    state,
    days,
    bonusDates,
    bonusesLeft: bonusesLeft(bonusDates),
  };
}
