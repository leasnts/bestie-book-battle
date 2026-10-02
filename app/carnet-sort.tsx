/**
 * Route /carnet-sort — trier le carnet : par page (l'ordre du livre, par
 * tranches) ou les plus récentes d'abord.
 *
 * Sheet natif posé sur le carnet. Toucher un tri l'applique et referme le
 * sheet : un seul choix, rien à valider.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpenIcon, ClockIcon } from 'lucide-react-native';
import React from 'react';
import ChoiceRow from '../components/ui/ChoiceRow';
import SheetPage from '../components/ui/SheetPage';
import { useCarnetViewStore, type CarnetSort } from '../stores/carnetViewStore';
import { colors } from '../utils/constants';

const SORTS: { key: CarnetSort; label: string; icon: typeof BookOpenIcon }[] = [
  { key: 'page', label: 'Par page', icon: BookOpenIcon },
  { key: 'recent', label: 'Plus récentes', icon: ClockIcon },
];

export default function CarnetSortRoute() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const sort = useCarnetViewStore((s) => s.sort);
  const setSort = useCarnetViewStore((s) => s.setSort);

  return (
    <SheetPage title="Trier" onBack={from ? () => router.back() : undefined}>
      {SORTS.map(({ key, label, icon: Icon }) => (
        <ChoiceRow
          key={key}
          single
          label={label}
          leading={<Icon size={20} color={colors.textSecondary} strokeWidth={2} />}
          selected={sort === key}
          onPress={() => {
            setSort(key);
            router.back();
          }}
        />
      ))}
    </SheetPage>
  );
}
