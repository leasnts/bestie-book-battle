/**
 * Texte « plié » pour comparer sans se soucier de la façon de l'écrire :
 * accents, majuscules, apostrophes et ponctuation ne comptent plus.
 *
 *    « L'Étranger »  → « l etranger »
 *    « Letranger »   → « letranger »
 *
 * `compact` va plus loin et retire aussi les espaces, pour que « Letranger »
 * et « L'étranger » tombent sur la même clé.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Sans espaces : « l etranger » et « letranger » deviennent « letranger » */
export function compactText(text: string): string {
  return normalizeText(text).replace(/ /g, '');
}
