/**
 * ParticipantTimeline — le journal de lecture d'une personne.
 *
 *    Journal
 *
 *    ○  HIER                       ← un jour : un rond creux sur le fil, la date en
 *                                   petites capitales (comme « FIN », « CAPS »)
 *    ┃
 *    ◉  p. 21   +14      18:40 ← chaque lecture : une étape de la piste de l'accueil,
 *    ┃                             rond plein découpé dans la barre
 *    ○  MER. 16 SEPTEMBRE
 *    ◉  p. 16   +2       23:30
 *    ◉  p. 36   +20      16:43
 *
 * Le fil EST la piste de l'accueil, à la verticale : même barre (6 pt, dégradé
 * lie de vin, ce sont mes pages lues), mêmes étapes (rond de 9 pt dans un
 * anneau vide de 2 pt), continu du haut en bas, sans trou entre les jours.
 *
 * Mise en page : `SheetPage`, le squelette commun à tous les sheets.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressHistory } from '../../types/supabase';
import { accentGradient, colors, fonts, spacing } from '../../utils/constants';
import { RAIL_HEIGHT, STEP_GAP, STEP_SIZE } from './GoalTrack';
import SheetPage from './SheetPage';

// ─── Props ─────────────────────────────────────────────────────────

interface ParticipantTimelineProps {
  /** Le prénom de la personne ; absent pour mon propre journal */
  ownerName?: string;
  history?: ProgressHistory[] | null;
  /** Ouvert depuis un autre sheet (fiche du livre, classement) : un retour */
  onBack?: () => void;
}

// ─── Helpers de formatage ──────────────────────────────────────────

function formatDayLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Date inconnue';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const dayStr = dateStr.length > 10 ? dateStr.split('T')[0] : dateStr;

  if (dayStr === todayStr) return "Aujourd'hui";
  if (dayStr === yesterdayStr) return 'Hier';

  const d = new Date(dayStr + 'T00:00:00');
  if (isNaN(d.getTime())) return 'Date inconnue';

  const label = d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Types internes ────────────────────────────────────────────────

interface DayGroup {
  date: string;
  label: string;
  entries: ProgressHistory[];
}

// ─── Composant principal ───────────────────────────────────────────

export default function ParticipantTimeline({
  ownerName,
  history = [],
  onBack,
}: ParticipantTimelineProps) {

  const dayGroups: DayGroup[] = useMemo(() => {
    const safeHistory = Array.isArray(history) ? history : [];
    if (safeHistory.length === 0) return [];

    const map = new Map<string, ProgressHistory[]>();

    for (const entry of safeHistory) {
      const day =
        entry.created_date || (entry.recorded_at ? entry.recorded_at.split('T')[0] : 'unknown');
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(entry);
    }

    const sortedDays = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    return sortedDays.map((date) => ({
      date,
      label: formatDayLabel(date),
      entries: map.get(date)!,
    }));
  }, [history]);

  return (
    <SheetPage title="Journal" subtitle={ownerName} onBack={onBack}>
      {dayGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Pas encore de lecture</Text>
          <Text style={styles.emptySubtitle}>Les pages enregistrées s'afficheront ici</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {/* Le fil, continu du premier jour au dernier */}
          <LinearGradient colors={accentGradient} style={styles.rail} />

          {dayGroups.map((group) => (
            <View key={group.date}>
              <View style={styles.dayRow}>
                <View style={styles.dayNode} />
                <Text style={styles.dayLabel}>{group.label}</Text>
              </View>

              {group.entries.map((entry) => (
                <View
                  key={entry.id}
                  style={styles.entry}
                  accessible
                  accessibilityLabel={`${formatTime(entry.recorded_at)}, page ${entry.page_number}${
                    entry.pages_read
                      ? `, ${entry.pages_read > 0 ? '+' : ''}${entry.pages_read} pages`
                      : ''
                  }`}
                >
                  {/* Une étape de la piste : le rond, dans son anneau découpé */}
                  <View style={styles.step}>
                    <View style={styles.stepDot} />
                  </View>
                  <Text style={styles.entryPage}>p. {entry.page_number}</Text>
                  {entry.pages_read !== 0 && (
                    <Text style={styles.entryDelta}>
                      {entry.pages_read > 0 ? '+' : '−'}
                      {Math.abs(entry.pages_read)}
                    </Text>
                  )}
                  <Text style={styles.entryTime}>{formatTime(entry.recorded_at)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </SheetPage>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

/** Axe du fil, depuis la gauche du contenu */
const RAIL_X = 10;
/** Une étape : le rond et l'anneau vide autour, comme sur la piste */
const STEP_OUTER = STEP_SIZE + 2 * STEP_GAP;
const ENTRY_HEIGHT = 44;
const DAY_NODE = 15;
const DAY_ROW_HEIGHT = 40;

const styles = StyleSheet.create({
  emptyState: {
    paddingVertical: spacing['3xl'],
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textTertiary,
  },

  timeline: {
    position: 'relative',
  },
  /** Le fil : du milieu de la première date au dernier rond */
  rail: {
    position: 'absolute',
    left: RAIL_X - RAIL_HEIGHT / 2,
    width: RAIL_HEIGHT,
    top: DAY_ROW_HEIGHT / 2,
    bottom: ENTRY_HEIGHT / 2,
    borderRadius: RAIL_HEIGHT / 2,
  },

  dayRow: {
    height: DAY_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  /** Le début d'un jour : un rond creux sur le fil, plus grand qu'une lecture */
  dayNode: {
    width: DAY_NODE,
    height: DAY_NODE,
    borderRadius: DAY_NODE / 2,
    marginLeft: RAIL_X - DAY_NODE / 2,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  /** La date, comme les titres de section de l'app (« FIN », « CAPS ») */
  dayLabel: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  entry: {
    height: ENTRY_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  /** L'anneau vide autour du rond : il « découpe » la barre, comme sur la piste */
  step: {
    width: STEP_OUTER,
    height: STEP_OUTER,
    borderRadius: STEP_OUTER / 2,
    marginLeft: RAIL_X - STEP_OUTER / 2,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    borderRadius: STEP_SIZE / 2,
    backgroundColor: colors.accent,
  },
  entryPage: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  entryDelta: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  entryTime: {
    marginLeft: 'auto',
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
});
