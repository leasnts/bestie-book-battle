/**
 * ClubFeed — « Ça bouge », le fil des actus du club (#246), maquette A.
 *
 *   ┌──────────────────────────────────────────┐   un seul cadre de papier,
 *   │ (C) Chloé a écrit p. 52             2 h  │   une ligne par actu,
 *   │     ┌ Quatre sœurs, quatre façons… ┐     │   cousues entre elles
 *   │     [😭 3] [🫶 1] [☺+]                    │
 *   │ · · · · · · · · · · · · · · · · · · · ·  │
 *   │ (E) Emma a écrit p. 268              4 h │   plus loin que ma page :
 *   │     ░░░ 🔒 Rendez-vous p. 268 ░░░        │   lignes floues dessinées
 *   │ · · · · · · · · · · · · · · · · · · · ·  │
 *   │ (L) Lucas est à la moitié          hier  │   caps 25/50/75 %, fini
 *   │ (T) Théo arrive dans le club       hier  │   [👋 Coucou]
 *   │ [couv] Le club a fini …           2 nov. │
 *   └──────────────────────────────────────────┘
 *
 * Une note y est une ligne avec son texte dans un encart, pas l'autocollant du
 * carnet (Lea, 2026-11-27 : « j'aime A »). On réagit à tout avec un emoji ; pas
 * de message libre ni de commentaire pour l'instant (#247, #248).
 */

