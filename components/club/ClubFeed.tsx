/**
 * ClubFeed — « Ça bouge », le fil des actus du club (#246).
 *
 *   [note]        l'autocollant de la note, comme dans le carnet (une note =
 *                 NoteSticker partout)
 *   [verrouillée] (E) Emma · p. 268                    le texte flou est dessiné :
 *                 ░░░ 🔒 Rendez-vous p. 268 ░░░        la base ne l'envoie jamais
 *   [cap]         (50 %) Lucas est à la moitié          disque rouge de travers
 *   [fini]        (Fini) Chloé a fini le livre          disque chocolat
 *   [arrivée]     (T) Théo arrive dans le club  [👋 Coucou]
 *   [club]        [couv.] Le club a fini Les heures fragiles
 *
 * On réagit à tout avec un emoji (le tampon des notes) ; pas de message libre,
 * pas de commentaire pour l'instant (Lea, 2026-11-27 : #247, #248).
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { LockIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import type { ClubFeedItem } from '../../types/supabase';
import { colors, creamAlpha, fonts, inkAlpha, lowki, spacing } from '../../utils/constants';
import Button3D from '../Button3D';
import { resolvePhotoSource } from '../../utils/profilePhoto';
import { CoverImage } from '../ui/BookCover';
import GlassSection from '../ui/GlassSection';
import NoteCard, { NoteReactions } from '../ui/NoteCard';

const AVATAR = 36;
const DISC = 64;
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
        // (la base ne l'envoie pas : les lignes floues sont dessinées)
        if (item.kind === 'note') {
          return (
            <GlassSection key={key} paper compact>
              <View style={styles.head}>
                <Image source={resolvePhotoSource(item.profile_photo_url)} style={styles.avatar} />
                <View style={styles.text}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    p. {item.page}
                    {otherBook ? ` de ${otherBook}` : ''} · {age}
                  </Text>
                </View>
              </View>
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
            </GlassSection>
          );
        }

        // ── Un cap, ou le livre fini : un coup de tampon ──
        if (item.kind === 'cap' || item.kind === 'finished') {
          const done = item.kind === 'finished';
          return (
            <GlassSection key={key} paper compact>
              <View style={styles.row}>
                <LinearGradient
                  colors={done ? [lowki.chocolate.light, lowki.chocolate.dark] : [lowki.red.light, lowki.red.dark]}
                  style={[styles.disc, { transform: [{ rotate: done ? '6deg' : '-8deg' }] }]}
                >
                  <Text style={[styles.discText, done && styles.discTextDone]}>{done ? 'Fini' : `${item.cap} %`}</Text>
                </LinearGradient>
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
                  {(item.reactions?.length ?? 0) > 0 && reactions}
                  {/* Sous le texte : à côté, « club » partait seul à la ligne */}
                  {item.user_id !== myUserId &&
                    !(item.reactions ?? []).some((r) => r.user_id === myUserId && r.emoji === WAVE) && (
                      <View style={styles.wave}>
                        <Button3D variant="secondary" size="small" onPress={() => onToggleReaction(item, WAVE)}>
                          {`${WAVE} Coucou`}
                        </Button3D>
                      </View>
                    )}
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hidden: {
    marginTop: spacing.md,
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
    flexDirection: 'row',
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
    marginTop: spacing.sm,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discText: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: creamAlpha(1),
  },
  discTextDone: {
    color: lowki.butter.light,
  },
  cover: {
    width: 40,
    height: 60,
    borderRadius: 2,
    transform: [{ rotate: '-4deg' }],
  },
});
