/**
 * ClubFeed — « Ça bouge », le fil des actus du club (#246).
 *
 *   [note]        l'autocollant de la note, comme dans le carnet (une note =
 *                 NoteSticker partout)
 *   [verrouillée] (🔒 307) Chloé a écrit une note     la page est sur l'autocollant
 *   [cap]         [50 %] Lucas est à la moitié          tampon d'encre
 *   [fini]        [Fini] Chloé a fini le livre
 *   [arrivée]     (T) Théo arrive dans le club
 *   [club]        [couv.] Le club a fini Les heures fragiles
 *
 * On réagit à tout avec un emoji (le tampon des notes) ; pas de message libre,
 * pas de commentaire pour l'instant (Lea, 2026-11-27 : #247, #248).
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import type { ClubFeedItem } from '../../types/supabase';
import { colors, fonts, spacing } from '../../utils/constants';
import { resolvePhotoSource } from '../../utils/profilePhoto';
import { CoverImage } from '../ui/BookCover';
import GlassSection from '../ui/GlassSection';
import NoteCard, { LockedNoteCard, NoteReactions } from '../ui/NoteCard';
import { InkStamp } from '../ui/Stamp';

const AVATAR = 36;
const STAMP_BOX = 72;

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
  /** Le nombre de pages de MON édition, par lecture (pour la page d'une note) */
  myPagesFor: (challengeId: string) => number;
  onToggleNoteReaction: (note: AnnotationWithAuthor, emoji: string) => void;
  onToggleReaction: (item: ClubFeedItem, emoji: string) => void;
}

export default function ClubFeed({
  items,
  notes,
  myUserId,
  currentChallengeId,
  myPagesFor,
  onToggleNoteReaction,
  onToggleReaction,
}: ClubFeedProps) {
  return (
    <View style={styles.list}>
      {items.map((item) => {
        const key = item.event_key;
        const name = item.first_name ?? 'Quelqu’un';
        const age = feedAge(item.at);

        // ── Une note ouverte : l'autocollant du carnet ──
        if (item.kind === 'note' && !item.locked) {
          const note = item.annotation_id ? notes[item.annotation_id] : undefined;
          if (!note) return null;
          return (
            <NoteCard
              key={key}
              note={note}
              myTotalPages={myPagesFor(note.challenge_id) || note.edition_total_pages}
              isMine={note.user_id === myUserId}
              myUserId={myUserId}
              onToggleReaction={note.visibility === 'club' ? (emoji) => onToggleNoteReaction(note, emoji) : undefined}
            />
          );
        }

        const reactions = (
          <NoteReactions
            note={{ reactions: item.reactions ?? [] }}
            myUserId={myUserId}
            onToggle={(emoji) => onToggleReaction(item, emoji)}
          />
        );
        const otherBook = item.challenge_id !== currentChallengeId ? item.book_title : null;

        // ── Une note plus loin que ma page : qui et où, jamais le texte ──
        if (item.kind === 'note') {
          return (
            <GlassSection key={key} paper compact>
              <View style={styles.row}>
                <LockedNoteCard name={name} photo={item.profile_photo_url} page={item.page ?? 0} />
                <View style={styles.text}>
                  <Text style={styles.line}>
                    <Text style={styles.name}>{name}</Text> a écrit une note
                    {otherBook ? ` sur ${otherBook}` : ''}
                  </Text>
                  <Text style={styles.meta}>{age}</Text>
                </View>
              </View>
            </GlassSection>
          );
        }

        // ── Un cap, ou le livre fini : un coup de tampon ──
        if (item.kind === 'cap' || item.kind === 'finished') {
          const done = item.kind === 'finished';
          return (
            <GlassSection key={key} paper compact>
              <View style={styles.row}>
                <View style={styles.stampBox}>
                  <InkStamp label={done ? 'Fini' : `${item.cap} %`} delay={0} angle={done ? 8 : -10} small />
                </View>
                <View style={styles.text}>
                  <Text style={styles.line}>
                    <Text style={styles.name}>{name}</Text>{' '}
                    {done ? (otherBook ? `a fini ${otherBook}` : 'a fini le livre') : CAP_TEXT[item.cap ?? 0]}
                    {!done && otherBook ? ` de ${otherBook}` : ''}
                  </Text>
                  <Text style={styles.meta}>{age}</Text>
                  {reactions}
                </View>
              </View>
            </GlassSection>
          );
        }

        // ── Quelqu'un arrive ──
        if (item.kind === 'joined') {
          return (
            <GlassSection key={key} paper compact>
              <View style={styles.row}>
                <Image source={resolvePhotoSource(item.profile_photo_url)} style={styles.avatar} />
                <View style={styles.text}>
                  <Text style={styles.line}>
                    <Text style={styles.name}>{name}</Text> arrive dans le club
                  </Text>
                  <Text style={styles.meta}>{age}</Text>
                  {reactions}
                </View>
              </View>
            </GlassSection>
          );
        }

        // ── Le club a fini une lecture ──
        return (
          <GlassSection key={key} paper compact>
            <View style={styles.row}>
              {item.cover_url ? <CoverImage uri={item.cover_url} style={styles.cover} /> : <View style={styles.cover} />}
              <View style={styles.text}>
                <Text style={styles.line}>
                  Le club a fini <Text style={styles.name}>{item.book_title}</Text>
                </Text>
                <Text style={styles.meta}>{age}</Text>
                {reactions}
              </View>
            </View>
          </GlassSection>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  line: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  name: {
    fontFamily: fonts.bodyBold,
  },
  meta: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  stampBox: {
    width: STAMP_BOX,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    width: 40,
    height: 60,
    borderRadius: 2,
    transform: [{ rotate: '-4deg' }],
  },
});
