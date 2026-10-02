/**
 * Carnet — le carnet du livre, pour ses trois entrées.
 *
 * - `page` (route /carnet, depuis la porte du carnet de l'accueil) : une page
 *   entière. S'il y a des nouvelles, elles passent d'abord, seules, en pile à
 *   glisser (`NewNotesDeck`) ; la dernière lue, la pile se dissout et le carnet
 *   monte en cascade.
 * - `sheet` (route /notes, lien profond) : le même carnet en sheet haut.
 * - `consult` (route /notes?from=book, depuis la fiche du livre) : consultation.
 *
 * Répond à « retrouver mes notes sans feuilleter, et voir celles des autres ».
 *
 * - En haut, un cadre en verre : combien de notes sont ouvertes, combien
 *   attendent plus loin, et **la piste qui sert d'ascenseur**.
 * - Des filtres courts : Tout, Moi, une personne, une catégorie.
 * - « Nouvelles · p. 157–170 » (en sheet) : les notes que ma dernière page
 *   enregistrée vient d'ouvrir (les post-it de l'accueil), avant tout le reste.
 *   En page, c'est la pile qui les montre.
 * - La liste, en sections par tranche de pages de MON édition.
 * - En bas, « Plus loin » : les notes encore verrouillées, réduites à leur
 *   autrice et à leur page. Elles ne viennent pas de la liste des notes, mais
 *   d'une requête séparée qui n'a jamais leur contenu.
 *
 * `SectionList` plutôt qu'un `.map()` : un club qui lit beaucoup peut poser
 * plusieurs centaines de notes sur un livre.
 *
 * En sheet : un sheet natif haut, comme tous les autres (en-tête commun `SheetPageHeader`,
 * 16 pt de marge) ; il n'est pas « à la hauteur du contenu » : il se parcourt
 * longtemps. La liste est l'enfant direct de l'écran.
 */

