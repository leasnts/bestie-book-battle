/**
 * BookClubEmpty — l'onglet Clubs sans book club (maquette 1B, Lea 2026-11-27).
 *
 *        ┌──────────┐ ┌──────────┐
 *        │ Les Lis… │ │ Club du… │      deux book clubs pour l'exemple,
 *        └───┌ · · · · · · ┐───┘        posés de travers
 *            ·  (+)        ·            et devant, en pointillés, le sien
 *            · Ton book club·
 *            └ · · · · · · ┘
 *   Ton book club, livre après livre
 *   Vos lectures, vos notes, votre étagère
 *   [ Créer mon book club ]
 *   [ J'ai un code ]
 *
 * Pas de contenu : une invitation. Chercher des book clubs viendra plus tard (#250).
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { PlusIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { accentGradient, colors, fonts, inkAlpha, paperFrameGradient, spacing } from '../../utils/constants';
import Button3D from '../Button3D';
import PressableScale from '../ui/PressableScale';
import { StitchBorder } from '../ui/Stitch';

const CARD_W = 200;
const RADIUS = 20;

/** Deux book clubs pour l'exemple (couvertures de l'app, pas de vraies personnes) */
const SAMPLES = [
  { name: 'Les Liseuses', book: 'A Little Life · 47 %', cover: require('../../assets/images/covers/a_little_life.png'), rotate: '-9deg', left: 8, top: 24 },
  { name: 'Club du jeudi', book: 'Educated · 80 %', cover: require('../../assets/images/covers/educated.png'), rotate: '7deg', left: 128, top: 0 },
];

export default function BookClubEmpty({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <View>
      <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {SAMPLES.map((s) => (
          <View key={s.name} style={[styles.card, { left: s.left, top: s.top, transform: [{ rotate: s.rotate }] }]}>
            <LinearGradient colors={paperFrameGradient} style={StyleSheet.absoluteFill} />
            <View style={styles.banner}>
              <Image source={s.cover} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.tag}>
                <Text style={styles.tagText}>Book club</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{s.name}</Text>
              <Text style={styles.cardMeta}>{s.book}</Text>
            </View>
          </View>
        ))}
        {/* Le sien, devant, en pointillés : la place où il va naître */}
        <PressableScale style={styles.mine} pressedScale={0.97} onPress={onCreate} accessibilityRole="button" accessibilityLabel="Créer mon book club">
          <LinearGradient colors={paperFrameGradient} style={StyleSheet.absoluteFill} />
          <StitchBorder radius={RADIUS} inset={2} color={colors.accent} />
          <LinearGradient colors={accentGradient} style={styles.plus}>
            <PlusIcon size={22} color={colors.white} strokeWidth={2.4} />
          </LinearGradient>
          <Text style={styles.mineText}>Ton book club</Text>
        </PressableScale>
      </View>

      <Text style={styles.title} accessibilityRole="header">
        Ton book club, livre après livre
      </Text>
      <Text style={styles.subtitle}>Vos lectures, vos notes, votre étagère</Text>
      <View style={styles.ctas}>
        <Button3D variant="primary" onPress={onCreate}>
          Créer mon book club
        </Button3D>
        <Button3D variant="secondary" onPress={onJoin}>
          J'ai un code
        </Button3D>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 340,
    width: 340,
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  card: {
    position: 'absolute',
    width: CARD_W,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: inkAlpha(0.1),
  },
  banner: {
    height: 80,
    overflow: 'hidden',
  },
  tag: {
    position: 'absolute',
    left: 10,
    top: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255,250,242,0.92)',
  },
  tagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.textPrimary,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cardName: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.textPrimary,
  },
  cardMeta: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  mine: {
    position: 'absolute',
    left: 66,
    top: 150,
    width: CARD_W,
    height: 150,
    borderRadius: RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    transform: [{ rotate: '-2deg' }],
  },
  plus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mineText: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  ctas: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
