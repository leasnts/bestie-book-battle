/**
 * Composant Sticker
 *
 * Un autocollant rond, qu'on colle sur une couverture, un avatar, une carte :
 *
 *      ╭───────╮
 *     │ ╭───╮ │   bord blanc découpé
 *     │ │ ✓ │ │   disque en dégradé, grain du papier
 *     │ ╰───╯ │   ombre fine d'objet collé
 *      ╰───────╯   légèrement de travers
 *
 * Dans l'esprit des pastilles rondes collées sur les livres (les prix
 * littéraires), et de la direction artistique : du papier, pas du plastique ;
 * jamais d'aplat, toujours un dégradé (DESIGN.md › Stickers).
 *
 * Contenu : une icône Lucide (`icon`) OU un mot court (`label`, 8 lettres au
 * plus, il rétrécit s'il le faut), ou n'importe quel dessin en `children`.
 *
 * Tout nouvel autocollant passe par ce composant : ne pas redessiner le bord, le
 * grain ou l'ombre ailleurs.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../utils/constants';

/** Grain du papier : la même texture que le fond de l'accueil */
const PAPER_GRAIN = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

/**
 * Les tons, chacun un dégradé vertical (clair en haut, foncé en bas) et la couleur
 * de son contenu. Neutres : la couleur d'une couverture est réservée aux écrans
 * qui parlent d'un livre précis (DESIGN.md › Direction artistique).
 */
export const STICKER_TONES = {
  /** Noyer : pour ce qui est acquis, fini, validé */
  ink: { fill: [colors.textSecondary, colors.dark950], content: colors.white, grain: 0.1 },
  /** Sable : pour attirer l'œil sans crier (nouveau, à découvrir) */
  sable: { fill: ['#efe4d6', '#d9c6b0'], content: colors.textPrimary, grain: 0.3 },
  /** Crème : le plus discret */
  cream: { fill: [colors.white, '#ede6dc'], content: colors.textPrimary, grain: 0.3 },
} as const;

export type StickerTone = keyof typeof STICKER_TONES;

/** Bord blanc découpé autour du disque : sa couleur, en léger dégradé lui aussi */
const DIE_CUT = [colors.white, '#f1ece5'] as const;

interface StickerProps {
  /** Diamètre total, bord blanc compris */
  size?: number;
  tone?: StickerTone;
  /** Icône Lucide au centre */
  icon?: LucideIcon;
  /** Mot court au centre, à la place d'une icône */
  label?: string;
  /** Inclinaison en degrés : un autocollant n'est jamais posé parfaitement droit */
  tilt?: number;
  /** Placement dans le parent */
  style?: StyleProp<ViewStyle>;
  /** Dessin libre au centre, à la place d'une icône ou d'un mot */
  children?: React.ReactNode;
}

export default function Sticker({
  size = 34,
  tone = 'ink',
  icon: Icon,
  label,
  tilt = 0,
  style,
  children,
}: StickerProps) {
  const { fill, content, grain } = STICKER_TONES[tone];
  const border = Math.max(2.5, Math.round(size * 0.08 * 2) / 2);
  const disc = size - border * 2;

  return (
    <View
      style={[
        styles.sticker,
        { width: size, height: size, borderRadius: size / 2, transform: [{ rotate: `${tilt}deg` }] },
        style,
      ]}
    >
      {/* Le papier découpé, et son grain */}
      <View style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: size / 2 }]}>
        <LinearGradient colors={DIE_CUT} style={StyleSheet.absoluteFill} />
        <PaperGrain opacity={0.3} />
      </View>

      {/* Le disque imprimé : dégradé, grain, puis le contenu PAR-DESSUS le grain */}
      <View style={[styles.disc, styles.clip, { width: disc, height: disc, borderRadius: disc / 2 }]}>
        <LinearGradient colors={fill} style={StyleSheet.absoluteFill} />
        <PaperGrain opacity={grain} />
        {children ??
          (Icon ? (
            <Icon size={Math.round(disc * 0.5)} color={content} strokeWidth={2.6} absoluteStrokeWidth />
          ) : label ? (
            <Text
              style={[styles.label, { color: content, fontSize: Math.max(8, disc * 0.23) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1}
            >
              {label}
            </Text>
          ) : null)}
      </View>
    </View>
  );
}

function PaperGrain({ opacity }: { opacity: number }) {
  return (
    <Image
      source={PAPER_GRAIN}
      style={[StyleSheet.absoluteFill, { opacity }]}
      contentFit="cover"
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  // Ombre fine et proche : un autocollant est plat, collé contre la surface
  sticker: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.3,
    shadowRadius: 2.5,
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  clip: {
    overflow: 'hidden',
  },
});
