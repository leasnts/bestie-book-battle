/**
 * Les choix de l'onboarding, avec leur illustration (aquarelle d'une couleur
 * Lowki, assets/images/onboarding) : les moments de lecture et les formats
 * (le même trio pour « en général » et pour « ce livre-là »).
 */

import type { BookFormat, ReadingMoment } from '../../types/supabase';

export const MOMENTS: { key: ReadingMoment; label: string; illustration: number }[] = [
  { key: 'matin', label: 'Matin', illustration: require('../../assets/images/onboarding/matin.png') },
  { key: 'trajets', label: 'Trajets', illustration: require('../../assets/images/onboarding/trajets.png') },
  { key: 'pause', label: 'Pause', illustration: require('../../assets/images/onboarding/pause.png') },
  { key: 'soir', label: 'Soir', illustration: require('../../assets/images/onboarding/soir.png') },
  { key: 'lit', label: 'Au lit', illustration: require('../../assets/images/onboarding/lit.png') },
];

export const FORMATS: { key: BookFormat; label: string; illustration: number }[] = [
  { key: 'papier', label: 'Papier', illustration: require('../../assets/images/onboarding/papier.png') },
  { key: 'liseuse', label: 'Liseuse', illustration: require('../../assets/images/onboarding/liseuse.png') },
  { key: 'audio', label: 'Audio', illustration: require('../../assets/images/onboarding/audio.png') },
];
