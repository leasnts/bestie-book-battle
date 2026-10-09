/**
 * Route /streak — ma série, ouverte en touchant la gélule de l'accueil.
 *
 * Un coup d'œil, rien à faire : le mois, dans les cadres en verre brodés de
 * l'accueil (GlassSection).
 * - Le mois en titre, son nom en mot d'accent ; ‹ › » à droite.
 * - Deux repères : les jours lus du mois (la flamme), les marque-pages posés
 *   sur ce livre (« 1 / 3 »).
 * - Le calendrier : une série court comme un ruban rouge léger sous ses jours,
 *   le premier jour de la série en disque rouge, un jour gardé par un
 *   marque-page porte le marque-page. Aujourd'hui, pas encore lu : un disque
 *   beige léger cerclé de points rouges. Les jours à venir s'effacent.
 *
 * On glisse d'un mois à l'autre jusqu'au début du livre (ou avec ‹ ›), et »
 * ramène au mois en cours.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { AccentUnit } from '../components/ui/AccentWord';
import { BonusBookmark } from '../components/ui/BonusPill';
import GlassButton from '../components/ui/GlassButton';
import SheetPage from '../components/ui/SheetPage';
import GlassSection from '../components/ui/GlassSection';
import { STREAK_FLAME } from '../components/ui/StreakPill';
import { useMyStreak } from '../hooks/useMyStreak';
import { getReadingDays } from '../services/supabase/database';
import { useProjectStore } from '../stores/projectStore';
import { colors, fonts, lowki, spacing } from '../utils/constants';
import { dayString, STREAK_BONUS_PER_BOOK } from '../utils/streak';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ROW = 44;
// Les deux icônes des repères : la flamme a de l'air autour, le marque-page non
const STAT_ICON = 30;
const DISC = 36;
/** Pas plus d'un an en arrière */
const MAX_MONTHS = 12;
/** Le ruban d'une série : le rouge de la charte, à peine posé */
const RIBBON = [`${lowki.red.light}24`, `${lowki.red.dark}24`] as const;

