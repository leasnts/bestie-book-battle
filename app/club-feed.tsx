/**
 * Route /club-feed — « Ça bouge », tout le fil d'un club (#246).
 *
 * L'onglet Clubs n'en montre que les 4 dernières actus ; « Tout voir » ouvre
 * celle-ci, le fil entier. `?id=` : le club.
 */

import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import ClubFeed from '../components/club/ClubFeed';
import SheetPage from '../components/ui/SheetPage';
import { useClubFeed } from '../hooks/useClubFeed';

export default function ClubFeedRoute() {
  const { id, current } = useLocalSearchParams<{ id?: string; current?: string }>();
  const { feed, notes, ready, load, myUserId, toggleNoteReaction, toggleReaction } = useClubFeed(id ?? null);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SheetPage title="Ça bouge" fit={false}>
      {ready && (
        <ClubFeed
          items={feed}
          notes={notes}
          myUserId={myUserId}
          currentChallengeId={current ?? null}
          onToggleNoteReaction={toggleNoteReaction}
          onToggleReaction={toggleReaction}
        />
      )}
    </SheetPage>
  );
}
