/**
 * Composant BookResultRow
 *
 * Une ligne de résultat de recherche de livre : miniature, titre, auteur,
 * édition, pages. Partagée entre la recherche de l'onboarding
 * (/book-search) et l'onglet Explorer.
 *
 * `BookResultSkeleton` en est la silhouette, affichée pendant une recherche
 * (jamais de spinner dans l'app).
 */

import { Image } from 'expo-image';
import { BookOpenIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BookSearchResult } from '../../types/bookSearch';
import { borderRadius, colors, fonts, fontSize, inkAlpha, spacing } from '../../utils/constants';

/** Construit la ligne "éditeur, année" pour distinguer les éditions */
function formatEdition(publisher: string | null, publishedDate: string | null): string | null {
  const year = publishedDate?.slice(0, 4) ?? null;
  if (publisher && year) return `${publisher}, ${year}`;
  return publisher ?? year;
}

export default function BookResultRow({
  book,
  onPress,
}: {
  book: BookSearchResult;
  onPress: () => void;
}) {
  const edition = formatEdition(book.publisher, book.publishedDate);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${book.title}${book.author ? `, ${book.author}` : ''}`}
    >
      <View style={styles.cover}>
        {book.coverUrl ? (
          <Image source={{ uri: book.coverUrl }} style={styles.coverImage} contentFit="cover" transition={150} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <BookOpenIcon size={20} color={colors.textPlaceholder} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        {book.author ? (
          <Text style={styles.author} numberOfLines={1}>
            {book.author}
          </Text>
        ) : null}
        {edition ? (
          <Text style={styles.edition} numberOfLines={1}>
            {edition}
          </Text>
        ) : null}
        {book.pageCount ? <Text style={styles.pages}>{book.pageCount} p.</Text> : null}
      </View>
    </Pressable>
  );
}

/** Silhouette d'une ligne, pendant la recherche */
export function BookResultSkeleton() {
  return (
    <View style={styles.row} accessible={false}>
      <View style={[styles.cover, styles.skeleton]} />
      <View style={[styles.info, styles.skeletonLines]}>
        <View style={[styles.skeleton, styles.skeletonTitle]} />
        <View style={[styles.skeleton, styles.skeletonAuthor]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.lg,
  },
  rowPressed: {
    opacity: 0.7,
  },
  cover: {
    width: 50,
    height: 70,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  edition: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.textPlaceholder,
    fontStyle: 'italic',
  },
  pages: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  skeleton: {
    backgroundColor: inkAlpha(0.07),
    borderRadius: borderRadius.xs,
  },
  skeletonLines: {
    gap: spacing.sm,
  },
  skeletonTitle: {
    width: '70%',
    height: 14,
  },
  skeletonAuthor: {
    width: '40%',
    height: 12,
  },
});
