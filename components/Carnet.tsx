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
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ListFilterIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type CellRendererProps,
} from 'react-native';
import DriftingBackdrop from './ui/DriftingBackdrop';
import NewNotesDeck from './ui/NewNotesDeck';
import NoteCard, { LockedNoteCard } from './ui/NoteCard';
import InkFigure from './ui/InkFigure';
import NotesTrack, { type TrackDot } from './ui/NotesTrack';
import PressableScale from './ui/PressableScale';
import GlassButton from './ui/GlassButton';
import WriteNoteButton from './ui/WriteNoteButton';
import { SheetPageHeader } from './ui/SheetPage';
import { SHEET_TOP_INSET, SheetBlur, useSheetScrolled } from './ui/SheetHeader';
import type { AnnotationWithAuthor } from '../services/supabase/annotations';
import { useAnnotationStore } from '../stores/annotationStore';
import { useAuthStore } from '../stores/authStore';
import { filterNotes, useCarnetViewStore } from '../stores/carnetViewStore';
import { carnetSort } from './carnetSorts';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import {
  ANNOTATION_CATEGORIES,
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

/** Une section de la liste : les nouvelles (avec leur titre), puis toutes les autres (sans titre) */
type NoteSection = {
  title: string | null;
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

  // Trier et filtrer : choisis dans leurs sheets, partagés par le store ; le
  // carnet repart de zéro à chaque ouverture
  const sort = useCarnetViewStore((s) => s.sort);
  const people = useCarnetViewStore((s) => s.people);
  const categories = useCarnetViewStore((s) => s.categories);
  const togglePerson = useCarnetViewStore((s) => s.togglePerson);
  const toggleCategory = useCarnetViewStore((s) => s.toggleCategory);
  const resetView = useCarnetViewStore((s) => s.reset);
  useEffect(() => {
    resetView();
    return resetView;
  }, [resetView]);
  const filtered = people.length > 0 || categories.length > 0;
  /** Le tri et le filtre en un mot : un nouveau choix rejoue la cascade */
  const filterKey = `${sort}:${people.join(',')}:${categories.join(',')}`;
  const { scrolled, onScroll, scrollEventThrottle } = useSheetScrolled();
  /** Sous la barre d'état : là où commence l'en-tête de la page */
  const headerTop = insets.top - SHEET_TOP_INSET + spacing.sm;
  const listRef = useRef<SectionList<AnnotationWithAuthor, NoteSection>>(null);

  /**
   * Le fil reste en haut quand on fait défiler (page entière) : une fois le
   * compte et le fil sortis de l'écran, le fil rejoint l'en-tête, sous le titre,
   * sur le même flou ; une goutte de verre y glisse en continu jusqu'à l'endroit
   * du livre où en est la liste.
   */
  const summaryBottom = useRef(0);
  const [pastSummary, setPastSummary] = useState(false);
  /** La hauteur de l'en-tête au repos (sans le fil) : la liste commence dessous */
  const [headerHeight, setHeaderHeight] = useState(0);
  /** Où en est la liste, 0 → 1, à chaque image */
  const focus = useSharedValue(0);
  /** Le haut de chaque note dans la liste, et sa place dans le livre */
  const noteTops = useRef(new Map<string, { y: number; position: number }>());
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll(e);
      const y = e.nativeEvent.contentOffset.y;
      const past = summaryBottom.current > 0 && y > summaryBottom.current;
      setPastSummary((prev) => (prev === past ? prev : past));

      // La ligne de lecture, juste sous l'en-tête : entre deux notes, la goutte
      // est entre leurs deux pages, au prorata de ce qui a défilé
      const tops = [...noteTops.current.values()].sort((a, b) => a.y - b.y);
      if (tops.length === 0) return;
      const line = y + headerHeight + spacing['2xl'];
      let i = tops.findIndex((t) => t.y > line) - 1;
      if (i === -2) i = tops.length - 1;
      if (i < 0) {
        focus.value = tops[0].position;
        return;
      }
      const next = tops[i + 1];
      if (!next) {
        focus.value = tops[i].position;
        return;
      }
      const t = (line - tops[i].y) / Math.max(1, next.y - tops[i].y);
      focus.value = tops[i].position + (next.position - tops[i].position) * t;
    },
    [onScroll, headerHeight, focus],
  );
  /** Chaque note donne sa place dans la liste (le haut de sa cellule) */
  const NoteCell = useCallback(
    ({ item, onLayout, children, ...rest }: CellRendererProps<AnnotationWithAuthor>) => (
      <View
        {...rest}
        onLayout={(e) => {
          onLayout?.(e);
          if (item && typeof item.position === 'number') {
            noteTops.current.set(item.id, { y: e.nativeEvent.layout.y, position: item.position });
          }
        }}
      >
        {children}
      </View>
    ),
    [],
  );

  const myProgress = participants.find((p) => p.user.id === user?.id);
  const myPages = myProgress?.progress.total_pages ?? activeChallenge?.total_pages ?? 0;
  const myPosition = positionFromPage(myProgress?.progress.current_page ?? 0, myPages);

  const visible = useMemo(() => filterNotes(notes, people, categories), [notes, people, categories]);
  /**
   * Les notes plus loin, en haut de la liste quand on trie par page : en une
   * ligne, de la plus proche de ma page à la plus loin. Leur thème est
   * secret : un filtre de thème les cache, un filtre de personne les trie.
   */
  const aheadShown = useMemo(() => {
    if (sort !== 'pageDesc' || categories.length > 0) return [];
    return ahead
      .filter((note) => people.length === 0 || people.includes(note.user_id))
      .sort((x, y) => x.book_position - y.book_position);
  }, [ahead, sort, people, categories]);

  /**
   * Une seule liste, dans l'ordre du tri. Plus de tranches de pages (« p. 1–62 »)
   * ni de section « Nouvelles » (Lea, 2026-10-02) : les nouvelles se lisent dans
   * la pile en ouvrant le carnet ; la liste part de ma page et descend vers la
   * page 1 (le tri par défaut, « Dernières pages »).
   */
  const sections = useMemo((): NoteSection[] => {
    const byTime = sort === 'newest' || sort === 'oldest';
    const dir = sort === 'newest' || sort === 'pageDesc' ? -1 : 1;
    const data = [...visible].sort((a, b) =>
      byTime ? (a.created_at < b.created_at ? -dir : dir) : (a.position - b.position) * dir,
    );
    return data.length ? [{ title: null, data, key: `${filterKey}-list` }] : [];
  }, [visible, filterKey, sort]);

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

  /** Toucher la piste : on va à la note la plus proche de cet endroit du livre */
  const seek = useCallback(
    (position: number) => {
      if (sections.length === 0) return;
      // La liste, pas les nouvelles : la piste mène aux pages
      const sectionIndex = sections.length - 1;
      const data = sections[sectionIndex].data;
      let itemIndex = 0;
      data.forEach((note, i) => {
        if (Math.abs(note.position - position) < Math.abs(data[itemIndex].position - position)) itemIndex = i;
      });
      listRef.current?.scrollToLocation({ sectionIndex, itemIndex, viewOffset: 8, animated: true });
    },
    [sections],
  );

  const markAllRead = useCallback(() => {
    if (!user?.id) return;
    unread.forEach((note) => markRead(note.id, user.id));
  }, [unread, markRead, user?.id]);

  /** Qui est qui, pour les badges du filtre */
  const members = useMemo(
    () =>
      new Map(
        participants.map((p) => [
          p.user.id,
          { name: p.user.id === user?.id ? 'Moi' : p.user.first_name || 'Participant', photo: p.user.profile_photo_url },
        ]),
      ),
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
      // En page entière, le flou est porté par l'en-tête posé sur la liste (jusque sous l'heure)
      scrolled={false}
    >
      {/* Le fil, sous le titre, une fois celui du haut sorti de l'écran */}
      {isPage && pastSummary && (
        <Animated.View
          entering={FadeIn.duration(motion.duration.standard)}
          exiting={FadeOut.duration(motion.duration.instant)}
          style={styles.headerTrack}
        >
          <NotesTrack
            dots={dots}
            lockedPositions={ahead.map((note) => note.book_position)}
            myPosition={myPosition}
            onSeek={seek}
            focus={focus}
          />
        </Animated.View>
      )}
    </SheetPageHeader>
  );

  const list = (
    <SectionList
      ref={listRef}
      sections={sections}
      // Un nouveau filtre remonte les notes : elles rejouent la cascade
      keyExtractor={(note) => `${filterKey}-${note.id}`}
      style={styles.screen}
      contentContainerStyle={[styles.content, isPage && { paddingTop: headerHeight }]}
      contentInsetAdjustmentBehavior={isPage ? 'never' : 'automatic'}
      stickySectionHeadersEnabled={false}
      onScroll={isPage ? handleScroll : undefined}
      CellRendererComponent={isPage ? NoteCell : undefined}
      scrollEventThrottle={scrollEventThrottle}
      ListHeaderComponent={
        <View style={styles.header}>
          {!isPage && header}

          <Animated.View
            entering={rise(cascadeDelay.current)}
            onLayout={(e) => (summaryBottom.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
          >
            {/* Hors cadre, comme Ma page : le compte à l'encre, puis le fil du livre */}
            <View style={styles.summary}>
              <InkFigure
                value={notes.length}
                total={notes.length + ahead.length}
                fontSize={64}
                accessibilityLabel={`${notes.length} notes ouvertes sur ${notes.length + ahead.length}`}
              />
              <Text style={styles.summaryCaption} importantForAccessibility="no" accessibilityElementsHidden>
                notes ouvertes
              </Text>
              <NotesTrack
                dots={dots}
                lockedPositions={ahead.map((note) => note.book_position)}
                myPosition={myPosition}
                onSeek={seek}
              />
            </View>
          </Animated.View>

          <Animated.View entering={rise(cascadeDelay.current + motion.stagger)}>
            {/*
              Le tri en cours est écrit sur son bouton (il y en a toujours un : pas
              de badge ✕ pour lui) ; « Filtrer » compte ses filtres, et chacun
              revient dessous en badge ✕.
            */}
            <View style={styles.tools}>
              <Pill
                icon={carnetSort(sort).icon}
                label={carnetSort(sort).label}
                chevron
                stretch
                hint="Changer le tri"
                onPress={() => router.push(`/carnet-sort${from}`)}
              />
              <Pill
                icon={ListFilterIcon}
                label="Filtrer"
                count={people.length + categories.length}
                stretch
                onPress={() => router.push(`/carnet-filter${from}`)}
              />
            </View>
            {filtered && (
              <View style={styles.badges}>
                {people.map((id) => (
                  <Pill
                    key={id}
                    label={members.get(id)?.name ?? 'Participant'}
                    photo={members.get(id)?.photo ?? null}
                    removable
                    onPress={() => togglePerson(id)}
                  />
                ))}
                {categories.map((key) => (
                  <Pill
                    key={key}
                    label={ANNOTATION_CATEGORIES[key].label}
                    color={ANNOTATION_CATEGORIES[key].color}
                    removable
                    onPress={() => toggleCategory(key)}
                  />
                ))}
              </View>
            )}
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

          {/*
            En haut, les notes plus loin que ma page : de petits autocollants de
            papier nu, en une ligne, sans titre.
          */}
          {aheadShown.length > 0 && (
            <View style={styles.aheadList}>
              {/* En une ligne, la plus proche de ma page à gauche ; elle défile s'il y en a beaucoup */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                // Jamais décalée par UIKit : elle reste à sa place dans la liste
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={styles.aheadRow}
                style={styles.aheadScroll}
              >
                {aheadShown.map((note) => (
                  <LockedNoteCard
                    key={note.id}
                    name={note.first_name || 'Participant'}
                    photo={note.profile_photo_url}
                    page={note.my_page}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      }
      renderSectionHeader={({ section }) => {
        if (!section.title) return null;
        // Le titre arrive avec la première note de sa section
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
          {filtered ? 'Rien avec ce filtre' : 'Aucune note ouverte pour l’instant'}
        </Text>
      }
    />
  );

  if (!isPage) return list;

  // Page entière : l'en-tête reste en haut, la pile puis la liste passent dessous
  return (
    // La pile garde sa marge sous la barre d'état ; la liste, elle, monte jusqu'en
    // haut de l'écran et passe sous l'en-tête et sous l'heure, floutée
    <View style={[styles.screen, styles.page, phase === 'deck' && { paddingTop: headerTop }]}>
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
            onPress={() => router.back()}
            accessibilityLabel="Retour"
          />
        </Animated.View>
      ) : (
        // Posé SUR la liste : elle passe dessous, floutée, et le fil peut le
        // rejoindre sans rien décaler
        <Animated.View
          entering={FadeIn.duration(motion.duration.standard)}
          style={[styles.pageHeader, styles.pageHeaderOver, { paddingTop: headerTop }]}
          onLayout={(e) => {
            if (!pastSummary) setHeaderHeight(e.nativeEvent.layout.height);
          }}
        >
          {/* Un seul flou, de l'heure jusque sous le fil */}
          {scrolled && <SheetBlur />}
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

/**
 * Une pastille de papier : « Trier » et « Filtrer » (une icône et un mot), ou
 * un choix en cours (une photo, la couleur d'un thème…) qu'on retire d'un
 * toucher sur sa ✕.
 */
function Pill({
  label,
  icon: Icon,
  photo,
  color,
  removable = false,
  chevron = false,
  count = 0,
  hint,
  stretch = false,
  onPress,
}: {
  label: string;
  icon?: LucideIcon;
  photo?: string | null;
  color?: string;
  removable?: boolean;
  /** Ouvre un choix (le tri en cours) : un chevron après le mot */
  chevron?: boolean;
  /** Combien de choix sont actifs (les filtres) : une pastille lie de vin */
  count?: number;
  hint?: string;
  /** Les deux boutons du haut se partagent la largeur, à parts égales */
  stretch?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      style={[styles.pill, stretch && styles.pillStretch]}
      pressedScale={0.97}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={removable ? `Retirer ${label}` : count > 0 ? `${label}, ${count} actifs` : label}
      accessibilityHint={hint}
    >
      {Icon && <Icon size={16} color={colors.textPrimary} strokeWidth={2.2} />}
      {photo !== undefined && (
        <Image source={photo ? { uri: photo } : DEFAULT_AVATAR} style={styles.pillAvatar} />
      )}
      {color && <View style={[styles.pillSwatch, { backgroundColor: color }]} />}
      <Text style={styles.pillText}>{label}</Text>
      {count > 0 && (
        <View style={styles.pillCount}>
          <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
          <Text style={styles.pillCountText}>{count}</Text>
        </View>
      )}
      {chevron && <ChevronDownIcon size={15} color={colors.textTertiary} strokeWidth={2.4} />}
      {removable && <XIcon size={14} color={colors.textTertiary} strokeWidth={2.4} />}
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
  pageHeaderOver: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  // Le fil dans l'en-tête : la place de la goutte au-dessus
  headerTrack: {
    paddingTop: spacing.sm,
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
    // Plus de titre de tranche entre les boutons et la première note : l'écart le remplace
    marginBottom: spacing.lg,
  },
  summary: {
    paddingHorizontal: spacing.xs,
  },
  summaryCaption: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },

  tools: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    // Carré arrondi, comme les filtres de la bibliothèque (FilterChips)
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
  },
  pillStretch: {
    flex: 1,
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  pillAvatar: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  pillCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCountText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  pillSwatch: {
    width: 14,
    height: 14,
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

  aheadList: {
    gap: spacing.xs,
  },
  // La ligne déborde jusqu'aux bords de l'écran en défilant
  aheadScroll: {
    marginHorizontal: -spacing.lg,
  },
  aheadRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
  },
});
