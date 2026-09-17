/**
 * Couleurs d'aquarelle.
 *
 * Une couleur de couverture n'est jamais posée telle quelle en lavis : sombre
 * (olive, marine), elle donne une tache couleur café ; mêlée au blanc, elle
 * grisaille. On garde sa TEINTE et on la ramène à un pastel vif, comme un
 * pigment dilué dans l'eau.
 */

import { hexToRgb } from './coverPalette';

const PIGMENT_LIGHTNESS = { min: 0.66, max: 0.82 };
const PIGMENT_MIN_SATURATION = 0.45;

/** Teinte, saturation et clarté d'une couleur `#rrggbb` (teinte en degrés, le reste de 0 à 1) */
function toHsl(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const chroma = max - min;

  let hue = 0;
  if (chroma > 0) {
    if (max === r) hue = ((g - b) / chroma + 6) % 6;
    else if (max === g) hue = (b - r) / chroma + 2;
    else hue = (r - g) / chroma + 4;
  }
  const saturation = chroma === 0 ? 0 : chroma / (1 - Math.abs(2 * lightness - 1));
  return { hue: hue * 60, saturation, lightness };
}

/** Les `count` couleurs les plus vives d'une palette : ce sont elles qui portent un lavis */
export function mostVivid(palette: string[], count: number): string[] {
  return [...palette].sort((a, b) => toHsl(b).saturation - toHsl(a).saturation).slice(0, count);
}

/** La couleur d'une couverture, ramenée à un pigment d'aquarelle (`hsl(...)`) */
export function pigment(hex: string): string {
  const { hue, saturation, lightness } = toHsl(hex);
  const l = Math.min(PIGMENT_LIGHTNESS.max, Math.max(PIGMENT_LIGHTNESS.min, lightness));
  const s = Math.max(PIGMENT_MIN_SATURATION, Math.min(1, saturation));
  return `hsl(${Math.round(hue)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}
