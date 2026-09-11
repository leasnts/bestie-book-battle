/**
 * Route /leaderboard — classement complet
 *
 * Présentée comme un sheet iOS natif (`presentation: 'formSheet'`, configuré
 * dans app/_layout.tsx). C'est iOS qui dessine le sheet : poignée, paliers de
 * hauteur, glissement élastique pour fermer, assombrissement du fond et recul
 * de l'écran parent. Rien de tout ça n'est réimplémenté ici.
 *
 * Pourquoi une route et pas un composant `<Modal>` :
 * un sheet natif est un *view controller* présenté par la pile de navigation.
 * Le déclarer comme route est la seule façon pour qu'Expo Router le pousse
 * dans la pile native — et donc que son contenu soit mis en page correctement.
 *
 * Les données viennent directement des stores Zustand, via le même hook que
 * la section de l'accueil : aucune donnée n'est passée en paramètre d'URL.
 */

import React from 'react';
import { useLeaderboardParticipants } from '../hooks/useLeaderboardParticipants';
import LeaderboardList from '../components/ui/LeaderboardList';

export default function LeaderboardRoute() {
  const { participants, myUserId, hasDifferentEditions } = useLeaderboardParticipants();

  return (
    <LeaderboardList
      participants={participants}
      myUserId={myUserId}
      showPercentage={hasDifferentEditions}
    />
  );
}
