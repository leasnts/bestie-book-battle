/**
 * Les tris du carnet : leur nom et leur icône, pour le sheet `/carnet-sort` et
 * le badge du tri en cours. Par défaut, dernières pages d'abord (de ma page
 * vers la page 1) : c'est le seul tri qui n'a pas de badge, et le premier de
 * la liste.
 */

import { ArrowDown01Icon, ArrowDown10Icon, ClockArrowDownIcon, ClockArrowUpIcon, type LucideIcon } from 'lucide-react-native';
import { DEFAULT_CARNET_SORT, type CarnetSort } from '../stores/carnetViewStore';

export const CARNET_SORTS: { key: CarnetSort; label: string; icon: LucideIcon }[] = [
  { key: 'pageDesc', label: 'Dernières pages', icon: ArrowDown10Icon },
  { key: 'pageAsc', label: 'Premières pages', icon: ArrowDown01Icon },
  { key: 'newest', label: 'Plus récentes', icon: ClockArrowDownIcon },
  { key: 'oldest', label: 'Plus anciennes', icon: ClockArrowUpIcon },
];

export { DEFAULT_CARNET_SORT };

export const carnetSort = (key: CarnetSort) => CARNET_SORTS.find((sort) => sort.key === key)!;
