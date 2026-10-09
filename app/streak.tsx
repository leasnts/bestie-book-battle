/**
 * Route /streak — ma série, ouverte en touchant la gélule de l'accueil.
 *
 * Un coup d'œil, rien à faire : le nombre de jours, les sept derniers jours
 * (une flamme quand j'ai lu, un marque-page quand il a gardé la série, un
 * point quand je n'ai pas lu, aujourd'hui cerclé tant que je n'ai pas lu),
 * puis les marque-pages qu'il me reste sur ce livre.
 */

import { BookmarkIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import BonusMarks from '../components/ui/BonusMarks';
import SheetPage from '../components/ui/SheetPage';
import StreakHero from '../components/ui/StreakHero';
import { STREAK_FLAME } from '../components/ui/StreakPill';
import { useMyStreak } from '../hooks/useMyStreak';
import { getReadingDays } from '../services/supabase/database';
import { colors, fonts, lowki, spacing } from '../utils/constants';
import { dayString } from '../utils/streak';

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const CELL = 36;

export default function StreakRoute() {
  const { userId, challengeId, state, days, bonusDates, bonusesLeft } = useMyStreak();
  const [readDays, setReadDays] = useState<string[] | null>(null);

  useEffect(() => {
    if (!userId || !challengeId) return;
    getReadingDays(challengeId, userId, dayString(6))
      .then(setReadDays)
      .catch(() => setReadDays([]));
  }, [userId, challengeId]);

  // Du plus ancien à aujourd'hui
  const week = Array.from({ length: 7 }, (_, i) => dayString(6 - i));
  const today = dayString(0);

  return (
    <SheetPage title="Ma série" accent="série">
      <StreakHero days={days} flame={state === 'inactive' ? 'off' : 'lit'} />

      {/* Les sept derniers jours */}
      <View style={styles.week}>
        {week.map((day) => {
          const isToday = day === today;
          const read = readDays?.includes(day) ?? false;
          const bonus = bonusDates.includes(day);
          const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
          const label = read ? 'lu' : bonus ? 'marque-page' : isToday ? 'pas encore lu' : 'pas lu';
          return (
            <View key={day} style={styles.day} accessible accessibilityLabel={`${isToday ? "Aujourd'hui" : weekday}, ${label}`}>
              <Text style={[styles.weekday, isToday && styles.weekdayToday]}>{weekday}</Text>
              <View style={[styles.cell, isToday && !read && styles.cellToday]}>
                {read ? (
                  <Image source={STREAK_FLAME} style={styles.cellFlame} />
                ) : bonus ? (
                  <BookmarkIcon size={20} color={lowki.red.light} strokeWidth={2.25} />
                ) : (
                  !isToday && <View style={styles.missedDot} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Les marque-pages qu'il me reste sur ce livre */}
      <BonusMarks left={bonusesLeft} />
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing['2xl'],
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
  // Aujourd'hui, pas encore lu : un cercle en points, à remplir
  cellToday: {
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: lowki.red.light,
  },
  cellFlame: {
    width: 26,
    height: 26,
  },
  missedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: lowki.beige.light,
  },

});
