/**
 * UnitButtons — compter en pages ou en % : le rail (`Rail`), signes dans la
 * police d'accent, comme le « p. » de la règle.
 */

import React from 'react';
import Rail, { type RailOption } from './Rail';

export type Unit = 'pages' | 'percent';

const UNITS: RailOption<Unit>[] = [
  { key: 'pages', label: 'p.', a11y: 'En pages' },
  { key: 'percent', label: '%', a11y: 'En pourcentage' },
];

export default function UnitButtons({ value, onChange }: { value: Unit | null; onChange: (unit: Unit) => void }) {
  return <Rail options={UNITS} value={value} onChange={onChange} accent />;
}
