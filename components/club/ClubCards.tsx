/**
 * ClubCards — « Mes clubs » en haut de l'onglet Clubs (#246, maquettes E/F).
 *
 *   ┌─────────────────────┐ ┌ · · · · · · · ·
 *   │░░ bannière photo ░░░│ ·  ( )  ▬▬▬▬     ·   la place vide : un club en
 *   │ Test club           │ ·       ▬▬       ·   pointillés, cousu, et de quoi
 *   │ Les Sœurs Blue · 54%│ · [Rejoindre][Créer]   en rejoindre ou en créer un
 *   └─────────────────────┘ └ · · · · · · · ·
 *
 * Les cartes défilent de côté ; la carte choisie est cerclée de rouge et son
 * club s'affiche dessous. Toujours une place vide au bout : même avec un seul
 * club, on voit qu'un autre peut venir s'y ranger (Lea, 2026-11-27 : la
 * découverte de clubs viendra plus tard, #250).
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Challenge, Club } from '../../types/supabase';
import { colors, fonts, inkAlpha, paperFrameGradient, spacing } from '../../utils/constants';
import Button3D from '../Button3D';
import ClubAvatar from '../ui/ClubAvatar';
import PressableScale from '../ui/PressableScale';
import { StitchBorder } from '../ui/Stitch';

export const CARD_W = 292;
const BANNER = 84;
const AVATAR = 52;
const RADIUS = 24;

interface ClubCardsProps {
  clubs: Club[];
  selectedId: string | null;
  /** La lecture en cours de chaque club, si on la connaît */
  readingOf: (clubId: string) => Challenge | null;
  onSelect: (clubId: string) => void;
  onJoin: () => void;
  onCreate: () => void;
  side: number;
}

export default function ClubCards({ clubs, selectedId, readingOf, onSelect, onJoin, onCreate, side }: ClubCardsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={CARD_W + spacing.md}
      snapToAlignment="start"
      style={{ marginHorizontal: -side }}
      contentContainerStyle={[styles.row, { paddingHorizontal: side }]}
    >
      {clubs.map((club) => {
        const on = club.id === selectedId;
        const reading = readingOf(club.id);
        return (
          <PressableScale
            key={club.id}
            style={[styles.card, on && styles.cardOn]}
            pressedScale={0.97}
            onPress={() => onSelect(club.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${club.name}${reading ? `, ${reading.book_title}` : ''}`}
          >
            <View style={styles.frame}>
              <LinearGradient colors={paperFrameGradient} style={StyleSheet.absoluteFill} />
              <View style={styles.banner}>
                {club.photo_url ? (
                  <Image source={{ uri: club.photo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <ClubAvatar club={club} size={CARD_W} style={styles.bannerWash} />
                )}
                <LinearGradient colors={['rgba(46,27,22,0.05)', 'rgba(46,27,22,0.4)']} style={StyleSheet.absoluteFill} />
              </View>
              <View style={styles.body}>
                <View style={styles.text}>
                  <Text style={styles.name} numberOfLines={1}>
                    {club.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {reading
                      ? `${reading.book_title} · ${Math.round(reading.average_progress_percentage ?? 0)} %`
                      : 'Pas de lecture en cours'}
                  </Text>
                </View>
              </View>
            </View>
          </PressableScale>
        );
      })}

      {/* ── La place vide : un club pourra se ranger ici ── */}
      <View style={[styles.card, styles.slot]}>
        <StitchBorder radius={RADIUS} inset={0} color={inkAlpha(0.28)} />
        <View style={styles.ghostTop}>
          <View style={styles.ghostAvatar} />
          <View style={styles.ghostLines}>
            <View style={[styles.ghostLine, { width: '70%' }]} />
            <View style={[styles.ghostLine, { width: '45%' }]} />
          </View>
        </View>
        <View style={styles.slotCtas}>
          <View style={styles.slotCta}>
            <Button3D variant="secondary" size="small" onPress={onJoin}>
              Rejoindre
            </Button3D>
          </View>
          <View style={styles.slotCta}>
            <Button3D variant="secondary" size="small" onPress={onCreate}>
              Créer
            </Button3D>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingVertical: 4,
  },
  card: {
    width: CARD_W,
    borderRadius: RADIUS,
  },
  // La carte choisie : un filet rouge autour
  cardOn: {
    borderWidth: 2,
    borderColor: colors.accent,
    margin: -2,
    width: CARD_W + 4,
  },
  frame: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  banner: {
    height: BANNER,
    overflow: 'hidden',
  },
  bannerWash: {
    borderRadius: 0,
    position: 'absolute',
    top: -CARD_W / 2,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  slot: {
    padding: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  ghostTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ghostAvatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: inkAlpha(0.08),
  },
  ghostLines: {
    flex: 1,
    gap: spacing.sm,
  },
  ghostLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: inkAlpha(0.08),
  },
  slotCtas: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  slotCta: {
    flex: 1,
  },
});