import { useRouter } from 'expo-router';
import { ChevronLeftIcon, LockIcon, StickyNoteIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DriftingBackdrop from './ui/DriftingBackdrop';
import GlassSection from './ui/GlassSection';
import NewNotesDeck from './ui/NewNotesDeck';
import NoteCard from './ui/NoteCard';
import NotesTrack, { type TrackDot } from './ui/NotesTrack';
import PressableScale from './ui/PressableScale';
import GlassButton from './ui/GlassButton';
import WriteNoteButton from './ui/WriteNoteButton';
import { SheetPageHeader } from './ui/SheetPage';
import { SHEET_TOP_INSET, useSheetScrolled } from './ui/SheetHeader';
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
import {
  accentGradient,
  borderRadius,
  colors,
  fonts,
  inkAlpha,
  motion,
  spacing,
} from '../utils/constants';

/** Un filtre : tout, moi, une personne, ou une catégorie */
type Filter =
  | { kind: 'all' }
  | { kind: 'mine' }
  | { kind: 'member'; userId: string; name: string; photo: string | null }
  | { kind: 'category'; category: AnnotationCategory };

/** Une section de la liste : une tranche de pages, ou les nouvelles (`start: null`) */
type NoteSection = {
  title: string;
  start: number | null;
  data: AnnotationWithAuthor[];
  /** Suit le filtre : un nouveau filtre remonte aussi les titres de tranche */
  key: string;
};

const DEFAULT_AVATAR = require('../assets/images/profile_picture_default.png');

export type CarnetMode = 'page' | 'sheet' | 'consult';

const easeOut = Easing.bezier(...motion.easing.easeOutQuart);

/** Une entrée de la cascade : monte et apparaît, 400 ms, ease-out-quart */
const rise = (delay: number) =>
  FadeInDown.duration(motion.duration.entrance).delay(delay).easing(easeOut);

/** Au-delà, les notes arrivent ensemble : la cascade ne fait pas attendre */
const CASCADE_MAX = 8;

/** La pile, toutes lues, se dissout : elle s'efface en grandissant un peu */
const dissolve = () => {
  'worklet';
  const timing = { duration: 500, easing: easeOut };
  return {
    initialValues: { opacity: 1, transform: [{ scale: 1 }] },
    animations: {
      opacity: withTiming(0, timing),
      transform: [{ scale: withTiming(1.04, timing) }],
    },
  };
};

export default function Carnet({ mode }: { mode: CarnetMode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  /** Page entière, depuis l'accueil : les nouvelles d'abord, en pile */
  const isPage = mode === 'page';
  /**
   * Depuis la fiche du livre, le carnet est une consultation : on voit les
   * notes et leurs réactions, sans rien y faire (ni écrire, ni réagir, ni
   * modifier, ni marquer comme lu). Écrire se fait depuis l'accueil.
   */
  const inSheet = mode === 'consult';
  /** Ouvert au-dessus d'un sheet (la fiche du livre) : un retour y ramène */
  const from = isPage ? '' : '?from=notes';
  const { user } = useAuthStore();
  const activeChallenge = useProjectStore((s) => s.activeChallenge);
  const { participants } = useProgressStore();
  const { notes, ahead, readIds, markRead, dismissRevealed, toggleReaction } =
    useAnnotationStore();

  // Les post-it de l'accueil ont mené ici : ils se rangent dans le carnet. Le
  // carnet en garde une copie tant qu'il est ouvert — lire une nouvelle ne la
  // fait pas sauter ailleurs dans la liste.
  // En page, c'est la pile qui montre les nouvelles : pas de section en plus.
  const [fresh] = useState(() => {
    const { revealedIds, revealedPages } = useAnnotationStore.getState();
    if (isPage) return { ids: new Set<string>(), pages: null };
    return { ids: new Set(revealedIds), pages: revealedPages };
  });

  /**
   * La pile : les notes du club que je n'ai pas encore lues, dans l'ordre des
   * pages. Figée à l'ouverture — une note lue ne doit pas faire bouger la pile.
   */
  const [deck] = useState(() => {
    if (!isPage) return [];
    const state = useAnnotationStore.getState();
    const me = useAuthStore.getState().user?.id;
    return state.notes
      .filter((note) => note.user_id !== me && !state.readIds.includes(note.id))
      .sort((a, b) => a.position - b.position);
  });
  const [phase, setPhase] = useState<'deck' | 'list'>(deck.length > 0 ? 'deck' : 'list');
  /** La première cascade du carnet attend que la pile se soit dissoute */
  const cascadeDelay = useRef(deck.length > 0 ? 220 : 0);
  const showCarnet = useCallback(() => setPhase('list'), []);
  // Les cartes suivent le store : une réaction posée sur la pile s'y voit
  const deckNotes = useMemo(
    () => deck.map((d) => notes.find((note) => note.id === d.id) ?? d),
    [deck, notes],
  );
  useEffect(() => {
    dismissRevealed();
  }, [dismissRevealed]);

  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  /** Le filtre en un mot : un nouveau filtre rejoue la cascade */
  const filterKey =
    filter.kind === 'member'
      ? filter.userId
      : filter.kind === 'category'
        ? filter.category
        : filter.kind;
  const { scrolled, onScroll, scrollEventThrottle } = useSheetScrolled();
  const listRef = useRef<SectionList<AnnotationWithAuthor, NoteSection>>(null);

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
    const news: AnnotationWithAuthor[] = [];
    const groups = new Map<number, AnnotationWithAuthor[]>();
    for (const note of visible) {
      // Une nouvelle n'apparaît qu'une fois : en haut, pas aussi dans sa tranche
      if (fresh.ids.has(note.id)) {
        news.push(note);
        continue;
      }
      const page = Math.ceil(note.position * myPages);
      const start = Math.floor(Math.max(0, page - 1) / slice) * slice;
      if (!groups.has(start)) groups.set(start, []);
      groups.get(start)!.push(note);
    }
    const slices: NoteSection[] = [...groups.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([start, data]) => ({
        title: `p. ${start + 1}–${Math.min(start + slice, myPages)}`,
        start,
        data,
        key: `${filterKey}-${start}`,
      }));
    if (news.length === 0) return slices;

    const title = fresh.pages ? `Nouvelles · p. ${fresh.pages.from}–${fresh.pages.to}` : 'Nouvelles';
    return [{ title, start: null, data: news, key: `${filterKey}-news` }, ...slices];
  }, [visible, myPages, slice, fresh, filterKey]);

  /** Les notes que je n'ai pas encore ouvertes : ce sont les « nouvelles » */
  const unread = useMemo(
    () => notes.filter((note) => note.user_id !== user?.id && !readIds.includes(note.id)),
    [notes, readIds, user?.id],
  );

  // Toutes les notes sur la piste ; celles hors du filtre s'effacent
  const dots: TrackDot[] = useMemo(() => {
    const shown = new Set(visible.map((note) => note.id));
    return notes.map((note) => ({
      id: note.id,
      position: note.position,
      category: note.category,
      dimmed: !shown.has(note.id),
    }));
  }, [notes, visible]);

  /** L'ordre d'arrivée de chaque note dans la cascade */
  const order = useMemo(() => {
    const map = new Map<string, number>();
    sections.forEach((section) => section.data.forEach((note) => map.set(note.id, map.size)));
    return map;
  }, [sections]);
  useEffect(() => {
    if (phase !== 'list') return;
    const timer = setTimeout(() => (cascadeDelay.current = 0), 1000);
    return () => clearTimeout(timer);
  }, [phase]);

  /** Toucher la piste : on saute à la tranche de pages correspondante */
  const seek = useCallback(
    (position: number) => {
      if (sections.length === 0) return;
      const page = position * myPages;
      // Les nouvelles ne sont pas une tranche : la piste mène aux pages
      let index = sections.findIndex(
        (section) => section.start !== null && page < section.start + slice,
      );
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

  const noteDelay = (id: string) => {
    const rank = order.get(id) ?? CASCADE_MAX;
    // Au-delà, la note arrive en défilant : elle apparaît sans cascade
    if (rank >= CASCADE_MAX) return null;
    return (cascadeDelay.current ? cascadeDelay.current + 140 : 0) + rank * motion.stagger;
  };

  // L'en-tête commun des sheets ; écrire une note : le même ✎ que sur l'accueil
  const header = (
    <SheetPageHeader
      title="Carnet de notes"
      onBack={inSheet || isPage ? () => router.back() : undefined}
      actions={
        inSheet ? undefined : (
          <WriteNoteButton />
        )
      }
      scrolled={isPage && scrolled}
    />
  );

  const list = (
    <SectionList
      ref={listRef}
      sections={sections}
      // Un nouveau filtre remonte les notes : elles rejouent la cascade
      keyExtractor={(note) => `${filterKey}-${note.id}`}
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior={isPage ? 'never' : 'automatic'}
      stickySectionHeadersEnabled={false}
      onScroll={isPage ? onScroll : undefined}
      scrollEventThrottle={scrollEventThrottle}
      ListHeaderComponent={
        <View style={styles.header}>
          {!isPage && header}

          <Animated.View entering={rise(cascadeDelay.current)}>
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
          </Animated.View>

          <Animated.View entering={rise(cascadeDelay.current + motion.stagger)}>
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
          </Animated.View>

          {!inSheet && unread.length > 0 && (
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
      renderSectionHeader={({ section }) => {
        // Le titre arrive avec la première note de sa tranche
        const delay = noteDelay(section.data[0]?.id ?? '');
        return (
          <Animated.Text
            entering={delay === null ? undefined : rise(delay)}
            style={styles.sectionTitle}
          >
            {section.title}
          </Animated.Text>
        );
      }}
      renderItem={({ item }) => {
        const delay = noteDelay(item.id);
        return (
          <Animated.View
            entering={delay === null ? undefined : rise(delay)}
            style={styles.noteWrapper}
          >
            <NoteCard
              note={item}
              myTotalPages={myPages}
              isMine={item.user_id === user?.id}
              onPress={
                inSheet
                  ? undefined
                  : item.user_id === user?.id
                    ? () => router.push(`/note/${item.id}${from}`)
                    : () => user?.id && markRead(item.id, user.id)
              }
              myUserId={user?.id}
              onToggleReaction={
                !inSheet && user?.id
                  ? (emoji) => {
                      toggleReaction(item.id, user.id, emoji);
                      // Réagir, c'est avoir lu
                      if (item.user_id !== user.id) markRead(item.id, user.id);
                    }
                  : undefined
              }
              onMoreReactions={inSheet ? undefined : () => router.push(`/reactions/${item.id}`)}
            />
          </Animated.View>
        );
      }}
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

  if (!isPage) return list;

  // Page entière : l'en-tête reste en haut, la pile puis la liste passent dessous
  return (
    <View style={[styles.screen, styles.page, { paddingTop: insets.top - SHEET_TOP_INSET + spacing.sm }]}>
      {/* Pendant la pile : un fond vivant, des taches douces qui dérivent */}
      {phase === 'deck' && (
        <Animated.View exiting={FadeOut.duration(500)} style={StyleSheet.absoluteFill}>
          <DriftingBackdrop />
        </Animated.View>
      )}

      {/*
        Le verre naît dans une vue en fondu : il reste translucide (DESIGN.md).
        Pendant la pile, seulement le retour : ni titre ni ✎, la note seule.
      */}
      {phase === 'deck' ? (
        <Animated.View
          entering={FadeIn.duration(motion.duration.standard)}
          style={[styles.pageHeader, styles.deckHeader]}
        >
          <GlassButton
            icon={ChevronLeftIcon}
            size={36}
            onPress={() => router.back()}
            accessibilityLabel="Retour"
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(motion.duration.standard)} style={styles.pageHeader}>
          {header}
        </Animated.View>
      )}

      <View style={styles.page}>
        {phase === 'list' && list}
        {phase === 'deck' && (
          <Animated.View
            exiting={dissolve}
            style={[styles.deckLayer, { paddingBottom: insets.bottom + spacing['3xl'] }]}
          >
            <NewNotesDeck
              notes={deckNotes}
              myTotalPages={myPages}
              myUserId={user?.id}
              onRead={(id) => user?.id && markRead(id, user.id)}
              onToggleReaction={(note, emoji) => user?.id && toggleReaction(note.id, user.id, emoji)}
              onMoreReactions={(id) => router.push(`/reactions/${id}`)}
              onDone={showCarnet}
            />
          </Animated.View>
        )}
      </View>
    </View>
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
      {/* Choisi : l'accent en dégradé, comme les filtres de la bibliothèque */}
      {selected && (
        <Animated.View
          entering={FadeIn.duration(motion.duration.standard)}
          exiting={FadeOut.duration(motion.duration.standard)}
          style={StyleSheet.absoluteFill}
        >
          <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
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
    backgroundColor: colors.white,
  },
  page: {
    flex: 1,
  },
  // Au-dessus de la liste : son fondu recouvre les notes qui passent dessous
  pageHeader: {
    paddingHorizontal: spacing.lg,
    zIndex: 1,
  },
  // La même hauteur que l'en-tête du carnet : le retour ne bouge pas ensuite
  deckHeader: {
    paddingTop: SHEET_TOP_INSET,
    paddingBottom: spacing.md,
    minHeight: SHEET_TOP_INSET + 36 + spacing.md,
  },
  deckLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
    // Carré arrondi, comme les filtres de la bibliothèque (FilterChips)
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  chipOn: {
    borderColor: colors.accent,
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
