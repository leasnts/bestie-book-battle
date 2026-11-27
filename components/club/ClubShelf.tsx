/**
 * ClubShelf — « Déjà lus ensemble » : l'étagère du club (#238).
 *
 *    ▐██▌  ┏━━┓  ▛▀▀▜  ▐██▌ →      les couvertures, signet coché (lu)
 *   ░░░░░░░░░░░░░░░░░░░░░░░░░░░    la barre en verre de la bibliothèque, ses vis
 *
 * Les mêmes pièces que la bibliothèque (BookLibrary) : BookCover, le petit
 * signet « fini » (RibbonBookmark), ShelfBar ; la rangée défile de côté et
 * s'efface en fondu aux deux bords, comme les étagères d'Explorer.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { Challenge } from '../../types/supabase';
import { spacing } from '../../utils/constants';
import BookCover, { COVER_RATIO } from '../ui/BookCover';
import { SHELF_BAR_H, SHELF_OVERLAP, ShelfBar } from '../ui/BookLibrary';
import RibbonBookmark, { RIBBON_ABOVE_COVER, SMALL_RIBBON_ABOVE_COVER } from '../ui/RibbonBookmark';

const COVER_H = 110;
const COVER_W = Math.round(COVER_H * COVER_RATIO);

/** Le fond de l'onglet (colors.bgApp), en fondu aux bords de l'étagère */
const FADE = ['rgba(237,232,224,0.9)', 'rgba(237,232,224,0.55)', 'rgba(237,232,224,0.2)', 'rgba(237,232,224,0)'] as const;
const FADE_STOPS = [0, 0.35, 0.7, 1] as const;

export default function ClubShelf({ readings, side }: { readings: Challenge[]; side: number }) {
  return (
    <View style={[styles.shelf, { marginHorizontal: -side }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={[styles.row, { paddingHorizontal: side + spacing.md }]}
      >
        {readings.map((c) => (
          <View key={c.id} style={styles.slot} accessible accessibilityLabel={`${c.book_title}, lu ensemble`}>
            <BookCover coverUrl={c.cover_url} outlined />
            <View style={styles.ribbon} pointerEvents="none">
              <RibbonBookmark kind="done" small />
            </View>
          </View>
        ))}
      </ScrollView>
      <LinearGradient
        colors={FADE}
        locations={FADE_STOPS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fade, { left: 0 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={FADE}
        locations={FADE_STOPS}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={[styles.fade, { right: 0 }]}
        pointerEvents="none"
      />
      <ShelfBar style={{ left: side, right: side }} />
    </View>
  );
}

const styles = StyleSheet.create({
  shelf: {
    paddingBottom: SHELF_BAR_H - SHELF_OVERLAP,
  },
  row: {
    gap: spacing.xl,
    paddingTop: RIBBON_ABOVE_COVER,
    alignItems: 'flex-end',
  },
  slot: {
    width: COVER_W,
    height: COVER_H,
  },
  ribbon: {
    position: 'absolute',
    top: -SMALL_RIBBON_ABOVE_COVER,
    right: 4,
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: spacing['3xl'],
  },
});
