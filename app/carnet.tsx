/**
 * Route /carnet — le carnet en page entière, ouvert par la porte du carnet de
 * l'accueil. S'il y a des nouvelles, elles passent d'abord, seules, en pile à
 * glisser. Tout le carnet vit dans `components/Carnet.tsx`.
 */

import React from 'react';
import Carnet from '../components/Carnet';

export default function CarnetRoute() {
  return <Carnet mode="page" />;
}
