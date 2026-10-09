/**
 * GlassPill — la gélule en verre à contenu (icône + nombre, ou un mot) :
 * la série de l'accueil, le compteur de marque-pages, « Cette semaine ».
 *
 * Même verre, même liseré, même ombre et même hauteur (`ROUND_BUTTON_SIZE`)
 * que `GlassButton` : c'est sa version étirée autour d'un contenu. Sans
 * `onPress`, elle se lit et ne se touche pas.
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, glassControlVeil, ROUND_BUTTON_SIZE } from '../../utils/constants';
import GlassMaterial from './GlassMaterial';
import PressableScale from './PressableScale';

interface GlassPillProps {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export default function GlassPill({ children, onPress, accessibilityLabel, accessibilityHint, style }: GlassPillProps) {
  const content = (
    <>
      <GlassMaterial radius={ROUND_BUTTON_SIZE / 2} veil={glassControlVeil} rim />
      {children}
    </>
  );
  if (!onPress) {
    return (
      <View style={[styles.pill, style]} accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }
  return (
    <PressableScale
      style={[styles.pill, style]}
      pressedScale={0.94}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  // L'ombre vit sur la gélule, sans overflow (comme GlassButton)
  pill: {
    height: ROUND_BUTTON_SIZE,
    minWidth: ROUND_BUTTON_SIZE,
    borderRadius: ROUND_BUTTON_SIZE / 2,
    paddingLeft: 12,
    paddingRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
});
