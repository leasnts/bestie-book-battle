/**
 * Route /club-code — rejoindre un club avec son code (#238).
 *
 * Depuis l'onglet Clubs. Six cases, lettres et chiffres ; la sixième remplie
 * ouvre l'aperçu du club (app/club-join/[code].tsx), à la place de ce sheet.
 */

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import CodeBoxes, { CODE_LENGTH } from '../components/ui/CodeBoxes';
import SheetPage from '../components/ui/SheetPage';

export default function ClubCodeRoute() {
  const router = useRouter();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (code.length === CODE_LENGTH) router.replace(`/club-join/${code}`);
  }, [code, router]);

  return (
    <SheetPage title="Insère le code juste ici" accent="code">
      <CodeBoxes value={code} onChange={setCode} editable letters accessibilityLabel="Code du club" />
    </SheetPage>
  );
}
