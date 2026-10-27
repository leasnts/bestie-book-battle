/**
 * Route /streak — ma série, ouverte en touchant la gélule de l'accueil.
 *
 * Un coup d'œil, rien à faire : le mois, dans les cadres en verre brodés de
 * l'accueil (GlassSection).
 * - Le mois en titre, l'année en mot d'accent ; ‹ › » à droite.
 * - Deux repères : les jours lus du mois (la flamme), les marque-pages posés
 *   sur ce livre (« 1 / 3 »).
 * - Le calendrier : une série court comme un ruban rouge léger sous ses jours,
 *   le premier jour d'une série (2 jours ou plus) sous sa flamme, un jour lu
 *   seul en disque rouge, un jour gardé par un
 *   marque-page porte le marque-page. Aujourd'hui : un point sous son chiffre,
 *   et le chiffre en rouge tant qu'il n'est pas lu. Les jours à venir s'effacent.
 *
 * On change de mois jusqu'au début du livre en glissant sur le calendrier (ou
 * avec ‹ ›), et » ramène au mois en cours. Les cadres ne bougent pas : seul
 * leur contenu glisse.
 */

import { ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeInLeft, FadeInRight, LinearTransition, runOnJS } from 'react-native-reanimated';
import { ACCENT_SCALE, AccentUnit } from '../components/ui/AccentWord';
import { BonusBookmark } from '../components/ui/BonusPill';
import { addDays, DaysRow, WeekdayRow, WEEKDAYS } from '../components/ui/StreakDays';
import GlassButton from '../components/ui/GlassButton';
import SheetPage from '../components/ui/SheetPage';
import GlassSection from '../components/ui/GlassSection';
import { STREAK_FLAME } from '../components/ui/StreakPill';
import { useMyStreak } from '../hooks/useMyStreak';
import { getReadingDays } from '../services/supabase/database';
import { useProjectStore } from '../stores/projectStore';
import { colors, fonts, spacing } from '../utils/constants';
import { dayString, STREAK_BONUS_PER_BOOK } from '../utils/streak';

// Les deux icônes des repères, à la même taille à l'œil : la flamme a du vide
// autour d'elle dans son image ; le marque-page, plein, se tient un peu plus petit
const STAT_ICON = 34;
const STAT_BOOKMARK = 29;
/** Pas plus d'un an en arrière */
const MAX_MONTHS = 12;

