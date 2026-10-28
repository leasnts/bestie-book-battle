/**
 * Les choix de l'onboarding, avec leur icône Lucide : les moments de lecture
 * et les formats (le même trio pour « en général » et pour « ce livre-là »).
 */

import {
  BedIcon,
  BookOpenIcon,
  CoffeeIcon,
  HeadphonesIcon,
  MoonIcon,
  SunIcon,
  TabletIcon,
  TramFrontIcon,
  type LucideIcon,
} from 'lucide-react-native';
import type { BookFormat, ReadingMoment } from '../../types/supabase';

export const MOMENTS: { key: ReadingMoment; label: string; icon: LucideIcon }[] = [
  { key: 'matin', label: 'Matin', icon: SunIcon },
  { key: 'trajets', label: 'Trajets', icon: TramFrontIcon },
  { key: 'pause', label: 'Pause', icon: CoffeeIcon },
  { key: 'soir', label: 'Soir', icon: MoonIcon },
  { key: 'lit', label: 'Au lit', icon: BedIcon },
];

export const FORMATS: { key: BookFormat; label: string; icon: LucideIcon }[] = [
  { key: 'papier', label: 'Papier', icon: BookOpenIcon },
  { key: 'liseuse', label: 'Liseuse', icon: TabletIcon },
  { key: 'audio', label: 'Audio', icon: HeadphonesIcon },
];

