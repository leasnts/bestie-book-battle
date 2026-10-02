/**
 * Les tris du carnet : leur nom et leur icône, pour le sheet `/carnet-sort` et
 * le badge du tri en cours. Premières pages d'abord par défaut (l'ordre du
 * livre) : c'est le seul tri qui n'a pas de badge.
 */

import { ArrowDown01Icon, ArrowDown10Icon, ClockArrowDownIcon, ClockArrowUpIcon, type LucideIcon } from 'lucide-react-native';
import type { CarnetSort } from '../stores/carnetViewStore';

export const CARNET_SORTS: { key: CarnetSort; label: string; icon: LucideIcon }[] = [
  { key: 'newest', label: 'Plus récentes', icon: ClockArrowDownIcon },
  { key: 'oldest', label: 'Plus anciennes', icon: ClockArrowUpIcon },
  { key: 'pageAsc', label: 'Premières pages', icon: ArrowDown01Icon },
  { key: 'pageDesc', label: 'Dernières pages', icon: ArrowDown10Icon },
];

export const DEFAULT_CARNET_SORT: CarnetSort = 'pageAsc';

export const carnetSort = (key: CarnetSort) => CARNET_SORTS.find((sort) => sort.key === key)!;
