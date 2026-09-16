/**
 * Route /notes — le carnet du livre.
 *
 * Répond à « retrouver mes notes sans feuilleter, et voir celles des autres ».
 *
 * - En haut, un cadre en verre : combien de notes sont ouvertes, combien
 *   attendent plus loin, et **la piste qui sert d'ascenseur**.
 * - Des filtres courts : Tout, Moi, une personne, une catégorie.
 * - La liste, en sections par tranche de pages de MON édition.
 * - En bas, « Plus loin » : les notes encore verrouillées, réduites à leur
 *   autrice et à leur page. Elles ne viennent pas de la liste des notes, mais
 *   d'une requête séparée qui n'a jamais leur contenu.
 *
 * `SectionList` plutôt qu'un `.map()` : un club qui lit beaucoup peut poser
 * plusieurs centaines de notes sur un livre.
 */

import { Stack, useRouter } from 'expo-router';
import { LockIcon, StickyNoteIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import {
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import GlassSection from '../components/ui/GlassSection';
import NoteCard from '../components/ui/NoteCard';
import NotesTrack, { type TrackDot } from '../components/ui/NotesTrack';
import PressableScale from '../components/ui/PressableScale';
import type { AnnotationWithAuthor } from '../services/supabase/annotations';
import { useAnnotationStore } from '../stores/annotationStore';
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import type { AnnotationCategory } from '../types/supabase';
import {
  ANNOTATION_CATEGORIES,
  CATEGORY_ORDER,
  positionFromPage,
} from '../utils/annotations';
import { borderRadius, colors, fonts, inkAlpha, spacing } from '../utils/constants';

/** Un filtre : tout, moi, une personne, ou une catégorie */
type Filter =
  | { kind: 'all' }
  | { kind: 'mine' }
  | { kind: 'member'; userId: string; name: string; photo: string | null }
  | { kind: 'category'; category: AnnotationCategory };

const DEFAULT_AVATAR = require('../assets/images/profile_picture_default.png');

export default function NotesRoute() {
  const router = useRouter();
  const { user } = useAuthStore();
  const activeChallenge = useProjectStore((s) => s.activeChallenge);
  const { participants } = useProgressStore();
  const { notes, ahead, readIds, markRead, dismissRevealed } = useAnnotationStore();

  // Les post-it de l'accueil ont mené ici : ils se rangent dans le carnet
  useEffect(() => {
    dismissRevealed();
  }, [dismissRevealed]);

  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const listRef = useRef<SectionList<AnnotationWithAuthor>>(null);

  const myProgress = participants.find((p) => p.user.id === user?.id);
  const myPages = myProgress?.progress.total_pages ?? activeChallenge?.total_pages ?? 0;
  const myPosition = positionFromPage(myProgress?.progress.current_page ?? 0, myPages);

  const visible = useMemo(() => {
    switch (filter.kind) {
      case 'mine':
        return notes.filter((note) => note.user_id === user?.id);
      case 'member':
        return notes.filter((note) => note.user_id === filter.userId);
      case 'category':
        return notes.filter((note) => note.category === filter.category);
      default:
        return notes;
    }
  }, [notes, filter, user?.id]);

  /**
   * Les sections : des tranches de pages de mon édition. Une dizaine de tranches
   * pour un livre, quelle que soit sa longueur — « p. 1–62 » d'un côté et
   * « p. 1–1000 » de l'autre doivent se parcourir pareil.
   */
  const slice = Math.max(10, Math.round(myPages / 10));

  const sections = useMemo(() => {
    const groups = new Map<number, AnnotationWithAuthor[]>();
    for (const note of visible) {
      const page = Math.ceil(note.position * myPages);
      const start = Math.floor(Math.max(0, page - 1) / slice) * slice;
      if (!groups.has(start)) groups.set(start, []);
      groups.get(start)!.push(note);
    }
    return [...groups.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([start, data]) => ({
        title: `p. ${start + 1}–${Math.min(start + slice, myPages)}`,
        start,
        data,
      }));
  }, [visible, myPages, slice]);

  /** Les notes que je n'ai pas encore ouvertes : ce sont les « nouvelles » */
  const unread = useMemo(
    () => notes.filter((note) => note.user_id !== user?.id && !readIds.includes(note.id)),
    [notes, readIds, user?.id],
  );

  const dots: TrackDot[] = useMemo(
    () => visible.map((note) => ({ id: note.id, position: note.position, category: note.category })),
    [visible],
  );

  /** Toucher la piste : on saute à la tranche de pages correspondante */
  const seek = useCallback(
    (position: number) => {
      if (sections.length === 0) return;
      const page = position * myPages;
      let index = sections.findIndex((section) => page < section.start + slice);
      if (index < 0) index = sections.length - 1;
      listRef.current?.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        viewOffset: 8,
        animated: true,
      });
    },
    [sections, myPages, slice],
  );

  const markAllRead = useCallback(() => {
    if (!user?.id) return;
    unread.forEach((note) => markRead(note.id, user.id));
  }, [unread, markRead, user?.id]);

  const members = useMemo(
    () =>
      participants
        .filter((p) => p.user.id !== user?.id)
        .map((p) => ({
          userId: p.user.id,
          name: p.user.first_name || 'Participant',
          photo: p.user.profile_photo_url,
        })),
    [participants, user?.id],
  );

  return (
    <SectionList
      ref={listRef}
      sections={sections}
      keyExtractor={(note) => note.id}
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.header}>
          {/* Écrire une note depuis le carnet : même bouton post-it qu'ailleurs */}
          <Stack.Screen
            options={{
              headerRight: () => (
                <PressableScale
                  style={styles.write}
                  pressedScale={0.9}
                  hitSlop={8}
                  onPress={() => router.push('/note/new')}
                  accessibilityRole="button"
                  accessibilityLabel="Noter cette page"
                >
                  <StickyNoteIcon size={18} color={colors.white} strokeWidth={2.2} />
                </PressableScale>
              ),
            }}
          />

          <GlassSection>
            <View style={styles.counts}>
              <View style={styles.count}>
                <StickyNoteIcon size={15} color={colors.textTertiary} strokeWidth={2} />
                <Text style={styles.countText}>
                  <Text style={styles.countValue}>{notes.length}</Text> ouvertes
                </Text>
              </View>
              {ahead.length > 0 && (
                <View style={styles.count}>
                  <LockIcon size={15} color={colors.textTertiary} strokeWidth={2} />
                  <Text style={styles.countText}>
                    <Text style={styles.countValue}>{ahead.length}</Text> plus loin
                  </Text>
                </View>
              )}
            </View>

            <NotesTrack
              dots={dots}
              lockedPositions={ahead.map((note) => note.book_position)}
              myPosition={myPosition}
              onSeek={seek}
            />
          </GlassSection>

          {/* Filtres */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            <Chip
              label="Tout"
              selected={filter.kind === 'all'}
              onPress={() => setFilter({ kind: 'all' })}
            />
            <Chip
              label="Moi"
              selected={filter.kind === 'mine'}
              onPress={() => setFilter({ kind: 'mine' })}
            />
            {members.map((member) => (
              <Chip
                key={member.userId}
                label={member.name}
                photo={member.photo}
                selected={filter.kind === 'member' && filter.userId === member.userId}
                onPress={() =>
                  setFilter({
                    kind: 'member',
                    userId: member.userId,
                    name: member.name,
                    photo: member.photo,
                  })
                }
              />
            ))}
            {CATEGORY_ORDER.map((key) => (
              <Chip
                key={key}
                label={ANNOTATION_CATEGORIES[key].label}
                color={ANNOTATION_CATEGORIES[key].color}
                selected={filter.kind === 'category' && filter.category === key}
                onPress={() => setFilter({ kind: 'category', category: key })}
              />
            ))}
          </ScrollView>

          {unread.length > 0 && (
            <Pressable
              onPress={markAllRead}
              style={({ pressed }) => [styles.markAll, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
            >
              <Text style={styles.markAllText}>
                {unread.length} nouvelle{unread.length > 1 ? 's' : ''} · tout marquer comme lu
              </Text>
            </Pressable>
          )}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.noteWrapper}>
          <NoteCard
            note={item}
            myTotalPages={myPages}
            isMine={item.user_id === user?.id}
            onPress={
              item.user_id === user?.id
                ? () => router.push(`/note/${item.id}`)
                : () => user?.id && markRead(item.id, user.id)
            }
          />
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {filter.kind === 'all' ? 'Aucune note ouverte pour l’instant' : 'Rien avec ce filtre'}
        </Text>
      }
      ListFooterComponent={
        ahead.length > 0 ? (
          <View style={styles.aheadBlock}>
            <Text style={styles.sectionTitle}>Plus loin · {ahead.length}</Text>
            {ahead.slice(0, 3).map((note) => (
              <View key={note.id} style={styles.aheadRow}>
                <Image
                  source={
                    note.profile_photo_url ? { uri: note.profile_photo_url } : DEFAULT_AVATAR
                  }
                  style={styles.aheadAvatar}
                />
                <Text style={styles.aheadName}>{note.first_name || 'Participant'}</Text>
                <Text style={styles.aheadPage}>≈ p. {note.my_page}</Text>
                <LockIcon size={14} color={colors.textPlaceholder} strokeWidth={2} />
              </View>
            ))}
            {ahead.length > 3 && (
              <Text style={styles.aheadMore}>+ {ahead.length - 3} autres</Text>
            )}
          </View>
        ) : null
      }
    />
  );
}

