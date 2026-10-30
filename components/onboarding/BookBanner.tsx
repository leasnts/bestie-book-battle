/**
 * BookBanner — le livre choisi, comme « Le livre » de l'accueil (BookSection) :
 * sa couverture, son titre, son auteur·ice, et une ligne en plus (l'édition).
 * « On lit quoi ? » et « Invite tes potes » montrent la même carte.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BookDraft } from '../../stores/onboardingStore';
import { colors, fonts, spacing } from '../../utils/constants';
import BookCover, { COVER_RATIO } from '../ui/BookCover';
import GlassSection from '../ui/GlassSection';

const COVER_WIDTH = 54;

export default function BookBanner({ book, line }: { book: BookDraft; line?: string }) {
  return (
    <GlassSection>
      <View style={styles.head}>
        <View style={styles.cover}>
          <BookCover coverUrl={book.cover} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
          {!!book.author && <Text style={styles.author} numberOfLines={1}>{book.author}</Text>}
          {!!line && <Text style={styles.line} numberOfLines={1}>{line}</Text>}
        </View>
      </View>
    </GlassSection>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cover: {
    width: COVER_WIDTH,
    aspectRatio: COVER_RATIO,
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 25,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textTertiary,
  },
  line: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
