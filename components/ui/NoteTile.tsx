/**
 * NoteTile — le carré du carnet sur l'accueil : la note « à la une », seule.
 *
 *    ┌┄┄┄┄┄┄┄┄┄┄┄┐
 *    ┆ Larmes    p. 142 ┆   la catégorie (toujours écrite) et la page
 *    ┆ Faria qui lui    ┆   le texte, la citation, l'emoji seul ou le vocal
 *    ┆ lègue tout…      ┆
 *    ┆ Camille   1 / 3 ◢┆   l'autrice, et où on en est dans les nouvelles
 *    └┄┄┄┄┄┄┄┄┄┄┄┘
 *
 * Pas de cadre en verre derrière : le carré EST la note (retour de Lea,
 * 2026-09-29). Le coin corné en bas à droite invite à tourner la page ; tout le
 * carré ouvre le carnet.
 *
 * Quelle note : la première des nouvelles (celles que ma dernière page vient
 * d'ouvrir), sinon la plus récente. Sans note lisible, un autocollant de papier
 * nu : un cadenas et le nombre de notes plus loin, ou rien du tout.
 */

import { LockIcon, MicIcon, NotebookPenIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import {
  ANNOTATION_CATEGORIES,
  formatNotePage,
  formatVoiceDuration,
  isEmojiOnly,
} from '../../utils/annotations';
import { colors, fonts, inkAlpha, spacing } from '../../utils/constants';
import { STICKER_BASE_LARGE } from './NoteCard';
import NoteSticker from './NoteSticker';
import PressableScale from './PressableScale';

interface NoteTileProps {
  /** La note à la une, ou `null` s'il n'y en a aucune de lisible */
  note: AnnotationWithAuthor | null;
  isMine: boolean;
  /** Le nombre de nouvelles ; la note à la une est la première */
  freshCount: number;
  /** Les notes encore plus loin que ma page */
  aheadCount: number;
  /** Le nombre de pages de MON édition */
  myTotalPages: number;
  onPress: () => void;
}

/** Les barres de l'onde du vocal, dans le carré */
const WAVE_BARS = 18;

export default function NoteTile({
  note,
  isMine,
  freshCount,
  aheadCount,
  myTotalPages,
  onPress,
}: NoteTileProps) {
  const [side, setSide] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setSide((prev) => (prev === width ? prev : width));
  };

  const label = note
    ? `Carnet de notes. Note de ${isMine ? 'moi' : note.author?.first_name ?? 'quelqu’un'}${
        freshCount > 0 ? `, 1 sur ${freshCount} nouvelles` : ''
      }`
    : aheadCount > 0
      ? `Carnet de notes, ${aheadCount} ${aheadCount > 1 ? 'notes' : 'note'} plus loin`
      : 'Carnet de notes';

  return (
    <PressableScale
      style={styles.tile}
      onLayout={onLayout}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Ouvre le carnet de notes"
    >
      {side > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <NoteSticker
            id="note-tile"
            color={note ? ANNOTATION_CATEGORIES[note.category].color : null}
            size={side}
            maxBase={STICKER_BASE_LARGE}
            corner="bottom-right"
          />
        </View>
      )}

      {note ? (
        <NoteContent note={note} isMine={isMine} freshCount={freshCount} myTotalPages={myTotalPages} />
      ) : (
        <View style={styles.blank}>
          {aheadCount > 0 ? (
            <>
              <LockIcon size={22} color={colors.textTertiary} strokeWidth={2.2} />
              <Text style={styles.blankCount}>{aheadCount}</Text>
            </>
          ) : (
            <NotebookPenIcon size={26} color={colors.textTertiary} strokeWidth={2} />
          )}
        </View>
      )}
    </PressableScale>
  );
}

function NoteContent({
  note,
  isMine,
  freshCount,
  myTotalPages,
}: {
  note: AnnotationWithAuthor;
  isMine: boolean;
  freshCount: number;
  myTotalPages: number;
}) {
  const category = ANNOTATION_CATEGORIES[note.category];
  const page = formatNotePage(note.position, note.edition_total_pages, myTotalPages);
  const author = isMine ? 'Moi' : note.author?.first_name || 'Participant';
  // Une note, c'est un emoji seul OU un texte : l'emoji d'une ancienne note passe en tête
  const text = note.body ? (note.emoji ? `${note.emoji} ${note.body}` : note.body) : null;

  return (
    <View style={styles.content}>
      <View style={styles.head}>
        <Text style={styles.category} numberOfLines={1}>
          {category.label}
        </Text>
        <Text style={styles.page}>{page}</Text>
      </View>

      <View style={styles.body}>
        {!!note.quote && (
          <Text style={styles.quote} numberOfLines={text || note.audio_path ? 2 : 5}>
            « {note.quote} »
          </Text>
        )}
        {isEmojiOnly(note) ? (
          <Text style={styles.bigEmoji}>{note.emoji}</Text>
        ) : (
          !!text && (
            <Text style={styles.text} numberOfLines={note.quote ? 2 : 4}>
              {text}
            </Text>
          )
        )}
        {!!note.audio_path && <VoiceBadge seconds={note.audio_seconds ?? 0} levels={note.audio_levels} />}
      </View>

      <View style={styles.foot}>
        <Text style={styles.author} numberOfLines={1}>
          {author}
        </Text>
        {freshCount > 0 && (
          <Text style={styles.fresh}>
            1{' '}/{' '}
            {freshCount}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Le vocal, en petit : on l'écoute dans le carnet, le carré ne fait que l'annoncer */
function VoiceBadge({ seconds, levels }: { seconds: number; levels: number[] | null }) {
  const bars = Array.from({ length: WAVE_BARS }, (_, i) => {
    const source = levels?.length ? levels[Math.floor((i / WAVE_BARS) * levels.length)] : 40;
    return Math.max(3, (source / 100) * 20);
  });
  return (
    <View style={styles.voice}>
      <View style={styles.voiceIcon}>
        <MicIcon size={13} color={colors.white} strokeWidth={2.4} />
      </View>
      <View style={styles.wave}>
        {bars.map((height, index) => (
          <View key={index} style={[styles.waveBar, { height }]} />
        ))}
      </View>
      <Text style={styles.voiceTime}>{formatVoiceDuration(seconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    aspectRatio: 1,
  },
  content: {
    flex: 1,
    paddingTop: spacing.md + 2,
    paddingHorizontal: spacing.lg - 2,
    // Le coin corné mange le bas à droite : l'autrice et le compteur restent à gauche de lui
    paddingBottom: spacing.md + 2,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  category: {
    flex: 1,
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: inkAlpha(0.6),
  },
  page: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  quote: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  bigEmoji: {
    fontSize: 52,
    lineHeight: 64,
    marginTop: spacing.xs,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: 34,
  },
  author: {
    flexShrink: 1,
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: inkAlpha(0.66),
  },
  fresh: {
    marginLeft: 'auto',
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },

  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  voiceIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark900,
  },
  wave: {
    flex: 1,
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    flex: 1,
    borderRadius: 1.5,
    backgroundColor: inkAlpha(0.55),
  },
  voiceTime: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },

  blank: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  blankCount: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
});
