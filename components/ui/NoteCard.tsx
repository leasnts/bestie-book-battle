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
import { EllipsisIcon, SmilePlusIcon, XIcon } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import { ANNOTATION_CATEGORIES, formatNotePage } from '../../utils/annotations';
import { borderRadius, colors, creamAlpha, fonts, inkAlpha, spacing } from '../../utils/constants';
import { QUICK_REACTIONS } from '../../utils/emojis';
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
  /** Moi, pour savoir quelles réactions sont les miennes */
  myUserId?: string;
  /** Ajouter ou retirer ma réaction. Sans elle, les réactions se lisent seulement. */
  onToggleReaction?: (emoji: string) => void;
  /** Ouvrir le sélecteur complet */
  onMoreReactions?: () => void;
}

export default function NoteCard({
  note,
  myTotalPages,
  isMine,
  onPress,
  myUserId,
  onToggleReaction,
  onMoreReactions,
}: NoteCardProps) {
  const category = ANNOTATION_CATEGORIES[note.category];
  const page = formatNotePage(note.position, note.edition_total_pages, myTotalPages);
  const [picking, setPicking] = useState(false);

  // Une note privée ne se lit que par son autrice : pas de réactions
  const canReact = note.visibility === 'club' && !!onToggleReaction;

  // Une pastille par emoji, avec son compte ; les plus partagées d'abord
  const reactions = useMemo(() => {
    const groups = new Map<string, { emoji: string; count: number; mine: boolean }>();
    for (const reaction of note.reactions) {
      const group = groups.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, mine: false };
      group.count += 1;
      if (reaction.user_id === myUserId) group.mine = true;
      groups.set(reaction.emoji, group);
    }
    return [...groups.values()].sort((a, b) => b.count - a.count);
  }, [note.reactions, myUserId]);

  const react = (emoji: string) => {
    setPicking(false);
    onToggleReaction?.(emoji);
  };

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

      {picking ? (
        // Les six emojis rapides remplacent la rangée, « … » ouvre le reste
        <View style={styles.footer}>
          {QUICK_REACTIONS.map((emoji) => {
            const mine = reactions.some((r) => r.emoji === emoji && r.mine);
            return (
              <PressableScale
                key={emoji}
                style={[styles.quick, mine && styles.reactionMine]}
                pressedScale={0.85}
                hitSlop={2}
                onPress={() => react(emoji)}
                accessibilityRole="button"
                accessibilityLabel={emoji}
                accessibilityState={{ selected: mine }}
              >
                <Text style={styles.quickEmoji}>{emoji}</Text>
              </PressableScale>
            );
          })}
          <PressableScale
            style={styles.quick}
            pressedScale={0.85}
            hitSlop={2}
            onPress={() => {
              setPicking(false);
              onMoreReactions?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Tous les emojis"
          >
            <EllipsisIcon size={16} color={colors.dark900} strokeWidth={2.4} />
          </PressableScale>
          <PressableScale
            style={styles.quick}
            pressedScale={0.85}
            hitSlop={2}
            onPress={() => setPicking(false)}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <XIcon size={15} color={colors.dark900} strokeWidth={2.4} />
          </PressableScale>
        </View>
      ) : (
        (note.visibility === 'private' || reactions.length > 0 || canReact) && (
          <View style={styles.footer}>
            {note.visibility === 'private' && <Text style={styles.private}>Moi seule</Text>}
            {reactions.map(({ emoji, count, mine }) =>
              canReact ? (
                <PressableScale
                  key={emoji}
                  style={[styles.reaction, mine && styles.reactionMine]}
                  pressedScale={0.9}
                  hitSlop={4}
                  onPress={() => react(emoji)}
                  accessibilityRole="button"
                  accessibilityLabel={`${emoji}, ${count}`}
                  accessibilityState={{ selected: mine }}
                  accessibilityHint={mine ? 'Retire ma réaction' : 'Ajoute ma réaction'}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{count}</Text>
                </PressableScale>
              ) : (
                <View key={emoji} style={styles.reaction}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{count}</Text>
                </View>
              ),
            )}
            {canReact && (
              <PressableScale
                style={styles.reaction}
                pressedScale={0.9}
                hitSlop={4}
                onPress={() => setPicking(true)}
                accessibilityRole="button"
                accessibilityLabel="Réagir"
              >
                <SmilePlusIcon size={14} color={colors.dark900} strokeWidth={2.2} />
              </PressableScale>
            )}
          </View>
        )
      )}
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
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  private: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: inkAlpha(0.55),
    marginRight: spacing.xs,
  },
  // 30 pt de haut : assez pour viser juste, hitSlop compris
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 36,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: creamAlpha(0.55),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  // Ma réaction : cerclée d'encre, on sait ce qu'un toucher retirera
  reactionMine: {
    borderColor: inkAlpha(0.7),
    backgroundColor: creamAlpha(0.8),
  },
  reactionEmoji: {
    fontSize: 15,
  },
  reactionCount: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  quick: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: creamAlpha(0.55),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  quickEmoji: {
    fontSize: 19,
  },
});
