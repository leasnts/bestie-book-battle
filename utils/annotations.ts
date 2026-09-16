/**
 * Le carnet : conversions page ↔ position, et les six catégories.
 *
 * Une note est écrite à une page, dans l'édition de son autrice, et stockée en
 * **position** (0 → 1). La page 230 d'un poche de 624 pages n'est pas la page
 * 230 d'un grand format de 700 : seule la part du livre se compare, et c'est
 * elle qui décide aussi du déblocage anti-spoil.
 *
 * Les mêmes règles vivent dans `scripts/add-annotations.sql` : la base filtre,
 * l'app affiche. Changer la marge ici, c'est la changer là-bas aussi.
 */

import type { AnnotationCategory } from '../types/supabase';
import { postIt } from './constants';

/**
 * Marge de déblocage : ≈ 1 % du livre, soit ≈ 6 pages sur 600.
 *
 * Elle absorbe l'écart entre deux éditions (préface, sommaire, taille du texte).
 * Mieux vaut découvrir une note un peu tard qu'un peu tôt : un spoil ne se
 * répare pas. Doit rester égale à `annotation_unlock_margin()` en base.
 */
export const UNLOCK_MARGIN = 0.01;

/** Ma page dans mon édition → ma position dans le livre, de 0 à 1 */
export function positionFromPage(page: number, editionTotalPages: number): number {
  if (!editionTotalPages) return 0;
  return clamp(page / editionTotalPages);
}

/**
 * Une position → la page correspondante dans MON édition.
 *
 * Arrondi au supérieur : on préfère envoyer une page trop loin qu'une page trop
 * tôt, pour la même raison que la marge.
 */
export function pageFromPosition(position: number, myTotalPages: number): number {
  return Math.ceil(clamp(position) * myTotalPages);
}

/**
 * Est-ce que je lis la même édition que l'autrice ?
 * Sinon la page affichée est approchée, et se dit « ≈ p. 258 ».
 */
export function isSameEdition(editionTotalPages: number, myTotalPages: number): boolean {
  return editionTotalPages === myTotalPages;
}

/** « p. 230 » dans mon édition, « ≈ p. 258 » si je lis une autre édition */
export function formatNotePage(
  position: number,
  editionTotalPages: number,
  myTotalPages: number,
): string {
  const page = pageFromPosition(position, myTotalPages);
  return isSameEdition(editionTotalPages, myTotalPages) ? `p. ${page}` : `≈ p. ${page}`;
}

/**
 * Cette note est-elle déverrouillée pour moi ?
 *
 * Sert à l'affichage seulement : c'est la base qui décide vraiment, et une note
 * verrouillée n'arrive jamais sur le téléphone (RLS).
 */
export function isUnlocked(notePosition: number, myPosition: number): boolean {
  return myPosition >= notePosition + UNLOCK_MARGIN;
}

// ─── Les six catégories ────────────────────────────────────────────

/**
 * Imposées à tout le club : un bleu doit vouloir dire la même chose pour tout
 * le monde. **Le nom s'affiche toujours** — la couleur seule exclurait les
 * personnes daltoniennes.
 *
 * Les couleurs sont les post-it de la maquette : des pastels tirés vers le
 * noyer, sur lesquels l'encre reste lisible.
 */
export interface CategoryStyle {
  /** Ce qui s'affiche, tel quel */
  label: string;
  /** Fond du post-it */
  color: string;
}

export const ANNOTATION_CATEGORIES: Record<AnnotationCategory, CategoryStyle> = {
  coup_de_coeur: { label: 'Coup de cœur', color: postIt.rose },
  spicy: { label: 'Spicy', color: postIt.peche },
  larmes: { label: 'Larmes', color: postIt.bleu },
  mdr: { label: 'Mdr', color: postIt.jaune },
  theorie: { label: 'Théorie', color: postIt.sauge },
  a_retenir: { label: 'À retenir', color: postIt.sable },
};

/** La catégorie par défaut d'une nouvelle note */
export const DEFAULT_CATEGORY: AnnotationCategory = 'a_retenir';

/** L'ordre d'affichage des catégories, celui de la maquette */
export const CATEGORY_ORDER: AnnotationCategory[] = [
  'coup_de_coeur',
  'spicy',
  'larmes',
  'mdr',
  'theorie',
  'a_retenir',
];

// ─── Vocaux ────────────────────────────────────────────────────────

/** 2 minutes : assez pour une réaction, trop court pour lire la page à voix haute */
export const MAX_VOICE_SECONDS = 120;

/** Le nombre de barres de l'onde d'un vocal, en base comme à l'écran */
export const VOICE_BARS = 40;

/**
 * Le niveau du micro, en décibels (-160 → 0), ramené de 0 à 1.
 * En dessous de -50 dB, c'est le silence d'une pièce : la barre reste au plus bas.
 */
export function levelFromMetering(decibels: number | undefined): number {
  if (decibels === undefined || !Number.isFinite(decibels)) return 0;
  return clamp((decibels + 50) / 50);
}

/**
 * Les niveaux relevés pendant l'enregistrement (un tous les 100 ms) → les
 * `VOICE_BARS` barres de l'onde, de 0 à 100.
 *
 * Chaque barre garde le pic de sa tranche : une syllabe forte ne doit pas se
 * noyer dans le silence qui l'entoure. L'onde est ensuite rapportée à son plus
 * haut point, pour qu'un vocal chuchoté ait la même allure qu'un vocal crié.
 */
export function downsampleLevels(samples: number[], bars = VOICE_BARS): number[] {
  if (samples.length === 0) return Array.from({ length: bars }, () => MIN_BAR);

  const peaks = Array.from({ length: bars }, (_, index) => {
    const start = Math.floor((index * samples.length) / bars);
    const end = Math.max(start + 1, Math.floor(((index + 1) * samples.length) / bars));
    return Math.max(...samples.slice(start, Math.min(end, samples.length)));
  });

  const loudest = Math.max(...peaks);
  return peaks.map((peak) =>
    loudest > 0 ? Math.max(MIN_BAR, Math.round((peak / loudest) * 100)) : MIN_BAR,
  );
}

/** « 0:24 », « 2:00 » */
export function formatVoiceDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Une barre ne disparaît jamais tout à fait : on voit qu'il y a un son */
const MIN_BAR = 6;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}