/** Un filtre : un mot, éventuellement une photo ou une pastille de couleur */
function Chip({
  label,
  photo,
  color,
  selected,
  onPress,
}: {
  label: string;
  photo?: string | null;
  color?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      style={[styles.chip, selected && styles.chipOn]}
      pressedScale={0.94}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {photo !== undefined && (
        <Image source={photo ? { uri: photo } : DEFAULT_AVATAR} style={styles.chipAvatar} />
      )}
      {color && <View style={[styles.chipDot, { backgroundColor: color }]} />}
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bgLight,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },

  header: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  counts: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
  countValue: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.textPrimary,
  },

  filters: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  chipOn: {
    backgroundColor: colors.dark900,
    borderColor: colors.dark900,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextOn: {
    color: colors.white,
  },
  chipAvatar: {
    width: 18,
    height: 18,
    borderRadius: 5,
  },
  chipDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },

  write: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark900,
  },
  markAll: {
    alignSelf: 'flex-start',
  },
  markAllText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },

  sectionTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  noteWrapper: {
    marginBottom: spacing.sm,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textTertiary,
    marginTop: spacing.xl,
    textAlign: 'center',
  },

  aheadBlock: {
    marginTop: spacing.sm,
  },
  aheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: inkAlpha(0.04),
    marginBottom: spacing.xs,
  },
  aheadAvatar: {
    width: 22,
    height: 22,
    borderRadius: 7,
    opacity: 0.55,
  },
  aheadName: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textTertiary,
  },
  aheadPage: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textPlaceholder,
    fontVariant: ['tabular-nums'],
  },
  aheadMore: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textPlaceholder,
    marginLeft: spacing.md,
    marginTop: spacing.xs,
  },
});
