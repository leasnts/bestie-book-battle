/**
 * Composant WatercolorStain
 *
 * Une tache d'aquarelle : une seule flaque, où jusqu'à trois couleurs se sont
 * fondues l'une dans l'autre pendant qu'elle était mouillée.
 *
 * Trois textures exactement superposables (assets/images/watercolor/, générées
 * par scripts/generate-watercolor-stains.py) : la flaque entière, puis deux
 * coulures de couleur à l'intérieur. Blanches, seule leur transparence porte le
 * dessin — bord chargé de pigment, grain du papier. L'app les teinte
 * (`tintColor`) et les superpose en mode `multiply` : les couleurs se mêlent
 * comme sur le papier.
 *
 * Essais écartés : des formes SVG (plates, à bord uniforme : des autocollants),
 * puis trois flaques séparées (leurs chevauchements faisaient diagramme de Venn).
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { hexToRgb } from '../../utils/coverPalette';

/** Les couches, dans l'ordre : la flaque (1re couleur), coulure à droite (2e), en bas à gauche (3e) */
const LAYERS = [
  { source: require('../../assets/images/watercolor/wash.png'), opacity: 0.8 },
  { source: require('../../assets/images/watercolor/bleed-1.png'), opacity: 0.7 },
  { source: require('../../assets/images/watercolor/bleed-2.png'), opacity: 0.65 },
];

/**
 * Clarté et saturation d'un pigment de lavis. Une couleur de couverture n'est
 * jamais posée telle quelle : sombre (olive, marine), elle donnait un lavis
 * couleur café. On garde sa TEINTE et on la ramène à un pastel vif, comme un
 * pigment dilué dans l'eau (mêler au blanc, lui, la rendait grise).
 */
const PIGMENT_LIGHTNESS = { min: 0.66, max: 0.82 };
const PIGMENT_MIN_SATURATION = 0.45;

/** La couleur d'une couverture, ramenée à un pigment d'aquarelle */
function pigment(hex: string): string {
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

  const l = Math.min(PIGMENT_LIGHTNESS.max, Math.max(PIGMENT_LIGHTNESS.min, lightness));
  const s = Math.max(PIGMENT_MIN_SATURATION, Math.min(1, saturation));
  return `hsl(${Math.round(hue * 60)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

interface WatercolorStainProps {
  /** 1 à 3 couleurs `#rrggbb`, une par lavis (la première est le lavis principal) */
  palette: string[];
  width: number;
  height: number;
  /** Placement dans le parent (souvent en absolu, derrière du contenu) */
  style?: StyleProp<ViewStyle>;
}

export default function WatercolorStain({ palette, width, height, style }: WatercolorStainProps) {
  if (!palette.length) return null;

  return (
    <View style={[{ width, height }, style]} pointerEvents="none">
      {/* Une couche par couleur : une palette d'une couleur donne une flaque unie */}
      {LAYERS.slice(0, palette.length).map((layer, i) => (
        <View key={i} style={[styles.layer, { opacity: layer.opacity }]}>
          <Image
            source={layer.source}
            tintColor={pigment(palette[i])}
            contentFit="fill"
            style={StyleSheet.absoluteFill}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    mixBlendMode: 'multiply',
  },
});