/** YYYY-MM-DD d'un jour UTC */
function iso(d: Date) {
  return d.toISOString().split('T')[0];
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

/**
 * « Octobre 2026 ». Le titre partage sa ligne avec trois boutons : un nom de
 * mois trop long passe en court (« Sept. 2026 »).
 */
function monthLabel(first: string): string {
  const date = new Date(`${first}T00:00:00Z`);
  const long = date.toLocaleDateString('fr-FR', { month: 'long', timeZone: 'UTC' });
  const label = date.toLocaleDateString('fr-FR', {
    month: long.length > 8 ? 'short' : 'long',
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

  // ── Changer de mois ──
  // Les cadres restent en place : seul leur contenu change, avec un léger
  // glissé dans le sens du mois (de droite pour le suivant, de gauche pour le
  // précédent).
  const [page, setPage] = useState(months.length - 1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const isCurrent = page === months.length - 1;

  const goTo = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(months.length - 1, index));
      if (target === page) return;
      setDirection(target > page ? 1 : -1);
      setPage(target);
    },
    [months.length, page],
  );

  // Glisser sur le calendrier change de mois, comme les flèches
  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      if (e.translationX < -50 || e.velocityX < -500) runOnJS(goTo)(page + 1);
      else if (e.translationX > 50 || e.velocityX > 500) runOnJS(goTo)(page - 1);
    });

  const read = useMemo(() => new Set(readDays), [readDays]);
  const saved = useMemo(() => new Set(bonusDates), [bonusDates]);
  const month = months[page] ?? months[months.length - 1];
  // Le titre du sheet : le mois affiché, l'année en mot d'accent
  const title = monthLabel(month);
  const readCount = [...read].filter((d) => d.startsWith(month.slice(0, 7))).length;
  const used = bonusDates.length;
  const entering = (direction > 0 ? FadeInRight : FadeInLeft).duration(220);

  const [calendarWidth, setCalendarWidth] = useState(0);
  const cellWidth = calendarWidth / 7;

  return (
    <SheetPage
      title={title}
      accent={title.split(' ')[1]}
      actions={
        <View style={styles.arrows}>
          {/* Au bout (début du livre, ce mois-ci), la flèche s'efface */}
          <View style={page === 0 && styles.disabled} pointerEvents={page === 0 ? 'none' : 'auto'}>
            <GlassButton icon={ChevronLeftIcon} onPress={() => goTo(page - 1)} accessibilityLabel="Mois précédent" />
          </View>
          <View style={isCurrent && styles.disabled} pointerEvents={isCurrent ? 'none' : 'auto'}>
            <GlassButton icon={ChevronRightIcon} onPress={() => goTo(page + 1)} accessibilityLabel="Mois suivant" />
          </View>
          {/* Retour à ce mois-ci. Toujours là, effacé sur ce mois-ci : les
              flèches ne bougent jamais sous le doigt */}
          <View style={isCurrent && styles.disabled} pointerEvents={isCurrent ? 'none' : 'auto'}>
            <GlassButton icon={ChevronsRightIcon} onPress={() => goTo(months.length - 1)} accessibilityLabel="Revenir à ce mois-ci" />
          </View>
        </View>
      }
    >
      {/* Les deux repères */}
      <View style={styles.stats}>
        <GlassSection paper compact style={styles.statFrame}>
          <View
            style={styles.stat}
            accessible
            accessibilityLabel={`${readCount} jour${readCount > 1 ? 's' : ''} lu${readCount > 1 ? 's' : ''} ce mois`}
          >
            <Image source={STREAK_FLAME} style={styles.statIcon} />
            <Animated.View key={month} entering={entering}>
              <Text style={styles.statValue}>{readCount}</Text>
              <Text style={styles.statLabel}>{readCount > 1 ? 'jours lus' : 'jour lu'}</Text>
            </Animated.View>
          </View>
        </GlassSection>
        {/* Les marque-pages comptent pour tout le livre : ils ne changent pas avec le mois */}
        <GlassSection paper compact style={styles.statFrame}>
          <View
            style={styles.stat}
            accessible
            accessibilityLabel={`${used} marque-page${used > 1 ? 's' : ''} posé${used > 1 ? 's' : ''} sur ${STREAK_BONUS_PER_BOOK} pour ce livre`}
          >
            <BonusBookmark size={STAT_BOOKMARK} />
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

      {/* Le calendrier : le cadre reste, le mois glisse dedans */}
      <GestureHandlerRootView>
        <GestureDetector gesture={swipe}>
          <Animated.View layout={LinearTransition.duration(220)} style={styles.calendar}>
            <GlassSection paper>
              <View onLayout={(e) => setCalendarWidth(e.nativeEvent.layout.width)}>
                <WeekdayRow letters={WEEKDAYS} cellWidth={cellWidth} />
                {calendarWidth > 0 && (
                  <Animated.View key={month} entering={entering}>
                    <MonthGrid first={month} cellWidth={cellWidth} today={today} read={read} saved={saved} />
                  </Animated.View>
                )}
              </View>
            </GlassSection>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </SheetPage>
  );
}

interface MonthGridProps {
  first: string;
  cellWidth: number;
  today: string;
  read: Set<string>;
  saved: Set<string>;
}

function MonthGrid({ first, cellWidth, today, read, saved }: MonthGridProps) {
  const grid = useMemo(() => monthGrid(first), [first]);
  return (
    <>
      {grid.map((week, r) => (
        <DaysRow key={r} days={week} cellWidth={cellWidth} today={today} read={read} saved={saved} />
      ))}
    </>
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
    gap: spacing.sm,
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
});
