/**
 * StreakDays — les jours de ma série, comme dans le calendrier de /streak :
 * une série court comme un ruban rouge léger sous ses jours, le premier jour
 * d'une série (2 jours ou plus) sous sa flamme, un jour lu seul en disque
 * rouge, un jour gardé par un marque-page porte le marque-page. Aujourd'hui :
 * un point sous son chiffre, et le chiffre en rouge tant qu'il n'est pas lu.
 * Les jours à venir s'effacent.
 *
 * Partagé par le mois (/streak) et la semaine de /streak-save, pour que les
 * deux parlent exactement la même langue.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, fonts, lowki } from '../../utils/constants';
import { ACCENT_SCALE } from './AccentWord';
import { BonusBookmark } from './BonusPill';

export const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const DAY_ROW = 44;
const DISC = 36;
// Le marque-page d'un jour gardé : aussi large qu'un disque, son bout rond
// posé pile sur le haut du disque (l'image est carrée, le marque-page fait
// 814 × 1032 dedans)
const DAY_BOOKMARK = Math.round((DISC * 1032) / 814);
/**
 * La flamme d'un premier jour de série (flamme_calendar de Lea) : un rond
 * rouge, la flamme par-dessus. Le rond se cale pile sur le disque des autres
 * jours ; les pointes dépassent au-dessus, le petit pic en dessous. Mesuré
 * sur l'image d'origine (1206 px) : rond de centre (612,5 ; 728,5), rayon 406,7.
 */
const DAY_FLAME = require('../../assets/images/streak/flame-calendar.png');
const DAY_FLAME_SIZE = DISC / 2 / (406.7 / 1206);
const DAY_FLAME_CENTER = { x: (612.5 / 1206) * DAY_FLAME_SIZE, y: (728.5 / 1206) * DAY_FLAME_SIZE };
/** Le ruban d'une série : le rouge de la charte, à peine posé */
const RIBBON = [`${lowki.red.light}24`, `${lowki.red.dark}24`] as const;

/** Le marque-page qui se pose : il descend dans sa case, sans rebond */
const BOOKMARK_DROP = FadeInDown.duration(420).easing(Easing.out(Easing.cubic));
/** Le ruban se recoud juste après */
const RIBBON_JOIN = FadeIn.duration(300).delay(260);

/** YYYY-MM-DD, `n` jours après `day` (UTC, comme le serveur) */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

/** La lettre du jour de la semaine d'un jour (L, M, M, J…) */
export function weekdayOf(day: string): string {
  return WEEKDAYS[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7];
}

/** La rangée des lettres au-dessus des jours */
export function WeekdayRow({ letters, cellWidth }: { letters: string[]; cellWidth: number }) {
  return (
    <View style={styles.row}>
      {letters.map((letter, i) => (
        <Text key={i} style={[styles.weekday, { width: cellWidth }]}>
          {letter}
        </Text>
      ))}
    </View>
  );
}

interface DaysRowProps {
  /** Les jours de la rangée, YYYY-MM-DD ; null = case vide (hors du mois) */
  days: (string | null)[];
  cellWidth: number;
  today: string;
  read: Set<string>;
  saved: Set<string>;
  /** Ce jour vient d'être gardé : son marque-page descend, le ruban se recoud */
  dropping?: string;
  /** Ce jour attend un marque-page (/streak-save) : le marque-page en filigrane, à sa place */
  awaiting?: string;
}

/** Une rangée de jours, avec le ruban sous chaque série qui s'y suit */
export function DaysRow({ days, cellWidth, today, read, saved, dropping, awaiting }: DaysRowProps) {
  // Un jour compte dans la série s'il est lu ou gardé
  const kept = (d: string | null) => !!d && (read.has(d) || saved.has(d));

  return (
    <View style={styles.row}>
      {ribbons(days, kept).map(([from, to]) => (
        <Animated.View
          key={`${from}-${to}`}
          entering={dropping ? RIBBON_JOIN : undefined}
          style={[
            styles.ribbon,
            { left: from * cellWidth + (cellWidth - DISC) / 2, width: (to - from) * cellWidth + DISC },
          ]}
        >
          <LinearGradient colors={RIBBON} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ))}
      {days.map((day, c) =>
        day ? (
          <DayCell
            key={day}
            day={day}
            width={cellWidth}
            isToday={day === today}
            future={day > today}
            read={read.has(day)}
            bonus={saved.has(day) && !read.has(day)}
            dropping={day === dropping}
            awaiting={day === awaiting && !saved.has(day) && !read.has(day)}
            // Le premier jour d'une série : la veille ne compte pas
            runStart={kept(day) && !kept(addDays(day, -1))}
            // Un jour lu seul, sans veille ni lendemain : pas encore une série
            alone={kept(day) && !kept(addDays(day, -1)) && !kept(addDays(day, 1))}
          />
        ) : (
          <View key={`empty-${c}`} style={{ width: cellWidth }} />
        ),
      )}
    </View>
  );
}

