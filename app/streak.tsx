/**
 * Route /streak — ma série, ouverte en touchant la gélule de l'accueil.
 *
 * Un coup d'œil, rien à faire : le nombre de jours, puis une semaine (lundi →
 * dimanche) :
 * - lu : un disque rouge et une coche ;
 * - gardé par un marque-page : le marque-page ;
 * - rien : un disque beige ;
 * - aujourd'hui, pas encore lu : un cercle en points rouges, à remplir ;
 * - les jours à venir : un cercle en points beiges.
 *
 * On glisse d'une semaine à l'autre jusqu'au début du livre (ou avec ‹ ›), et
 * » ramène à la semaine en cours. Les marque-pages qu'il me
 * reste sont en haut à droite, la même gélule que la série.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import BonusPill, { BonusBookmark } from '../components/ui/BonusPill';
import GlassButton from '../components/ui/GlassButton';
import SheetPage from '../components/ui/SheetPage';
import StreakHero from '../components/ui/StreakHero';
import { useMyStreak } from '../hooks/useMyStreak';
import { getReadingDays } from '../services/supabase/database';
import { useProjectStore } from '../stores/projectStore';
import { colors, fonts, lowki, spacing } from '../utils/constants';
import { dayString } from '../utils/streak';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const CELL = 36;
/** Pas plus d'un semestre en arrière */
const MAX_WEEKS = 26;

/** Le lundi de la semaine de `day` (YYYY-MM-DD, UTC) */
function mondayOf(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().split('T')[0];
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

function shortDate(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function StreakRoute() {
  const { userId, challengeId, state, days, bonusDates, bonusesLeft } = useMyStreak();
  const startedAt = useProjectStore((s) => s.activeChallenge?.started_at ?? s.activeChallenge?.created_at ?? null);
  const today = dayString(0);

  // Les lundis, du début du livre à cette semaine
  const weeks = useMemo(() => {
    const current = mondayOf(today);
    const first = startedAt ? mondayOf(startedAt.split('T')[0]) : current;
    const list: string[] = [];
    for (let w = current; w >= first && list.length < MAX_WEEKS; w = addDays(w, -7)) list.unshift(w);
    return list;
  }, [today, startedAt]);

  const [readDays, setReadDays] = useState<string[]>([]);
  useEffect(() => {
    if (!userId || !challengeId) return;
    getReadingDays(challengeId, userId, weeks[0])
      .then(setReadDays)
      .catch(() => {});
  }, [userId, challengeId, weeks]);

  // ── Défilement par semaine ──
  const scrollRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(weeks.length - 1);
  const isCurrent = page === weeks.length - 1;

  const goTo = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(weeks.length - 1, index));
      scrollRef.current?.scrollTo({ x: target * pageWidth, animated: true });
      setPage(target);
    },
    [pageWidth, weeks.length],
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageWidth > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
    },
    [pageWidth],
  );

  const monday = weeks[page] ?? weeks[weeks.length - 1];
  const rangeLabel = isCurrent ? 'Cette semaine' : `${shortDate(monday)} – ${shortDate(addDays(monday, 6))}`;

  return (
    <SheetPage title="Ma série" accent="série" actions={<BonusPill left={bonusesLeft} />}>
      <StreakHero days={days} flame={state === 'inactive' ? 'off' : 'lit'} />

      {/* Quelle semaine, et de quoi en changer */}
      <View style={styles.weekBar}>
        <Text style={styles.range} numberOfLines={1}>
          {rangeLabel}
        </Text>
        {/* Au bout (début du livre, cette semaine), la flèche s'efface */}
        <View style={page === 0 && styles.disabled} pointerEvents={page === 0 ? 'none' : 'auto'}>
          <GlassButton icon={ChevronLeftIcon} onPress={() => goTo(page - 1)} accessibilityLabel="Semaine précédente" />
        </View>
        <View style={isCurrent && styles.disabled} pointerEvents={isCurrent ? 'none' : 'auto'}>
          <GlassButton icon={ChevronRightIcon} onPress={() => goTo(page + 1)} accessibilityLabel="Semaine suivante" />
        </View>
        {/* Dans le passé : d'un toucher, retour à cette semaine */}
        {!isCurrent && (
          <GlassButton icon={ChevronsRightIcon} onPress={() => goTo(weeks.length - 1)} accessibilityLabel="Revenir à cette semaine" />
        )}
      </View>

      {/* Les semaines, à glisser */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          if (width !== pageWidth) {
            setPageWidth(width);
            // Ouvre sur cette semaine
            requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: page * width, animated: false }));
          }
        }}
        onMomentumScrollEnd={onScrollEnd}
      >
        {weeks.map((w) => (
          <View key={w} style={[styles.week, { width: pageWidth }]}>
            {WEEKDAYS.map((letter, i) => {
              const day = addDays(w, i);
              return (
                <DayCell
                  key={day}
                  letter={letter}
                  label={shortDate(day)}
                  isToday={day === today}
                  future={day > today}
                  read={readDays.includes(day)}
                  bonus={bonusDates.includes(day)}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SheetPage>
  );
}

interface DayCellProps {
  letter: string;
  label: string;
  isToday: boolean;
  future: boolean;
  read: boolean;
  bonus: boolean;
}

function DayCell({ letter, label, isToday, future, read, bonus }: DayCellProps) {
  const status = read ? 'lu' : bonus ? 'gardé par un marque-page' : future ? 'à venir' : isToday ? 'pas encore lu' : 'pas lu';
  return (
    <View style={styles.day} accessible accessibilityLabel={`${isToday ? "Aujourd'hui" : label}, ${status}`}>
      <Text style={[styles.weekday, isToday && styles.weekdayToday]}>{letter}</Text>
      {read ? (
        <LinearGradient colors={[lowki.red.light, lowki.red.dark]} style={styles.cell}>
          <CheckIcon size={20} color={lowki.butter.light} strokeWidth={4} />
        </LinearGradient>
      ) : bonus ? (
        <View style={styles.cell}>
          <BonusBookmark size={30} />
        </View>
      ) : future || isToday ? (
        <View style={[styles.cell, styles.ring, isToday ? styles.ringToday : styles.ringFuture]} />
      ) : (
        <LinearGradient colors={[lowki.beige.light, lowki.beige.dark]} style={[styles.cell, styles.empty]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  weekBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  range: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.35,
  },

  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  weekday: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textTertiary,
  },
  weekdayToday: {
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: CELL / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Un jour sans lecture : le disque beige, discret
  empty: {
    opacity: 0.55,
  },
  ring: {
    borderWidth: 2,
    borderStyle: 'dotted',
  },
  ringToday: {
    borderColor: lowki.red.light,
  },
  ringFuture: {
    borderColor: lowki.beige.light,
    opacity: 0.6,
  },
});