/** YYYY-MM-DD d'un jour UTC */
function iso(d: Date) {
  return d.toISOString().split('T')[0];
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

/** Le 1er du mois de `day` */
function monthOf(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

function prevMonth(first: string): string {
  const d = new Date(`${first}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return iso(d);
}

function monthLabel(first: string): string {
  const label = new Date(`${first}T00:00:00Z`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Les semaines du mois, du lundi au dimanche ; null hors du mois */
function monthGrid(first: string): (string | null)[][] {
  const start = new Date(`${first}T00:00:00Z`);
  const lead = (start.getUTCDay() + 6) % 7;
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  const count = end.getUTCDate();
  const cells: (string | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
}

export default function StreakRoute() {
  const { userId, challengeId, bonusDates } = useMyStreak();
  const startedAt = useProjectStore((s) => s.activeChallenge?.started_at ?? s.activeChallenge?.created_at ?? null);
  const today = dayString(0);

  // Les mois, du début du livre à ce mois-ci
  const months = useMemo(() => {
    const current = monthOf(today);
    const first = startedAt ? monthOf(startedAt.split('T')[0]) : current;
    const list: string[] = [];
    for (let m = current; m >= first && list.length < MAX_MONTHS; m = prevMonth(m)) list.unshift(m);
    return list;
  }, [today, startedAt]);

  const [readDays, setReadDays] = useState<string[]>([]);
  useEffect(() => {
    if (!userId || !challengeId) return;
    getReadingDays(challengeId, userId, months[0])
      .then(setReadDays)
      .catch(() => {});
  }, [userId, challengeId, months]);

  // ── Défilement par mois ──
  const scrollRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(months.length - 1);
  const isCurrent = page === months.length - 1;

  const goTo = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(months.length - 1, index));
      scrollRef.current?.scrollTo({ x: target * pageWidth, animated: true });
      setPage(target);
    },
    [pageWidth, months.length],
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageWidth > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
    },
    [pageWidth],
  );

  const read = useMemo(() => new Set(readDays), [readDays]);
  // Le titre du sheet : le mois affiché, son nom en mot d'accent
  const title = monthLabel(months[page] ?? months[months.length - 1]);
  const saved = useMemo(() => new Set(bonusDates), [bonusDates]);

  return (
    <SheetPage
      title={title}
      accent={title.split(' ')[0]}
      actions={
        <View style={styles.arrows}>
          {/* Au bout (début du livre, ce mois-ci), la flèche s'efface */}
          <View style={page === 0 && styles.disabled} pointerEvents={page === 0 ? 'none' : 'auto'}>
            <GlassButton icon={ChevronLeftIcon} onPress={() => goTo(page - 1)} accessibilityLabel="Mois précédent" />
          </View>
          <View style={isCurrent && styles.disabled} pointerEvents={isCurrent ? 'none' : 'auto'}>
            <GlassButton icon={ChevronRightIcon} onPress={() => goTo(page + 1)} accessibilityLabel="Mois suivant" />
          </View>
          {/* Dans le passé : d'un toucher, retour à ce mois-ci */}
          {!isCurrent && (
            <GlassButton icon={ChevronsRightIcon} onPress={() => goTo(months.length - 1)} accessibilityLabel="Revenir à ce mois-ci" />
          )}
        </View>
      }
    >
      {/* Les mois, à glisser */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pages}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          if (width !== pageWidth) {
            setPageWidth(width);
            // Ouvre sur ce mois-ci
            requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: page * width, animated: false }));
          }
        }}
        onMomentumScrollEnd={onScrollEnd}
      >
        {months.map((m) => (
          <MonthPage key={m} first={m} width={pageWidth} today={today} read={read} saved={saved} used={bonusDates.length} />
        ))}
      </ScrollView>
    </SheetPage>
  );
}

interface MonthPageProps {
  first: string;
  width: number;
  today: string;
  read: Set<string>;
  saved: Set<string>;
  /** Marque-pages posés sur ce livre, sur STREAK_BONUS_PER_BOOK */
  used: number;
}

function MonthPage({ first, width, today, read, saved, used }: MonthPageProps) {
  const grid = useMemo(() => monthGrid(first), [first]);
  const inMonth = (d: string) => d.startsWith(first.slice(0, 7));
  const readCount = [...read].filter(inMonth).length;
  // Un jour compte dans la série s'il est lu ou gardé
  const kept = (d: string | null) => !!d && (read.has(d) || saved.has(d));

  // La marge intérieure du cadre (16 pt de chaque côté)
  const cellWidth = (width - spacing.lg * 2) / 7;

  return (
    <View style={{ width }}>
      {/* Les deux repères du mois */}
      <View style={styles.stats}>
        <GlassSection paper compact style={styles.statFrame}>
          <View
            style={styles.stat}
            accessible
            accessibilityLabel={`${readCount} jour${readCount > 1 ? 's' : ''} lu${readCount > 1 ? 's' : ''} ce mois`}
          >
            <Image source={STREAK_FLAME} style={styles.statIcon} />
            <View>
              <Text style={styles.statValue}>{readCount}</Text>
              <Text style={styles.statLabel}>{readCount > 1 ? 'jours lus' : 'jour lu'}</Text>
            </View>
          </View>
        </GlassSection>
        <GlassSection paper compact style={styles.statFrame}>
          <View
            style={styles.stat}
            accessible
            accessibilityLabel={`${used} marque-page${used > 1 ? 's' : ''} posé${used > 1 ? 's' : ''} sur ${STREAK_BONUS_PER_BOOK} pour ce livre`}
          >
            <BonusBookmark size={STAT_ICON - 4} />
            <View>
              <Text style={styles.statValue}>
                {used}
                <AccentUnit size={16} color={colors.textPrimary}>{` / ${STREAK_BONUS_PER_BOOK}`}</AccentUnit>
              </Text>
              <Text style={styles.statLabel}>marque-pages</Text>
            </View>
          </View>
        </GlassSection>
      </View>

      {/* Le calendrier */}
      <GlassSection paper style={styles.calendar}>
        <View style={styles.row}>
          {WEEKDAYS.map((letter, i) => (
            <Text key={i} style={[styles.weekday, { width: cellWidth }]}>
              {letter}
            </Text>
          ))}
        </View>

        {width > 0 &&
          grid.map((week, r) => (
            <View key={r} style={styles.row}>
              {/* Le ruban sous chaque série de jours qui se suivent dans la semaine */}
              {ribbons(week, kept).map(([from, to]) => (
                <LinearGradient
                  key={from}
                  colors={RIBBON}
                  style={[
                    styles.ribbon,
                    { left: from * cellWidth + (cellWidth - DISC) / 2, width: (to - from) * cellWidth + DISC },
                  ]}
                />
              ))}
              {week.map((day, c) =>
                day ? (
                  <DayCell
                    key={day}
                    day={day}
                    width={cellWidth}
                    isToday={day === today}
                    future={day > today}
                    read={read.has(day)}
                    bonus={saved.has(day) && !read.has(day)}
                    // Le premier jour d'une série : la veille ne compte pas
                    runStart={kept(day) && !kept(addDays(day, -1))}
                  />
                ) : (
                  <View key={`empty-${c}`} style={{ width: cellWidth }} />
                ),
              )}
            </View>
          ))}
      </GlassSection>
    </View>
  );
}

/** Les colonnes [début, fin] des jours gardés qui se suivent dans une semaine */
function ribbons(week: (string | null)[], kept: (d: string | null) => boolean): [number, number][] {
  const out: [number, number][] = [];
  let start = -1;
  week.forEach((day, i) => {
    if (kept(day)) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      out.push([start, i - 1]);
      start = -1;
    }
  });
  if (start >= 0) out.push([start, week.length - 1]);
  return out;
}

interface DayCellProps {
  day: string;
  width: number;
  isToday: boolean;
  future: boolean;
  read: boolean;
  bonus: boolean;
  runStart: boolean;
}

function DayCell({ day, width, isToday, future, read, bonus, runStart }: DayCellProps) {
  const n = Number(day.slice(8));
  const status = read ? 'lu' : bonus ? 'gardé par un marque-page' : future ? 'à venir' : isToday ? 'pas encore lu' : 'pas lu';
  return (
    <View style={[styles.cell, { width }]} accessible accessibilityLabel={`${n}${isToday ? ", aujourd'hui" : ''}, ${status}`}>
      {read && runStart && <LinearGradient colors={[lowki.red.light, lowki.red.dark]} style={styles.disc} />}
      {bonus && (
        <View style={styles.discBox}>
          <BonusBookmark size={DISC} />
        </View>
      )}
      {isToday && !read && (
        <>
          <LinearGradient colors={[lowki.beige.light, lowki.beige.dark]} style={[styles.disc, styles.todayFill]} />
          <View style={[styles.disc, styles.todayRing]} />
        </>
      )}
      <Text
        style={[
          styles.dayNumber,
          read && (runStart ? styles.dayOnDisc : styles.dayRead),
          bonus && styles.dayOnBookmark,
          isToday && !read && styles.dayToday,
          future && styles.dayFuture,
        ]}
      >
        {n}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  arrows: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  disabled: {
    opacity: 0.35,
  },
  pages: {
    alignItems: 'flex-start',
  },

  // ── Les repères du mois ──
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statFrame: {
    flex: 1,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  statIcon: {
    width: STAT_ICON,
    height: STAT_ICON,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
  },

  // ── Le calendrier ──
  calendar: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    height: ROW,
    alignItems: 'center',
  },
  weekday: {
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textTertiary,
  },
  ribbon: {
    position: 'absolute',
    top: (ROW - DISC) / 2,
    height: DISC,
    borderRadius: DISC / 2,
  },
  cell: {
    height: ROW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    position: 'absolute',
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
  },
  discBox: {
    position: 'absolute',
    width: DISC,
    height: DISC,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayFill: {
    opacity: 0.2,
  },
  todayRing: {
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: lowki.red.light,
  },
  dayNumber: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  dayRead: {
    fontFamily: fonts.bodyBold,
    color: lowki.red.light,
  },
  dayOnDisc: {
    fontFamily: fonts.bodyBold,
    color: colors.white,
  },
  dayOnBookmark: {
    fontFamily: fonts.bodyBold,
    color: lowki.chocolate.dark,
  },
  dayToday: {
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  dayFuture: {
    opacity: 0.4,
  },
});
