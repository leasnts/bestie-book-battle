/**
 * ClubPalRow — « À lire ensuite » : la PAL du club, de côté (#238, maquette 4).
 *
 *   ▐██▌ ♥4   ▐██▌ ♥2   ▐██▌ ♥1   ┌ · · ┐
 *   par Emma  par Chloé par Lucas · +  ·      un cœur = je veux le lire ensuite
 *                                 └ · · ┘     (rouge s'il est à moi)
 *
 * Toucher le cœur d'un livre y met (ou retire) le mien ; « Proposer » ouvre la
 * recherche de livres. Le plus de cœurs d'abord.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { HeartIcon, PlusIcon } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ClubPalBook } from '../../services/supabase/clubPal';
import { accentGradient, colors, fonts, inkAlpha, paperFrameGradient, spacing } from '../../utils/constants';
import { CoverImage } from '../ui/BookCover';
import PressableScale from '../ui/PressableScale';
import { StitchBorder } from '../ui/Stitch';

const COVER_W = 92;
const COVER_H = 138;

interface ClubPalRowProps {
  pal: ClubPalBook[];
  myUserId?: string;
  onVote: (book: ClubPalBook) => void;
  onPropose: () => void;
  side: number;
}

export default function ClubPalRow({ pal, myUserId, onVote, onPropose, side }: ClubPalRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -side }}
      contentContainerStyle={[styles.row, { paddingHorizontal: side }]}
    >
      {pal.map((book) => {
        const mine = book.votes.some((v) => v.user_id === myUserId);
        const proposer = book.proposed_by === myUserId ? 'toi' : book.proposer?.first_name ?? '…';
        return (
          <View key={book.id} style={styles.item}>
            <View>
              {book.cover_url ? <CoverImage uri={book.cover_url} style={styles.cover} /> : <View style={styles.cover} />}
              <PressableScale
                style={styles.heart}
                pressedScale={0.85}
                hitSlop={8}
                onPress={() => onVote(book)}
                accessibilityRole="button"
                accessibilityLabel={`${book.book_title}, ${book.votes.length} cœur${book.votes.length > 1 ? 's' : ''}`}
                accessibilityState={{ selected: mine }}
                accessibilityHint={mine ? 'Retire mon cœur' : 'Je veux le lire ensuite'}
              >
                <LinearGradient colors={mine ? accentGradient : paperFrameGradient} style={StyleSheet.absoluteFill} />
                <HeartIcon size={13} color={mine ? colors.white : colors.textPrimary} fill={mine ? colors.white : 'transparent'} strokeWidth={2.4} />
                <Text style={[styles.count, mine && styles.countMine]}>{book.votes.length}</Text>
              </PressableScale>
            </View>
            <Text style={styles.by} numberOfLines={1}>
              par {proposer}
            </Text>
          </View>
        );
      })}
      <PressableScale style={styles.propose} pressedScale={0.96} onPress={onPropose} accessibilityRole="button" accessibilityLabel="Proposer un livre">
        <StitchBorder radius={6} inset={0} color={inkAlpha(0.3)} />
        <PlusIcon size={22} color={colors.textTertiary} strokeWidth={2.2} />
        <Text style={styles.proposeText}>Proposer</Text>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  item: {
    width: COVER_W,
  },
  cover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 2,
  },
  heart: {
    position: 'absolute',
    right: -6,
    bottom: -8,
    minWidth: 44,
    height: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: inkAlpha(0.1),
  },
  count: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  countMine: {
    color: colors.white,
  },
  by: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  propose: {
    width: COVER_W,
    height: COVER_H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  proposeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
});
