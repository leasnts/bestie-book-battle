/**
 * Couleurs de la couverture, pour le fond de l'accueil.
 *
 * Deux temps, volontairement séparés :
 * 1. EXTRAIRE (une fois par couverture) : les 3 couleurs dominantes, brutes,
 *    stockées sur le challenge (`challenges.cover_palette`). Tout le club voit
 *    le même fond, affiché tout de suite, sans recalcul.
 * 2. ÉCLAIRCIR (à chaque affichage) : chaque couleur est diluée dans le papier
 *    juste assez pour que le texte reste lisible. Stocker les couleurs brutes
 *    permet de régler l'intensité plus tard sans toucher à la base.
 *
 * Extraction : la couverture est réduite à une vignette de 24 px de large, lue
 * pixel par pixel (jpeg-js, du JavaScript pur : pas de module natif), puis les
 * pixels proches sont regroupés. Les gris, noirs et blancs sont ignorés : une
 * couverture noire ne doit pas donner un fond noir ou gris. Si rien ne reste
 * (couverture en noir et blanc), la palette est vide et le fond se replie sur
 * les teintes noyer.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'jpeg-js';
import { colors, glassVeil } from './constants';

/** 0 à 3 couleurs `#rrggbb`, de la plus présente à la moins présente. Vide = pas de couleur. */
export type CoverPalette = string[];

/** Teintes noyer de la maquette : fond de repli sans couverture ou sans couleur */
export const FALLBACK_PALETTE: CoverPalette = ['#c48840', '#704224', '#deb880'];

// ─── Extraction ────────────────────────────────────────────────────────────────

/** Assez de pixels pour garder les titres fins et les petits motifs colorés */
const THUMB_WIDTH = 48;
const MAX_COLORS = 3;
/** Sous cette part de pixels colorés, la couverture est en noir et blanc */
const MIN_COLORFUL_SHARE = 0.05;
/** En dessous de cette part des pixels, une couleur est un détail, pas une dominante */
const MIN_SHARE = 0.015;
/** Distance RGB sous laquelle deux teintes sont considérées comme la même */
const MERGE_DISTANCE = 56;

type RGB = [number, number, number];

/** Couleurs dominantes d'une couverture (fichier local ou URL). */
export async function extractCoverPalette(uri: string): Promise<CoverPalette> {
  const thumb = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: THUMB_WIDTH } }], {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!thumb.base64) return [];

  const bytes = Uint8Array.from(atob(thumb.base64), (char) => char.charCodeAt(0));
  const { data } = decode(bytes, { useTArray: true, formatAsRGBA: true });
  return dominantColors(data);
}

/** Un pixel sans teinte fiable : trop sombre, ou trop peu saturé (gris, noir, blanc) */
function isNeutral([r, g, b]: RGB) {
  const max = Math.max(r, g, b);
  const chroma = max - Math.min(r, g, b);
  return max < 40 || chroma < 24 || chroma / max < 0.18;
}

/** Regroupe les pixels RGBA par teinte et renvoie les dominantes, en hex. */
export function dominantColors(rgba: Uint8Array): CoverPalette {
  const total = rgba.length / 4;

  // 1. Cases de 32 niveaux par canal : 512 cases au plus
  const buckets = new Map<number, { count: number; sum: RGB }>();
  let colorful = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const pixel: RGB = [rgba[i], rgba[i + 1], rgba[i + 2]];
    if (isNeutral(pixel)) continue;
    colorful += 1;
    const key = (pixel[0] >> 5) * 64 + (pixel[1] >> 5) * 8 + (pixel[2] >> 5);
    const bucket = buckets.get(key) ?? { count: 0, sum: [0, 0, 0] };
    bucket.count += 1;
    bucket.sum[0] += pixel[0];
    bucket.sum[1] += pixel[1];
    bucket.sum[2] += pixel[2];
    buckets.set(key, bucket);
  }
  if (colorful / total < MIN_COLORFUL_SHARE) return [];

  // 2. Fusion des cases voisines, des plus remplies aux moins remplies
  const clusters: { count: number; mean: RGB }[] = [];
  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  for (const { count, sum } of sorted) {
    const mean: RGB = [sum[0] / count, sum[1] / count, sum[2] / count];
    const near = clusters.find((c) => distance(c.mean, mean) < MERGE_DISTANCE);
    if (near) {
      const merged = near.count + count;
      near.mean = near.mean.map((v, i) => (v * near.count + mean[i] * count) / merged) as RGB;
      near.count = merged;
    } else {
      clusters.push({ count, mean });
    }
  }

  // Une fusion peut ramener la moyenne vers le gris : on la réécarte
  return clusters
    .filter((c) => c.count / total >= MIN_SHARE && !isNeutral(c.mean))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_COLORS)
    .map((c) => toHex(c.mean));
}

// ─── Éclaircissement ───────────────────────────────────────────────────────────

/**
 * Contraste visé pour `text-tertiary` posé dans un cadre en verre au-dessus du
 * fond. 4,5:1 exigé (WCAG AA) + une marge : là où deux taches se chevauchent, le
 * mélange peut être un peu plus sombre que chacune.
 */
const TARGET_CONTRAST = 5;
const PAPER = hexToRgb(colors.bgLight);
const CREAM = hexToRgb(colors.white);
const TERTIARY = hexToRgb(colors.textTertiary);

/**
 * Opacité d'une couleur de couverture sur le papier : `strength` au plus, moins si
 * la couleur est trop sombre pour garder le texte des cadres lisible.
 */
export function safeOpacity(hex: string, strength: number): number {
  const color = hexToRgb(hex);
  const readable = (alpha: number) => {
    const ground = mix(color, PAPER, alpha);
    const glass = mix(CREAM, ground, glassVeil);
    return contrast(TERTIARY, glass) >= TARGET_CONTRAST;
  };
  if (readable(strength)) return strength;

  // Recherche dichotomique de la plus forte opacité encore lisible
  let low = 0;
  let high = strength;
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2;
    if (readable(mid)) low = mid;
    else high = mid;
  }
  return low;
}

// ─── Outils couleur ────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(rgb: RGB) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function distance(a: RGB, b: RGB) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** `top` posé à `alpha` sur `bottom` */
function mix(top: RGB, bottom: RGB, alpha: number): RGB {
  return [0, 1, 2].map((i) => top[i] * alpha + bottom[i] * (1 - alpha)) as RGB;
}

function luminance(rgb: RGB) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: RGB, b: RGB) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
