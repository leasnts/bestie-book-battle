/**
 * Route /notes — le carnet en sheet haut.
 *
 * Depuis la fiche du livre (`?from=book`), c'est une consultation : il s'y pose
 * et un retour y ramène. Depuis l'accueil, le carnet est une page entière
 * (/carnet). Tout le carnet vit dans `components/Carnet.tsx`.
 */

import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import Carnet from '../components/Carnet';

export default function NotesRoute() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return <Carnet mode={from === 'book' ? 'consult' : 'sheet'} />;
}
