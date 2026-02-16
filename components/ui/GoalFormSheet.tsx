/**
 * Composant GoalFormSheet
 *
 * Bottom sheet modal pour créer/modifier des objectifs de lecture.
 * Deux onglets :
 * - "Objectif" : définir un objectif secondaire (pages + deadline)
 * - "Historique" : voir les objectifs passés et leur résultat
 *
 * N'importe quel participant du challenge peut créer ou modifier un objectif.
 * Quand on crée un nouvel objectif secondaire, l'ancien est archivé automatiquement.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChallengeGoal } from '../../types/supabase';
import { borderRadius, colors, spacing } from '../../utils/constants';
import Button3D from '../Button3D';

// ─── Props ───────────────────────────────────────────────────────────

interface GoalFormSheetProps {
  visible: boolean;
  onClose: () => void;
  /** L'objectif secondaire actuel (pour pré-remplir le formulaire) */
  currentGoal: ChallengeGoal | null;
  /** L'objectif principal actuel (deadline du livre) */
  primaryGoal: ChallengeGoal | null;
  /** Historique des objectifs passés */
  history: ChallengeGoal[];
  /** Callback pour créer/modifier un objectif */
  onSaveGoal: (type: 'primary' | 'secondary', targetPages: number, deadline: Date) => void;
  /** Nombre total de pages du livre */
  totalPages: number;
}

// ─── Onglets ──────────────────────────────────────────────────────

type Tab = 'form' | 'history';

// ─── Helpers ──────────────────────────────────────────────────────

const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MOIS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

// ─── Composant principal ──────────────────────────────────────────

