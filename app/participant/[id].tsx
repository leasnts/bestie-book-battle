/**
 * Route /participant/[id] — le journal de lecture d'une personne.
 *
 * Ouverte en touchant une ligne du classement complet, ou « Ma page › » sur
 * l'accueil (avec mon propre identifiant). Un sheet natif posé sur le sheet du
 * classement : iOS sait empiler deux `formSheet`, et on évite les deux `Modal`
 * superposées de l'ancienne version, qui imposaient un délai de 280 ms.
 *
 * Les données viennent des stores, sauf l'historique, chargé ici à l'ouverture.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import ParticipantTimeline from '../../components/ui/ParticipantTimeline';
import { getUserHistory } from '../../services/supabase/database';
import { useAuthStore } from '../../stores/authStore';
import { useProgressStore } from '../../stores/progressStore';
import { useProjectStore } from '../../stores/projectStore';
import type { ProgressHistory } from '../../types/supabase';

export default function ParticipantRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { participants } = useProgressStore();
  const activeChallenge = useProjectStore((s) => s.activeChallenge);

  const [history, setHistory] = useState<ProgressHistory[]>([]);

  const isMe = id === user?.id;
  const participant = participants.find((p) => p.user.id === id);

  useEffect(() => {
    if (!activeChallenge?.id || !id) return;
    getUserHistory(activeChallenge.id, id)
      .then(setHistory)
      .catch((error) => console.warn('[Journal] historique indisponible', error));
  }, [activeChallenge?.id, id]);

  return (
    <ParticipantTimeline
      ownerName={isMe ? undefined : participant?.user.first_name || undefined}
      history={history}
      // Posé sur un autre sheet (fiche du livre, classement) : un retour
      onBack={from ? () => router.back() : undefined}
    />
  );
}
