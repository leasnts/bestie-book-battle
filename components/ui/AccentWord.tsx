/**
 * AccentWord — le mot d'accent d'un titre.
 *
 *    Carnet de 𝓷𝓸𝓽𝓮𝓼
 *
 * Tout le titre en Martian Grotesk, un seul mot en Welcome Valentines, de la
 * couleur du titre et un peu plus grand : l'œil glisse sur la phrase et
 * s'arrête sur lui. La police suffit, pas de couleur en plus (Lea, 2026-10-05).
 * Un seul mot d'accent par écran, jamais une phrase (DESIGN.md › Typography).
 *
 * À poser DANS le <Text> du titre : il rend des morceaux de texte imbriqués.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fonts } from '../../utils/constants';

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

export default function AccentWord({ text, accent, size }: AccentWordProps) {
  const at = accent ? text.lastIndexOf(accent) : -1;
  if (!accent || at < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <Text style={[styles.accent, { fontSize: size * ACCENT_SCALE }]}>{accent}</Text>
      {text.slice(at + accent.length)}
    </>
  );
}

/**
 * AccentUnit — le petit signe collé à un nombre, « p. » ou « % ».
 *
 *    p. 169      52 %      (le signe à la main, le nombre en Martian)
 *
 * Le nombre reste en Martian, son signe passe en Welcome Valentines, de la
 * même couleur : écrit à la main à côté du chiffre (Lea, 2026-10-08). Ne
 * compte pas comme le mot d'accent de l'écran, c'est un détail de nombre.
 * À poser DANS le <Text> du nombre. `size` = la taille que le signe avait.
 */
export function AccentUnit({ children, size }: { children: string; size: number }) {
  return <Text style={[styles.accent, { fontSize: size * ACCENT_SCALE }]}>{children}</Text>;
}

/** « p. » et « % » d'un texte tout fait (« ≈ p. 230 », « p. 12–40 ») */
const UNIT = /(\bp\.|%)/;

/** Un texte avec ses « p. » et « % » en AccentUnit, le reste tel quel */
export function AccentUnits({ text, size }: { text: string; size: number }) {
  return (
    <>
      {text.split(UNIT).map((part, i) =>
        i % 2 ? <AccentUnit key={i} size={size}>{part}</AccentUnit> : part,
      )}
    </>
  );
}

const styles = StyleSheet.create({
  accent: {
    fontFamily: fonts.accent,
  },
});
