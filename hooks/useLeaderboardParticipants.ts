/**
 * Hook useLeaderboardParticipants
 *
 * Transforme les participants bruts du progressStore en données prêtes à
 * afficher dans un classement.
 *
 * Pourquoi un hook partagé :
 * Le classement apparaît à deux endroits — la section de l'accueil (4 lignes)
 * et la route `/leaderboard` (liste complète). Les deux doivent afficher
 * exactement les mêmes noms, photos, scores et streaks. En dupliquant ce
 * mapping, le moindre ajustement d'un côté créerait un écart silencieux
 * avec l'autre.
 */

import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import { LeaderboardParticipant } from '../utils/leaderboard';
import { getActiveStreak, isStreakAtRisk } from '../utils/streak';

/**
 * Ajoute un paramètre de version à une URL d'image.
 *
 * expo-image met les images en cache par URL. Sans ce « cache busting », changer
 * sa photo de profil ne changerait rien à l'écran : la lib ressert l'ancienne
 * image, l'URL n'ayant pas bougé.
 */
function withCacheBust(url: string | null, updatedAt: string | null | undefined): string | null {
  if (!url || !updatedAt) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${new Date(updatedAt).getTime()}`;
}

export interface LeaderboardData {
  /** Participants prêts à afficher, non triés (le tri se fait au rendu) */
  participants: LeaderboardParticipant[];
  /** ID de l'utilisateur connecté */
  myUserId: string;
}

export function useLeaderboardParticipants(): LeaderboardData {
  const { user } = useAuthStore();
  const { participants } = useProgressStore();
  const { activeChallenge } = useProjectStore();

  return useMemo(() => {
    const myUserId = user?.id ?? '';

    // Garde-fou : au changement de livre, `participants` contient encore
    // brièvement les données du challenge précédent. Les afficher ferait
    // clignoter de faux scores.
    const matchesChallenge =
      participants.length > 0 &&
      participants[0].progress.challenge_id === activeChallenge?.id;

    if (!matchesChallenge) {
      return {
        participants: [
          {
            id: myUserId,
            name: 'Moi',
            photoUrl: withCacheBust(user?.profile_photo_url ?? null, user?.updated_at),
            score: 0,
            percentage: 0,
            streak: 0,
            streakAtRisk: false,
          },
        ],
        myUserId,
      };
    }

    const mapped: LeaderboardParticipant[] = participants.map((p) => {
      const isMe = p.user.id === myUserId;

      // Pour moi, la photo vient de authStore et non du progressStore : ce
      // dernier est chargé une fois et ne se rafraîchit pas quand je change
      // ma photo de profil, alors que authStore est mis à jour immédiatement.
      const photoUrl = isMe
        ? withCacheBust(user?.profile_photo_url ?? null, user?.updated_at)
        : withCacheBust(p.user.profile_photo_url ?? null, p.user.updated_at);

      return {
        id: p.user.id,
        name: isMe ? 'Moi' : p.user.first_name || 'Participant',
        photoUrl,
        score: p.progress.current_page,
        percentage: p.percentage || 0,
        streak: getActiveStreak(p.progress.streak_count, p.progress.last_streak_date),
        streakAtRisk: isStreakAtRisk(p.progress.last_streak_date),
      };
    });

    return { participants: mapped, myUserId };
  }, [participants, user, activeChallenge]);
}
