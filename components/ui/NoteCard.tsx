/**
 * NoteCard — une note du carnet, en post-it.
 *
 * `[avatar] [prénom] [catégorie] … [p. 153]`
 * `[emoji] [texte]`
 * `[réactions]`
 *
 * La couleur vient de la catégorie, mais **son nom est toujours écrit** : la
 * couleur seule exclurait les personnes daltoniennes, et un club a le droit de
 * savoir ce que veut dire un post-it bleu.
 *
 * La page affichée est celle de MON édition (« ≈ p. 153 » si l'autrice lit une
 * autre édition) : c'est la page où je retrouverai le passage.
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import { ANNOTATION_CATEGORIES, formatNotePage } from '../../utils/annotations';
import { borderRadius, colors, creamAlpha, fonts, inkAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';
import VoicePlayer from './VoicePlayer';

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');

const resolveAvatar = (url: string | null | undefined) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

interface NoteCardProps {
  note: AnnotationWithAuthor;
  /** Le nombre de pages de MON édition, pour afficher la page qui me parle */
  myTotalPages: number;
  /** Ma note : elle s'ouvre pour être modifiée */
  isMine: boolean;
  onPress?: () => void;
}

export default function NoteCard({ note, myTotalPages, isMine, onPress }: NoteCardProps) {
  const category = ANNOTATION_CATEGORIES[note.category];
  const page = formatNotePage(note.position, note.edition_total_pages, myTotalPages);

  // Une réaction par emoji, avec son compte
  const reactions = note.reactions.reduce<Record<string, number>>((counts, reaction) => {
    counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
    return counts;
  }, {});

  const content = (
    <View style={[styles.note, { backgroundColor: category.color }]}>
      <View style={styles.head}>
        <Image source={resolveAvatar(note.author?.profile_photo_url)} style={styles.avatar} />
        <Text style={styles.name} numberOfLines={1}>
          {isMine ? 'Moi' : note.author?.first_name || 'Participant'}
        </Text>
        <Text style={styles.category}>{category.label}</Text>
        <Text style={styles.page}>{page}</Text>
      </View>

      {!!note.quote && <Text style={styles.quote}>{note.quote}</Text>}

      <View style={styles.body}>
        {!!note.emoji && <Text style={styles.emoji}>{note.emoji}</Text>}
        {!!note.body && (
          <Text style={styles.text} numberOfLines={6}>
            {note.body}
          </Text>
        )}
      </View>

      {!!note.audio_path && (
        <VoicePlayer
          path={note.audio_path}
          seconds={note.audio_seconds ?? 0}
          levels={note.audio_levels}
        />
      )}

      <View style={styles.footer}>
        {note.visibility === 'private' && <Text style={styles.private}>Moi seule</Text>}
        {Object.entries(reactions).map(([emoji, count]) => (
          <View key={emoji} style={styles.reaction}>
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <Text style={styles.reactionCount}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <PressableScale
      pressedScale={0.99}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Note de ${isMine ? 'moi' : note.author?.first_name}, ${category.label}, ${page}`}
      accessibilityHint={isMine ? 'Ouvre ma note pour la modifier' : undefined}
    >
      {content}
    </PressableScale>
  );
}

const AVATAR = 22;

const styles = StyleSheet.create({
  note: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: creamAlpha(0.6),
  },
  name: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  category: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: inkAlpha(0.55),
  },
  page: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: inkAlpha(0.66),
    fontVariant: ['tabular-nums'],
  },

  quote: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: inkAlpha(0.35),
  },

  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 20,
  },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  private: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: inkAlpha(0.55),
    marginRight: spacing.xs,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: creamAlpha(0.55),
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    color: colors.textPrimary,
  },
});
