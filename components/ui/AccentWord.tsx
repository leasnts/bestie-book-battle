/**
 * AccentWord — le mot d'accent d'un titre.
 *
 *    Carnet de 𝓷𝓸𝓽𝓮𝓼
 *
 * Tout le titre en Martian Grotesk, le mot qui porte l'impact (un, au plus deux :
 * « meilleur moment ») en Welcome Valentines, de la
 * couleur du titre et un peu plus grand : l'œil glisse sur la phrase et
 * s'arrête sur lui. La police suffit, pas de couleur en plus (Lea, 2026-10-05).
 * Un seul mot d'accent par écran, jamais une phrase (DESIGN.md › Typography).
 *
 * À poser DANS le <Text> du titre : il rend des morceaux de texte imbriqués.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fonts } from '../../utils/constants';
import { keepLinesTogether } from '../../utils/lineBreaks';

/** Welcome Valentines a un œil plus petit : 1,25× pour égaler le titre */
export const ACCENT_SCALE = 1.25;

interface AccentWordProps {
  /** Le titre en entier */
  text: string;
  /** Le mot du titre à mettre en avant ; absent ou introuvable, le titre reste tel quel */
  accent?: string;
  /** La taille du titre, pour que l'accent suive */
  size: number;
}

export default function AccentWord({ text: raw, accent, size }: AccentWordProps) {
  // Jamais un mot seul sur sa ligne, des coupures naturelles (utils/lineBreaks)
  const text = keepLinesTogether(raw);
  // L'accent peut faire deux mots (« meilleur moment ») : ses espaces sont peut-être devenus insécables
  const match = accent ? lastMatch(text, accent) : null;
  if (!match) return <>{text}</>;

  return (
    <>
      {text.slice(0, match.at)}
      <Text style={[styles.accent, { fontSize: size * ACCENT_SCALE }]}>{match.found}</Text>
      {text.slice(match.at + match.found.length)}
    </>
  );
}

/** La dernière occurrence de `accent` dans `text`, espaces normaux ou insécables */
function lastMatch(text: string, accent: string) {
  const pattern = accent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[ \u00A0]');
  const all = [...text.matchAll(new RegExp(pattern, 'g'))];
  const last = all[all.length - 1];
  return last?.index === undefined ? null : { at: last.index, found: last[0] };
}

/**
 * AccentUnit — le petit signe collé à un nombre, « p. », « % » ou « ≈ », et
 * le rang d'un classement (1, 2, 3…).
 *
 *    p. 169      52 %      (le signe à la main, le nombre en Martian)
 *
 * Le nombre reste en Martian, son signe passe en Welcome Valentines, un
 * chouilla plus pâle que lui : écrit à la main à côté du chiffre, sans lui
 * voler la vedette (Lea, 2026-10-08). Ne compte pas comme le mot d'accent de
 * l'écran, c'est un détail de nombre.
 * À poser DANS le <Text> du nombre. `size` = la taille que le signe avait,
 * `color` = celle du nombre auquel il est collé (absente : pas de fondu).
 */
export function AccentUnit({ children, size, color }: { children: string; size: number; color?: string }) {
  return (
    <Text style={[styles.accent, { fontSize: size * ACCENT_SCALE }, color && { color: faded(color) }]}>
      {children}
    </Text>
  );
}

/** Ce qu'il reste d'opacité au signe, par rapport à son nombre */
const UNIT_ALPHA = 0.6;

/** La même couleur, moins opaque : « #482b24 » ou « rgba(…, 0.66) » */
function faded(color: string) {
  const rgba = color.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const [r, g, b, a = '1'] = rgba[1].split(',').map((v) => v.trim());
    return `rgba(${r},${g},${b},${Number(a) * UNIT_ALPHA})`;
  }
  const hex = color.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${UNIT_ALPHA})`;
}

/** « p. », « % » et « ≈ » d'un texte tout fait (« ≈ p. 230 », « p. 12–40 ») */
const UNIT = /(\bp\.|%|≈)/;

/** Un texte avec ses signes en AccentUnit, le reste tel quel */
export function AccentUnits({ text, size, color }: { text: string; size: number; color?: string }) {
  return (
    <>
      {text.split(UNIT).map((part, i) =>
        i % 2 ? <AccentUnit key={i} size={size} color={color}>{part}</AccentUnit> : part,
      )}
    </>
  );
}

const styles = StyleSheet.create({
  accent: {
    fontFamily: fonts.accent,
  },
});
