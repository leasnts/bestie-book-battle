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
 * - Un petit dot coloré marque chaque point d'import
 *
 * Design : style "timeline" vertical avec des dots connectés par une ligne,
 * dans un bottom sheet cohérent avec les autres sheets de l'app (BookStack, etc.)
 */

import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { ProgressHistory } from '../../types/supabase';
import { borderRadius, colors, spacing } from '../../utils/constants';

// ─── Props ─────────────────────────────────────────────────────────

interface ParticipantHistorySheetProps {
  /** Afficher/masquer la modal */
  visible: boolean;
  /** Callback pour fermer la modal */
  onClose: () => void;
  /** Nom du participant (ex: "Moi", "Zoé") */
  participantName: string;
  /** URL de la photo du participant (ou null → avatar par défaut) */
  participantPhoto: string | null;
  /** Historique des imports de pages du participant */
  history?: ProgressHistory[] | null;
}

// Avatar par défaut si pas de photo (image BBB par défaut)
const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');

/**
 * Résout l'URL de l'avatar en source Image.
 * Si l'URL est null ou invalide, on utilise l'avatar par défaut.
 */
const resolveAvatar = (url: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

// ─── Helpers de formatage ──────────────────────────────────────────

/**
 * Formate une date ISO en label de jour lisible en français.
 * Ex: "Aujourd'hui", "Hier", "Lun. 10 février"
 *
 * Comment ça marche :
 * - On compare le jour de l'entrée avec aujourd'hui et hier
 * - Si c'est un de ces deux cas, on renvoie un label relatif (plus naturel)
 * - Sinon on formate en "Jour. DD mois" via toLocaleDateString fr-FR
 */
function formatDayLabel(dateStr: string | null | undefined): string {
  // Sécurité : si dateStr est null/undefined (created_date manquant en BDD),
  // on renvoie un label par défaut plutôt que de crasher
  if (!dateStr) return 'Date inconnue';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // dateStr peut être soit "YYYY-MM-DD" (created_date) soit ISO complète
  const dayStr = dateStr.length > 10 ? dateStr.split('T')[0] : dateStr;

  if (dayStr === todayStr) return "Aujourd'hui";
  if (dayStr === yesterdayStr) return 'Hier';

  const d = new Date(dayStr + 'T00:00:00');
  // Vérifie que la date est valide (new Date('invalid') donne NaN)
  if (isNaN(d.getTime())) return 'Date inconnue';

  const label = d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  // Capitalise la première lettre (ex: "lun. 10 février" → "Lun. 10 février")
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Formate un timestamp ISO en heure locale "HH:MM".
 * Ex: "2025-02-15T14:32:00Z" → "14:32"
 */
function formatTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Types internes ────────────────────────────────────────────────

/** Une entrée groupée par jour, pour l'affichage */
interface DayGroup {
  date: string;       // "YYYY-MM-DD"
  label: string;      // "Aujourd'hui", "Hier", "Lun. 10 février"
  entries: ProgressHistory[];
}

// ─── Composant principal ───────────────────────────────────────────

export default function ParticipantHistorySheet({
  visible,
  onClose,
  participantName,
  participantPhoto,
  history = [],  // Défaut : évite "length of null" si le parent passe undefined
}: ParticipantHistorySheetProps) {

  /**
   * Regroupe l'historique par jour.
   *
   * Comment ça marche :
   * - On parcourt chaque entrée et on utilise created_date comme clé de groupe
   * - On maintient un Map<string, ProgressHistory[]> pour grouper
   * - On trie les groupes du plus récent au plus ancien
   * - Au sein de chaque groupe, les entrées sont aussi triées (desc) car
   *   elles viennent déjà triées de Supabase (ORDER BY recorded_at DESC)
   */
  const dayGroups: DayGroup[] = useMemo(() => {
    const safeHistory = Array.isArray(history) ? history : [];
    if (safeHistory.length === 0) return [];

    const map = new Map<string, ProgressHistory[]>();

    for (const entry of safeHistory) {
      // created_date peut être null en BDD (si le trigger SQL ne l'a pas rempli).
      // Dans ce cas, on extrait la date depuis recorded_at (toujours présent).
      const day = entry.created_date
        || (entry.recorded_at ? entry.recorded_at.split('T')[0] : 'unknown');
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(entry);
    }

    // Trier les jours du plus récent au plus ancien
    const sortedDays = Array.from(map.keys()).sort(
      (a, b) => b.localeCompare(a)
    );

    return sortedDays.map((date) => ({
      date,
      label: formatDayLabel(date),
      entries: map.get(date)!,
    }));
  }, [history]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Overlay sombre — on tap dessus pour fermer */}
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
      </Animated.View>

      {/* Le bottom sheet — glisse depuis le bas */}
      <Animated.View
        style={styles.sheetContainer}
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(200)}
      >
        {/* Handle — petite barre qui indique que c'est un bottom sheet */}
        <View style={styles.handle}>
          <View style={styles.handleBar} />
        </View>

        {/* Header : avatar + nom du participant */}
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
        </View>

        <View style={styles.divider} />

        {/* Contenu scrollable : la timeline */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
          {dayGroups.length === 0 ? (
            /* État vide — pas encore d'historique */
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>Pas encore de lecture</Text>
              <Text style={styles.emptySubtitle}>
                L'historique apparaîtra ici quand des pages seront enregistrées
              </Text>
            </View>
          ) : (
            /* Timeline groupée par jour */
            dayGroups.map((group, groupIndex) => (
              <View key={group.date} style={styles.dayGroup}>
                {/* Header du jour — badge avec la date */}
                <View style={styles.dayHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>{group.label}</Text>
                  </View>
                </View>

                {/* Entrées du jour — chacune est un point sur la timeline */}
                {group.entries.map((entry, entryIndex) => {
                  const isLastInGroup = entryIndex === group.entries.length - 1;
                  const isLastOverall =
                    groupIndex === dayGroups.length - 1 && isLastInGroup;

                  return (
                    <View key={entry.id} style={styles.timelineRow}>
                      {/* Colonne gauche : le trait vertical + le dot */}
                      <View style={styles.timelineTrack}>
                        {/* Dot — petit cercle coloré qui marque le point d'import */}
                        <View style={styles.timelineDot}>
                          <View style={styles.timelineDotInner} />
                        </View>
                        {/* Ligne verticale — relie les dots entre eux.
                            On ne l'affiche pas après le dernier item global. */}
                        {!isLastOverall && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>

                      {/* Colonne droite : les infos de l'import */}
                      <View
                        style={[
                          styles.entryCard,
                          isLastInGroup && styles.entryCardLast,
                        ]}
                      >
                        {/* Ligne du haut : heure + badge "+X pages" */}
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

                        {/* Ligne du bas : "Page X" en gros pour l'impact visuel */}
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
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const TIMELINE_TRACK_WIDTH = 32; // Largeur de la colonne timeline (dots + ligne)
const DOT_SIZE = 12;             // Taille du dot extérieur
const DOT_INNER_SIZE = 6;       // Taille du dot intérieur (rempli)
const LINE_WIDTH = 2;            // Épaisseur de la ligne verticale

const styles = StyleSheet.create({
  // ═══ MODAL OVERLAY ═══
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    flex: 1,
  },

  // ═══ BOTTOM SHEET CONTAINER ═══
  // Positionné en bas, avec des coins arrondis en haut.
  // minHeight 75% pour garantir une grande surface visible.
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: '75%',
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32, // home indicator
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },

  // ═══ HANDLE ═══
  handle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSubtle,
    borderRadius: 9999,
  },

  // ═══ HEADER — avatar + nom ═══
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  headerTexts: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  headerSubtitle: {
    fontFamily: 'WorkSans_400Regular',
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
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
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
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  emptySubtitle: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 14,
    color: colors.textPlaceholder,
    lineHeight: 20,
    textAlign: 'left',
  },

  // ═══ GROUPE PAR JOUR ═══
  dayGroup: {
    marginBottom: 4,
  },

  // Header du jour — ferré à gauche, aligné avec le bord du padding
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
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 12,
    color: colors.white,
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // ═══ TIMELINE ROW (une entrée) ═══
  // Chaque entrée = [colonne timeline (dot + ligne)] + [carte info]
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Colonne timeline — contient le dot et la ligne verticale
  timelineTrack: {
    width: TIMELINE_TRACK_WIDTH,
    alignItems: 'center',
    position: 'relative',
  },

  // Le dot : cercle extérieur (fond clair) + cercle intérieur (rempli)
  timelineDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5, // aligné avec le texte de la première ligne
    zIndex: 2,
  },
  timelineDotInner: {
    width: DOT_INNER_SIZE,
    height: DOT_INNER_SIZE,
    borderRadius: DOT_INNER_SIZE / 2,
    backgroundColor: colors.dark900,
  },

  // Ligne verticale entre les dots — part du centre du dot actuel
  // vers le centre du dot suivant. flex: 1 remplit l'espace restant.
  timelineLine: {
    width: LINE_WIDTH,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    minHeight: 24,
    zIndex: 1,
  },

  // ═══ CARTE D'ENTRÉE (à droite de la timeline) ═══
  entryCard: {
    flex: 1,
    paddingBottom: 20,
    gap: 4,
  },
  // Dernière carte d'un groupe — moins de padding en bas
  entryCardLast: {
    paddingBottom: 16,
  },

  // Ligne du haut : heure + badge delta
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTime: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 13,
    color: colors.textPlaceholder,
    lineHeight: 18,
  },

  // Badge "+X pages" — fond gris clair avec texte gris
  pagesDeltaBadge: {
    backgroundColor: colors.bgLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pagesDeltaText: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  // Badge négatif (correction de page) — même gris que le positif
  pagesDeltaBadgeNeg: {
    backgroundColor: colors.bgLight,
  },
  pagesDeltaTextNeg: {
    color: colors.textPlaceholder,
  },

  // "Page 142" — le numéro de page atteint, bien visible
  entryPageNumber: {
    fontFamily: 'Rokkitt_SemiBold',
    fontSize: 20,
    color: colors.textTertiary,
    lineHeight: 28,
  },
});
