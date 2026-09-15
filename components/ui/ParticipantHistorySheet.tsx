/**
 * Composant ParticipantHistorySheet
 *
 * Bottom sheet modal qui affiche l'historique des imports de pages
 * d'un participant dans un challenge.
 *
 * Comment ça marche :
 * - On reçoit la liste d'entrées ProgressHistory[] d'un participant
 * - On les regroupe par jour (created_date)
 * - Chaque jour est une section avec un header date
 * - Chaque entrée montre : heure · page atteinte · badge "+X pages"
 * - Un trait vertical (timeline) relie les entrées visuellement
 *
 * Utilise BottomSheet (custom) pour le glissement-pour-fermer natif.
 * La ScrollView du contenu coexiste avec le handle de drag :
 * scroller la liste ne déclenche pas le dismiss — seul le handle en haut le fait.
 */

import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProgressHistory } from '../../types/supabase';
import { borderRadius, colors, fonts, inkAlpha, spacing } from '../../utils/constants';
import BottomSheet from './BottomSheet';
import { XIcon } from 'lucide-react-native';

// ─── Props ─────────────────────────────────────────────────────────

interface ParticipantHistorySheetProps {
  visible: boolean;
  onClose: () => void;
  participantName: string;
  participantPhoto: string | null;
  history?: ProgressHistory[] | null;
}

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');

const resolveAvatar = (url: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

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

export default function ParticipantHistorySheet({
  visible,
  onClose,
  participantName,
  participantPhoto,
  history = [],
}: ParticipantHistorySheetProps) {

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
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        {/* Header : avatar + nom — fixe, pas dans le scroll */}
        <View style={styles.header}>
          <Image
            source={resolveAvatar(participantPhoto)}
            style={styles.headerAvatar}
            contentFit="cover"
          />
          <View style={styles.headerTexts}>
            <Text style={styles.headerName}>{participantName}</Text>
            <Text style={styles.headerSubtitle}>Historique de lecture</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <XIcon size={22} color={colors.textSubtle} />
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Timeline scrollable */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
          {dayGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>Pas encore de lecture</Text>
              <Text style={styles.emptySubtitle}>
                L'historique apparaîtra ici quand des pages seront enregistrées
              </Text>
            </View>
          ) : (
            dayGroups.map((group, groupIndex) => (
              <View key={group.date} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>{group.label}</Text>
                  </View>
                </View>

                {group.entries.map((entry, entryIndex) => {
                  const isLastInGroup = entryIndex === group.entries.length - 1;
                  const isLastOverall =
                    groupIndex === dayGroups.length - 1 && isLastInGroup;

                  return (
                    <View key={entry.id} style={styles.timelineRow}>
                      <View style={styles.timelineTrack}>
                        <View style={styles.timelineDot}>
                          <View style={styles.timelineDotInner} />
                        </View>
                        {!isLastOverall && <View style={styles.timelineLine} />}
                      </View>

                      <View
                        style={[
                          styles.entryCard,
                          isLastInGroup && styles.entryCardLast,
                        ]}
                      >
                        <View style={styles.entryTopRow}>
                          <Text style={styles.entryTime}>
                            {formatTime(entry.recorded_at)}
                          </Text>
                          {entry.pages_read > 0 && (
                            <View style={styles.pagesDeltaBadge}>
                              <Text style={styles.pagesDeltaText}>
                                +{entry.pages_read} page{entry.pages_read > 1 ? 's' : ''}
                              </Text>
                            </View>
                          )}
                          {entry.pages_read < 0 && (
                            <View style={[styles.pagesDeltaBadge, styles.pagesDeltaBadgeNeg]}>
                              <Text style={[styles.pagesDeltaText, styles.pagesDeltaTextNeg]}>
                                {entry.pages_read} page{Math.abs(entry.pages_read) > 1 ? 's' : ''}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.entryPageNumber}>
                          Page {entry.page_number}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const SCREEN_HEIGHT = Dimensions.get('window').height;
// Hauteur max de la sheet (88% écran) moins les zones fixes :
// handle bar (~30px) + header (~76px) + divider (1px) + marge (~16px)
const SCROLL_MAX_HEIGHT = SCREEN_HEIGHT * 0.88 - 123;

const TIMELINE_TRACK_WIDTH = 32;
const DOT_SIZE = 12;
const DOT_INNER_SIZE = 6;
const LINE_WIDTH = 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ═══ HEADER ═══
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  closeBtn: { padding: 4 },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: inkAlpha(0.06),
  },
  headerTexts: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 18,
  },

  // ═══ DIVIDER ═══
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 24,
  },

  // ═══ SCROLL VIEW ═══
  scrollView: {
    maxHeight: SCROLL_MAX_HEIGHT,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },

  // ═══ ÉTAT VIDE ═══
  emptyState: {
    alignItems: 'flex-start',
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPlaceholder,
    lineHeight: 20,
    textAlign: 'left',
  },

  // ═══ GROUPE PAR JOUR ═══
  dayGroup: {
    marginBottom: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayBadge: {
    backgroundColor: colors.dark900,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.white,
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // ═══ TIMELINE ROW ═══
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineTrack: {
    width: TIMELINE_TRACK_WIDTH,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: inkAlpha(0.06),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    zIndex: 2,
  },
  timelineDotInner: {
    width: DOT_INNER_SIZE,
    height: DOT_INNER_SIZE,
    borderRadius: DOT_INNER_SIZE / 2,
    backgroundColor: colors.dark900,
  },
  timelineLine: {
    width: LINE_WIDTH,
    flex: 1,
    backgroundColor: inkAlpha(0.08),
    minHeight: 24,
    zIndex: 1,
  },

  // ═══ CARTE D'ENTRÉE ═══
  entryCard: {
    flex: 1,
    paddingBottom: 20,
    gap: 4,
  },
  entryCardLast: {
    paddingBottom: 16,
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTime: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPlaceholder,
    lineHeight: 18,
  },
  pagesDeltaBadge: {
    backgroundColor: colors.bgLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pagesDeltaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  pagesDeltaBadgeNeg: {
    backgroundColor: colors.bgLight,
  },
  pagesDeltaTextNeg: {
    color: colors.textPlaceholder,
  },
  entryPageNumber: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textTertiary,
    lineHeight: 24,
  },
});
