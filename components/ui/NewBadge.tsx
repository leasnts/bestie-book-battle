/**
 * Composant NewBadge
 *
 * La capsule « Nouveau » posée sur le coin de la couverture du dernier livre
 * ajouté à ma bibliothèque, tant que je ne l'ai pas commencé.
 *
 *    ╭─────────╮
 *    │ Nouveau │   noyer en dégradé sur flou, liseré de verre, texte crème
 *    ╰─────────╯
 *
 * Même famille que la pastille « terminé » (encre en dégradé) et que les boutons
 * en verre (le liseré vient de `GlassRim`, partagé avec `GlassMaterial`) : rien
 * n'est redessiné ici.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, inkAlpha, shadowAlpha } from '../../utils/constants';
import GlassMaterial, { GlassRim } from './GlassMaterial';

const HEIGHT = 22;
const RADIUS = HEIGHT / 2;

export default function NewBadge() {
  return (
    <View style={styles.badge}>
      {/* Flou dessous, encre légèrement transparente dessus : un verre teinté */}
      <GlassMaterial radius={RADIUS} frosted />
      <LinearGradient
        colors={[inkAlpha(0.78), shadowAlpha(0.94)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.shape]}
      />
      <GlassRim radius={RADIUS} />
      <Text style={styles.label} maxFontSizeMultiplier={1.2}>
        Nouveau
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: HEIGHT,
    borderRadius: RADIUS,
    paddingHorizontal: 9,
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
  },
  shape: {
    borderRadius: RADIUS,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    color: colors.white,
  },
});