import { Image } from 'expo-image';
import { LockIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import type { ClubFeedItem } from '../../types/supabase';
import { colors, creamAlpha, fonts, inkAlpha, spacing } from '../../utils/constants';
import { resolvePhotoSource } from '../../utils/profilePhoto';
import Button3D from '../Button3D';
import { CoverImage } from '../ui/BookCover';
import GlassSection from '../ui/GlassSection';
import { NoteReactions } from '../ui/NoteCard';
import { StitchLine } from '../ui/Stitch';

const AVATAR = 36;
/** Le coucou à quelqu'un qui arrive */
const WAVE = '👋';

/** « 2 h », « hier », « 3 j », « 25 oct. » : l'âge d'un post, court */
export function feedAge(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `${days} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Ce qu'un cap veut dire, en mots */
const CAP_TEXT: Record<number, string> = {
  25: 'a lu un quart',
  50: 'est à la moitié',
  75: 'est aux trois quarts',
};

interface ClubFeedProps {
  items: ClubFeedItem[];
  /** Les notes que j'ai le droit de lire, par id */
  notes: Record<string, AnnotationWithAuthor>;
  myUserId?: string;
  /** Le livre en cours du club : « a fini le livre » plutôt que son titre */
  currentChallengeId?: string | null;
  onToggleNoteReaction: (note: AnnotationWithAuthor, emoji: string) => void;
  onToggleReaction: (item: ClubFeedItem, emoji: string) => void;
}

export default function ClubFeed({
  items,
  notes,
  myUserId,
  currentChallengeId,
  onToggleNoteReaction,
  onToggleReaction,
}: ClubFeedProps) {
  // Une note ouverte que la base n'a pas renvoyée (supprimée entre-temps) : rien
  const shown = items.filter(
    (i) => !(i.kind === 'note' && !i.locked && !(i.annotation_id && notes[i.annotation_id])),
  );

  return (
    <GlassSection paper>
      {shown.map((item, index) => (
        <View key={item.event_key}>
          {index > 0 && <StitchLine style={styles.stitch} />}
          <FeedRow
            item={item}
            note={item.annotation_id ? notes[item.annotation_id] : undefined}
            myUserId={myUserId}
            currentChallengeId={currentChallengeId}
            onToggleNoteReaction={onToggleNoteReaction}
            onToggleReaction={onToggleReaction}
          />
        </View>
      ))}
    </GlassSection>
  );
}

function FeedRow({
  item,
  note,
  myUserId,
  currentChallengeId,
  onToggleNoteReaction,
  onToggleReaction,
}: {
  item: ClubFeedItem;
  note?: AnnotationWithAuthor;
} & Omit<ClubFeedProps, 'items' | 'notes'>) {
  const name = item.first_name ?? 'Quelqu’un';
  // Un autre livre que celui en cours : son titre entre guillemets (« de « Les Sœurs Blue » », jamais « de Les »)
  const otherBook = item.challenge_id !== currentChallengeId && item.book_title ? `« ${item.book_title} »` : null;
  const ofBook = otherBook ? ` de ${otherBook}` : '';

  /** La phrase de la ligne : le prénom en gras, puis ce qui s'est passé */
  let what: string;
  switch (item.kind) {
    case 'note':
      // Verrouillée : la page est sur l'étiquette « Rendez-vous », pas deux fois
      what = item.locked ? `a écrit une note${otherBook ? ` sur ${otherBook}` : ''}` : `a écrit p. ${item.page}${ofBook}`;
      break;
    case 'cap':
      what = `${CAP_TEXT[item.cap ?? 0] ?? ''}${ofBook}`;
      break;
    case 'finished':
      what = otherBook ? `a fini ${otherBook}` : 'a fini le livre';
      break;
    case 'joined':
      what = 'arrive dans le club';
      break;
    default:
      what = '';
  }

  const waved = (item.reactions ?? []).some((r) => r.user_id === myUserId && r.emoji === WAVE);
  const reactions =
    item.kind === 'note' ? (
      note ? (
        <NoteReactions
          note={note}
          myUserId={myUserId}
          onToggle={note.visibility === 'club' ? (emoji) => onToggleNoteReaction(note, emoji) : undefined}
        />
      ) : null
    ) : item.kind === 'joined' && (item.reactions?.length ?? 0) === 0 ? null : (
      <NoteReactions
        note={{ reactions: item.reactions ?? [] }}
        myUserId={myUserId}
        onToggle={(emoji) => onToggleReaction(item, emoji)}
      />
    );

  return (
    <View style={styles.row}>
      {item.kind === 'club_done' ? (
        item.cover_url ? (
          <CoverImage uri={item.cover_url} style={styles.cover} />
        ) : (
          <View style={styles.cover} />
        )
      ) : (
        <Image source={resolvePhotoSource(item.profile_photo_url)} style={styles.avatar} />
      )}

      <View style={styles.body}>
        <View style={styles.lineRow}>
          <Text style={styles.line}>
            {item.kind === 'club_done' ? (
              <>
                Le club a fini <Text style={styles.name}>{item.book_title}</Text>
              </>
            ) : (
              <>
                <Text style={styles.name}>{name}</Text> {what}
              </>
            )}
          </Text>
          <Text style={styles.age}>{feedAge(item.at)}</Text>
        </View>

        {/* Le texte d'une note, dans son encart */}
        {item.kind === 'note' && note && (note.body || note.quote || note.emoji) ? (
          <View style={styles.quote}>
            <Text style={styles.quoteText}>{note.body || note.quote || note.emoji}</Text>
          </View>
        ) : null}

        {/* Plus loin que ma page : le texte n'arrive jamais, les lignes sont dessinées */}
        {item.kind === 'note' && item.locked && (
          <View style={styles.hidden} accessible accessibilityLabel={`Note verrouillée, rendez-vous page ${item.page}`}>
            <View style={[styles.hiddenLine, { width: '92%' }]} />
            <View style={[styles.hiddenLine, { width: '64%' }]} />
            <View style={styles.hiddenOver}>
              <View style={styles.hiddenPill}>
                <LockIcon size={15} color={colors.textPrimary} strokeWidth={2.4} />
                <Text style={styles.hiddenText}>Rendez-vous p. {item.page}</Text>
              </View>
            </View>
          </View>
        )}

        {reactions}

        {item.kind === 'joined' && item.user_id !== myUserId && !waved && (
          <View style={styles.wave}>
            <Button3D variant="secondary" size="small" onPress={() => onToggleReaction(item, WAVE)}>
              {`${WAVE} Coucou`}
            </Button3D>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stitch: {
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  cover: {
    width: AVATAR,
    height: 54,
    borderRadius: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minHeight: AVATAR,
  },
  line: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
    paddingTop: 7,
  },
  name: {
    fontFamily: fonts.bodyBold,
  },
  age: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
    paddingTop: 9,
  },
  quote: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: creamAlpha(0.7),
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  quoteText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  hidden: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hiddenLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: inkAlpha(0.1),
  },
  hiddenOver: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Une étiquette de papier posée sur les lignes floues
  hiddenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: creamAlpha(0.95),
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  hiddenText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  wave: {
    alignSelf: 'flex-start',
  },
});