/** Les colonnes [début, fin] des jours gardés qui se suivent dans une rangée */
function ribbons(days: (string | null)[], kept: (d: string | null) => boolean): [number, number][] {
  const out: [number, number][] = [];
  let start = -1;
  days.forEach((day, i) => {
    if (kept(day)) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      out.push([start, i - 1]);
      start = -1;
    }
  });
  if (start >= 0) out.push([start, days.length - 1]);
  return out;
}

interface DayCellProps {
  day: string;
  width: number;
  isToday: boolean;
  future: boolean;
  read: boolean;
  bonus: boolean;
  dropping: boolean;
  awaiting: boolean;
  runStart: boolean;
  alone: boolean;
}

function DayCell({ day, width, isToday, future, read, bonus, dropping, awaiting, runStart, alone }: DayCellProps) {
  const n = Number(day.slice(8));
  const status = read ? 'lu' : bonus ? 'gardé par un marque-page' : future ? 'à venir' : isToday ? 'pas encore lu' : 'pas lu';
  return (
    <View style={[styles.cell, { width }]} accessible accessibilityLabel={`${n}${isToday ? ", aujourd'hui" : ''}, ${status}`}>
      {/* Un jour lu seul : le disque rouge ; une vraie série s'allume sous sa flamme */}
      {read && alone && <LinearGradient colors={[lowki.red.light, lowki.red.dark]} style={styles.disc} />}
      {read && runStart && !alone && (
        <Image
          source={DAY_FLAME}
          style={[
            styles.dayFlame,
            { left: width / 2 - DAY_FLAME_CENTER.x, top: DAY_ROW / 2 - DAY_FLAME_CENTER.y },
          ]}
        />
      )}
      {awaiting && (
        <View style={[styles.discBox, styles.ghost]}>
          <BonusBookmark size={DAY_BOOKMARK} />
        </View>
      )}
      {bonus && (
        <Animated.View entering={dropping ? BOOKMARK_DROP : undefined} style={styles.discBox}>
          <BonusBookmark size={DAY_BOOKMARK} />
        </Animated.View>
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
      {/* Aujourd'hui, lu ou non : un point sous le chiffre */}
      {isToday && <View style={[styles.todayDot, read && runStart && styles.todayDotOnFlame]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    height: DAY_ROW,
    alignItems: 'center',
  },
  // Les jours de la semaine à la main (Welcome Valentines, à l'œil du corps 13)
  weekday: {
    textAlign: 'center',
    fontFamily: fonts.accent,
    fontSize: 13 * ACCENT_SCALE,
    color: colors.textTertiary,
  },
  ribbon: {
    position: 'absolute',
    top: (DAY_ROW - DISC) / 2,
    height: DISC,
    borderRadius: DISC / 2,
    overflow: 'hidden',
  },
  cell: {
    height: DAY_ROW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    position: 'absolute',
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
  },
  // Le jour qui attend son marque-page : le marque-page en filigrane, à peine là
  ghost: {
    opacity: 0.18,
  },
  dayFlame: {
    position: 'absolute',
    width: DAY_FLAME_SIZE,
    height: DAY_FLAME_SIZE,
  },
  discBox: {
    position: 'absolute',
    width: DISC,
    height: DISC,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: (DAY_BOOKMARK - DISC) / 2 }],
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
    color: colors.white,
  },
  todayDot: {
    position: 'absolute',
    bottom: (DAY_ROW - DISC) / 2 + 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: lowki.red.light,
  },
  todayDotOnFlame: {
    backgroundColor: colors.white,
  },
  // Aujourd'hui, pas encore lu : le chiffre en rouge
  dayToday: {
    fontFamily: fonts.bodyBold,
    color: lowki.red.light,
  },
  dayFuture: {
    opacity: 0.4,
  },
});