export default function GoalFormSheet({
  visible,
  onClose,
  currentGoal,
  primaryGoal,
  history,
  onSaveGoal,
  totalPages,
}: GoalFormSheetProps) {
  const [activeTab, setActiveTab] = useState<Tab>('form');

  // Formulaire : objectif secondaire
  const [targetPages, setTargetPages] = useState(
    currentGoal?.target_pages?.toString() || ''
  );
  const [deadline, setDeadline] = useState<Date>(
    currentGoal?.deadline ? new Date(currentGoal.deadline) : getDefaultDeadline()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Formulaire : objectif principal (deadline du livre)
  const [primaryDeadline, setPrimaryDeadline] = useState<Date>(
    primaryGoal?.deadline ? new Date(primaryGoal.deadline) : getDefaultPrimaryDeadline()
  );
  const [showPrimaryDatePicker, setShowPrimaryDatePicker] = useState(false);

  /** Deadline par défaut : dans 7 jours */
  function getDefaultDeadline(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }

  /** Deadline primaire par défaut : dans 30 jours */
  function getDefaultPrimaryDeadline(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }

  // ─── Handlers ──────────────────────────────────────────

  const handleSaveSecondary = useCallback(() => {
    const pages = parseInt(targetPages, 10);
    if (!pages || pages <= 0) {
      Alert.alert('Erreur', 'Entre un nombre de pages valide.');
      return;
    }
    if (pages > totalPages) {
      Alert.alert('Erreur', `L'objectif ne peut pas dépasser ${totalPages} pages.`);
      return;
    }
    onSaveGoal('secondary', pages, deadline);
    onClose();
  }, [targetPages, deadline, totalPages, onSaveGoal, onClose]);

  const handleSavePrimary = useCallback(() => {
    onSaveGoal('primary', totalPages, primaryDeadline);
    onClose();
  }, [totalPages, primaryDeadline, onSaveGoal, onClose]);

  const handleDateChange = useCallback((_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDeadline(selectedDate);
  }, []);

  const handlePrimaryDateChange = useCallback((_: any, selectedDate?: Date) => {
    setShowPrimaryDatePicker(Platform.OS === 'ios');
    if (selectedDate) setPrimaryDeadline(selectedDate);
  }, []);

  // ─── Rendu ──────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Overlay sombre */}
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={styles.sheet}
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(200)}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Titre */}
        <Text style={styles.title}>Objectifs de lecture</Text>

        {/* Onglets */}
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setActiveTab('form')}
            style={[styles.tab, activeTab === 'form' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'form' && styles.tabTextActive]}>
              Objectif
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('history')}
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Historique
            </Text>
          </Pressable>
        </View>

        {/* ── Onglet Formulaire ── */}
        {activeTab === 'form' && (
          <View style={styles.formContent}>
            {/* Section : Objectif secondaire (hebdomadaire) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flag-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.sectionTitle}>Objectif temporaire</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Fixe un nombre de pages à atteindre avant une date.
              </Text>

              {/* Input : nombre de pages */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Pages à lire</Text>
                <TextInput
                  style={styles.input}
                  value={targetPages}
                  onChangeText={setTargetPages}
                  keyboardType="number-pad"
                  placeholder="Ex: 100"
                  placeholderTextColor={colors.textSubtle}
                />
              </View>

              {/* Input : deadline */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Deadline</Text>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
                  <Text style={styles.dateButtonText}>
                    {JOURS[deadline.getDay()]} {deadline.getDate()} {MOIS[deadline.getMonth()]}
                  </Text>
                </Pressable>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                  locale="fr-FR"
                />
              )}

              <Button3D
                onPress={handleSaveSecondary}
                variant="primary"
                style={{ width: '100%', marginTop: spacing.md }}
              >
                {currentGoal ? 'Modifier l\'objectif' : 'Définir l\'objectif'}
              </Button3D>
            </View>

            {/* Séparateur */}
            <View style={styles.divider} />

            {/* Section : Deadline principale (finir le livre) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.sectionTitle}>Deadline du livre</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Date butoir pour finir le livre entier ({totalPages} pages).
              </Text>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Finir avant le</Text>
                <Pressable
                  onPress={() => setShowPrimaryDatePicker(true)}
                  style={styles.dateButton}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
                  <Text style={styles.dateButtonText}>
                    {JOURS[primaryDeadline.getDay()]} {primaryDeadline.getDate()} {MOIS[primaryDeadline.getMonth()]}
                  </Text>
                </Pressable>
              </View>

              {showPrimaryDatePicker && (
                <DateTimePicker
                  value={primaryDeadline}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={handlePrimaryDateChange}
                  locale="fr-FR"
                />
              )}

              <Button3D
                onPress={handleSavePrimary}
                variant="secondary"
                style={{ width: '100%', marginTop: spacing.md }}
              >
                {primaryGoal ? 'Modifier la deadline' : 'Définir la deadline'}
              </Button3D>
            </View>
          </View>
        )}

        {/* ── Onglet Historique ── */}
        {activeTab === 'history' && (
          <View style={styles.historyContent}>
            {history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="time-outline" size={32} color={colors.textSubtle} />
                <Text style={styles.emptyHistoryText}>
                  Aucun objectif passé pour l'instant
                </Text>
              </View>
            ) : (
              history.map((goal) => (
                <View key={goal.id} style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyDate}>{formatDate(goal.created_at)}</Text>
                    <Text style={styles.historyTarget}>
                      {goal.target_pages}p — {formatDate(goal.deadline)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.historyBadge,
                      goal.status === 'completed'
                        ? styles.historyBadgeSuccess
                        : styles.historyBadgeFail,
                    ]}
                  >
                    <Ionicons
                      name={goal.status === 'completed' ? 'checkmark' : 'close'}
                      size={14}
                      color={goal.status === 'completed' ? '#16a34a' : colors.error}
                    />
                    <Text
                      style={[
                        styles.historyBadgeText,
                        goal.status === 'completed'
                          ? styles.historyBadgeTextSuccess
                          : styles.historyBadgeTextFail,
                      ]}
                    >
                      {goal.status === 'completed' ? 'Réussi' : 'Raté'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSubtle,
    borderRadius: 9999,
  },
  title: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  // ═══ ONGLETS ═══
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 14,
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontFamily: 'WorkSans_600SemiBold',
  },

  // ═══ FORMULAIRE ═══
  formContent: {
    paddingHorizontal: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  sectionDesc: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputLabel: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  input: {
    flex: 1,
    maxWidth: 120,
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'right',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateButtonText: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // ═══ HISTORIQUE ═══
  historyContent: {
    paddingHorizontal: 24,
    gap: 8,
    paddingBottom: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  historyItemLeft: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  historyTarget: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyBadgeSuccess: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  historyBadgeFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  historyBadgeText: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  historyBadgeTextSuccess: {
    color: '#16a34a',
  },
  historyBadgeTextFail: {
    color: colors.error,
  },
});
