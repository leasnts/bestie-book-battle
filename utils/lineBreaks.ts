/**
 * Les retours à la ligne des titres (Lea, 2026-10-30) :
 * - jamais un mot seul sur sa ligne : les deux derniers mots restent ensemble ;
 * - une coupure naturelle : un petit mot (le, la, un, de, ta…) reste collé au
 *   mot qui le suit (« Insère le code / juste ici », pas « Insère le / code… ») ;
 * - un complément reste avec son nom : « une date de fin » ne se coupe pas ;
 * - « ? », « ! », « : » ne partent jamais seuls à la ligne.
 *
 * Les espaces à garder deviennent insécables (U+00A0) : iOS ne coupe pas là.
 */

const NBSP = ' ';

/** Les petits mots qui ne finissent jamais une ligne */
const GLUE = new Set([
  'le', 'la', 'les', 'l’', 'un', 'une', 'des', 'de', 'du', 'd’', 'au', 'aux', 'à', 'en', 'et', 'ou',
  'ma', 'ta', 'sa', 'mon', 'ton', 'son', 'mes', 'tes', 'ses', 'ce', 'cet', 'cette', 'on', 'tu', 'je',
  'il', 'elle', 'ne', 'se', 'te', 'me', 'pour', 'par', 'sur', 'avec', 'chez',
]);

/** Les mots qui accrochent un complément au nom d'avant */
const COMPLEMENT = new Set(['de', 'du', 'des', 'd’']);

export function keepLinesTogether(text: string): string {
  const words = text.split(' ');
  if (words.length < 2) return text;
  let out = words[0];
  for (let i = 1; i < words.length; i++) {
    const before = words[i - 1].toLowerCase();
    const word = words[i];
    const last = i === words.length - 1;
    const punctuation = /^[?!:;»]/.test(word);
    // « date de fin » : « de » reste aussi avec le nom qui le précède
    const complement = COMPLEMENT.has(word.toLowerCase());
    // Le dernier vrai mot (avant une ponctuation finale) reste avec le précédent
    const lastWord = last || (i === words.length - 2 && /^[?!:;»]+$/.test(words[words.length - 1]));
    out += (GLUE.has(before) || punctuation || complement || lastWord ? NBSP : ' ') + word;
  }
  return out;
}
