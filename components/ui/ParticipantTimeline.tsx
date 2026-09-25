/**
 * ParticipantTimeline — le journal de lecture d'une personne.
 *
 *    Journal
 *
 *    ┆ Hier ┆                    ← la date : une étiquette brodée, posée sur le fil
 *    ●  Page 21   +14      18:40 ← chaque lecture : un rond lie de vin sur le fil,
 *    │                             comme les étapes de la piste de l'accueil
 *    ┆ Mer. 16 septembre ┆
 *    ●  Page 16   +2       23:30
 *    ●  Page 36   +20      16:43
 *
 * Un seul fil continu du haut en bas (le gris de la piste de l'accueil), sans
 * trou entre les jours.
 *
 * Le composant EST la ScrollView de l'écran, sans View autour : c'est la
 * condition pour qu'un sheet natif (`formSheet`) lui donne les bonnes marges
 * (même leçon que le classement complet, #33).
 */
import { ChevronLeftIcon } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFitSheet } from '../../hooks/useFitSheet';
import { ProgressHistory } from '../../types/supabase';
import { borderRadius, colors, fonts, inkAlpha, spacing } from '../../utils/constants';
import GlassButton from './GlassButton';
import { RAIL_COLOR } from './GoalTrack';
import { SHEET_TOP_INSET } from './SheetHeader';

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
  // Le sheet s'ouvre à la hauteur de tout le journal, plafonné sous l'en-tête de l'accueil
  const fit = useFitSheet({ withBar: false });

  const dayGroups: DayGroup[] = useMemo(() => {
    const safeHistory = Array.isArray(history) ? history : [];
    if (safeHistory.length === 0) return [];

    const map = new Map<string, ProgressHistory[]>();

    for (const entry of safeHistory) {
      const day = entry.created_date
        || (entry.recorded_at ? entry.recorded_at.split('T')[0] : 'unknown');
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
    <ScrollView
      style={[styles.scrollView, fit.style]}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      onContentSizeChange={fit.onContentSizeChange}
    >
      {/* En-tête : le titre, ferré à gauche ; le prénom si ce n'est pas moi */}
      <View style={styles.header}>
        {onBack && (
          <GlassButton icon={ChevronLeftIcon} size={36} onPress={onBack} accessibilityLabel="Retour" />
        )}
        <View style={styles.headerTexts}>
          <Text style={styles.title} accessibilityRole="header">
            Journal
          </Text>
          {!!ownerName && <Text style={styles.owner}>{ownerName}</Text>}
        </View>
      </View>

      {dayGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Pas encore de lecture</Text>
          <Text style={styles.emptySubtitle}>Les pages enregistrées s'afficheront ici</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {/* Le fil, continu du premier jour au dernier */}
          <View style={styles.rail} />

          {dayGroups.map((group) => (
            <View key={group.date}>
              <View style={styles.dayRow}>
                <View style={styles.dayTag}>
                  <Text style={styles.dayTagText}>{group.label}</Text>
                </View>
              </View>

              {group.entries.map((entry) => (
                <View
                  key={entry.id}
                  style={styles.entry}
                  accessible
                  accessibilityLabel={`${formatTime(entry.recorded_at)}, page ${entry.page_number}${
                    entry.pages_read ? `, ${entry.pages_read > 0 ? '+' : ''}${entry.pages_read} pages` : ''
                  }`}
                >
                  <View style={styles.dot} />
                  <Text style={styles.entryPage}>Page {entry.page_number}</Text>
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
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

/** Axe du fil, depuis la gauche du contenu */
const RAIL_X = 9;
const RAIL_WIDTH = 4;
/** Les ronds : un peu plus gros que le fil, liseré blanc (comme la piste) */
const DOT_SIZE = 12;
const ENTRY_HEIGHT = 44;
const DAY_ROW_HEIGHT = 40;

const styles = StyleSheet.create({
  // Pas de hauteur imposée : c'est le sheet natif qui donne la sienne
  scrollView: {
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingTop: SHEET_TOP_INSET,
    paddingHorizontal: spacing.lg,
    // iOS ajoute déjà la zone du bas de l'écran (34 pt) sous le contenu
    paddingBottom: spacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 31,
    color: colors.textPrimary,
  },
  owner: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textTertiary,
    marginTop: 2,
  },

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
    left: RAIL_X - RAIL_WIDTH / 2,
    width: RAIL_WIDTH,
    top: DAY_ROW_HEIGHT / 2,
    bottom: ENTRY_HEIGHT / 2,
    borderRadius: RAIL_WIDTH / 2,
    backgroundColor: RAIL_COLOR,
  },

  dayRow: {
    height: DAY_ROW_HEIGHT,
    justifyContent: 'center',
  },
  /** La date : une étiquette de papier, couture en pointillés, posée sur le fil */
  dayTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: inkAlpha(0.22),
  },
  dayTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textSecondary,
  },

  entry: {
    height: ENTRY_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginLeft: RAIL_X - DOT_SIZE / 2,
    marginRight: spacing.md,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.white,
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
