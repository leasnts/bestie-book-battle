/**
 * PeelSurface — un autocollant qu'on décolle du doigt : ce qui reste collé, et
 * le dos de la partie décollée rabattu par-dessus (géométrie : `utils/peel.ts`).
 *
 * Partagé par la pile des nouvelles (`NewNotesDeck`) et le carré Carnet de
 * l'accueil (`NoteTile`) : un seul rendu du décollage dans toute l'app. Le geste
 * reste à chacun ; ici, seulement le dessin piloté par les valeurs partagées.
 */

import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { borderRadius, shadowAlpha, stickerMaterial } from '../../utils/constants';
import { peel, roundedRect, toPath, type Point } from '../../utils/peel';
import { STICKER_BASE_LARGE } from './NoteSticker';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Le coin A tiré en B, sur une note de w × h ; `peeling` à 0 = rien de décollé */
export interface PeelValues {
  w: SharedValue<number>;
  h: SharedValue<number>;
  ax: SharedValue<number>;
  ay: SharedValue<number>;
  bx: SharedValue<number>;
  by: SharedValue<number>;
  peeling: SharedValue<number>;
}

/** Plafond de l'arrondi (celui des cadres de l'accueil), sorti du worklet */
const RADIUS_MAX = borderRadius.xl;

/** L'arrondi de la note, le même que son autocollant (NoteSticker › stickerRadius) */
export function cornerRadius(w: number, h: number) {
  'worklet';
  // Pas d'appel à stickerRadius : un worklet ne peut pas l'appeler, même formule
  return Math.min(Math.min(w, h, STICKER_BASE_LARGE) * 0.26, RADIUS_MAX);
}

/** La part décollée en ce moment, 0 → 1 */
export function peelAmount(v: PeelValues) {
  'worklet';
  const r = cornerRadius(v.w.value, v.h.value);
  return peel(roundedRect(v.w.value, v.h.value, r), v.w.value, v.h.value, v.ax.value, v.ay.value, v.bx.value, v.by.value)
    .amount;
}

/** Rien de décollé : le masque couvre tout, ombres comprises */
const WHOLE = 'M-100 -100H4000V4000H-100Z';
const NOTHING = 'M0 0Z';

export default function PeelSurface({
  id,
  size,
  values,
  onLayout,
  children,
}: {
  /** Un identifiant, pour un dégradé propre à cet autocollant */
  id: string;
  /** La taille mesurée de la note (`null` avant la première mesure) */
  size: { w: number; h: number } | null;
  values: PeelValues;
  onLayout: (e: LayoutChangeEvent) => void;
  children: React.ReactNode;
}) {
  const { w, h, ax, ay, bx, by, peeling } = values;

  // Ce qui reste collé : le masque de la note
  const keptProps = useAnimatedProps(() => {
    if (!peeling.value) return { d: WHOLE };
    const r = cornerRadius(w.value, h.value);
    return { d: toPath(peel(roundedRect(w.value, h.value, r), w.value, h.value, ax.value, ay.value, bx.value, by.value).kept) };
  });
  // Le dos de la partie décollée, et son ombre portée sur la note
  const flapProps = useAnimatedProps(() => {
    if (!peeling.value) return { d: NOTHING };
    const r = cornerRadius(w.value, h.value);
    return { d: toPath(peel(roundedRect(w.value, h.value, r), w.value, h.value, ax.value, ay.value, bx.value, by.value).flap) };
  });
  const shadowProps = useAnimatedProps(() => {
    if (!peeling.value) return { d: NOTHING };
    const r = cornerRadius(w.value, h.value);
    const flap = peel(roundedRect(w.value, h.value, r), w.value, h.value, ax.value, ay.value, bx.value, by.value).flap;
    return { d: toPath(flap.map((p) => [p[0] + 2, p[1] + 5] as Point)) };
  });

  /** La marge du dessin du rabat autour de la note : il se rabat jusqu'à une note plus loin */
  const bleed = size ? Math.max(size.w, size.h) : 0;

  return (
    <>
      <MaskedView
        onLayout={onLayout}
        maskElement={
          <Svg style={StyleSheet.absoluteFill}>
            <AnimatedPath animatedProps={keptProps} fill="black" />
          </Svg>
        }
      >
        {children}
      </MaskedView>

      {/* Le dos de l'autocollant : papier nu, clair au pli, plus sombre à la pointe */}
      {size && (
        // Le rabat peut dépasser de la note : le dessin déborde d'une note de chaque côté
        <Svg
          style={{
            position: 'absolute',
            left: -bleed,
            top: -bleed,
            width: size.w + bleed * 2,
            height: size.h + bleed * 2,
          }}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={`back-${id}`} x1="0" y1="0" x2="0" y2={size.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={stickerMaterial.flap[0]} />
              <Stop offset="1" stopColor={stickerMaterial.flap[1]} />
            </LinearGradient>
          </Defs>
          <G transform={`translate(${bleed} ${bleed})`}>
            <AnimatedPath animatedProps={shadowProps} fill={shadowAlpha(0.2)} />
            <AnimatedPath animatedProps={flapProps} fill={`url(#back-${id})`} />
          </G>
        </Svg>
      )}
    </>
  );
}
