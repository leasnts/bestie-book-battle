/**
 * Composant GoalFormSheet
 *
 * Bottom sheet modal pour définir un objectif intermédiaire de lecture.
 *
 * Structure :
 * 1. Gros titre « Objectif »
 * 2. Label « Page à atteindre » + input
 * 3. Label « Date butoir » + input pressable → DatePicker
 * 4. Bouton « Enregistrer l'objectif »
 *
 * Utilise BottomSheet (custom) pour le glissement-pour-fermer natif.
 * Le handle du BottomSheet est la zone de drag — les inputs en dessous
 * gardent leur comportement normal sans conflit.
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChallengeGoal } from '../../types/supabase';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '../../utils/constants';
import Button3D from '../Button3D';
import BottomSheet from './BottomSheet';

// ─── Props ───────────────────────────────────────────────────────────

interface GoalFormSheetProps {
  visible: boolean;
  onClose: () => void;
  currentGoal: ChallengeGoal | null;
  primaryGoal?: ChallengeGoal | null;
  history?: ChallengeGoal[];
  onSaveGoal: (type: 'primary' | 'secondary', targetPages: number, deadline: Date) => void;
  totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getDefaultDeadline(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MOIS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];
function formatDateLabel(d: Date): string {
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

// ID pour supprimer la barre "Done" native du clavier numérique iOS
const ACCESSORY_ID = 'goal-pages-empty';

// ─── Composant ───────────────────────────────────────────────────────

export default function GoalFormSheet({
  visible,
  onClose,
  currentGoal,
  onSaveGoal,
  totalPages,
}: GoalFormSheetProps) {
  const insets = useSafeAreaInsets();
  const pageInputRef = useRef<TextInput>(null);

  const [targetPage, setTargetPage] = useState('');
  const [deadline, setDeadline] = useState<Date>(getDefaultDeadline());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Réinitialise les champs à chaque ouverture
  useEffect(() => {
    if (visible) {
      setTargetPage(currentGoal?.target_pages?.toString() || '');
      setDeadline(
        currentGoal?.deadline ? new Date(currentGoal.deadline) : getDefaultDeadline()
      );
      setShowDatePicker(false);
    }
  }, [visible, currentGoal]);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setDeadline(date);
  }, []);

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();

    const pages = parseInt(targetPage, 10);
    if (!pages || pages <= 0) {
      Alert.alert('Erreur', 'Entre un numéro de page valide.');
      return;
    }
    if (pages > totalPages) {
      Alert.alert(
        'Erreur',
        `Le livre fait ${totalPages} pages, l'objectif ne peut pas dépasser ce nombre.`
      );
      return;
    }

    setIsSaving(true);
    try {
      onSaveGoal('secondary', pages, deadline);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [targetPage, deadline, totalPages, onSaveGoal, onClose]);

  return (
    <>
      {/* Supprime la barre "Done" native sur le clavier numérique iOS */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View />
        </InputAccessoryView>
      )}

      <BottomSheet visible={visible} onClose={onClose}>
        <View style={[styles.content, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Objectif</Text>
            <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
              <Ionicons name="close" size={22} color={colors.textSubtle} />
            </Pressable>
          </View>

          <Text style={styles.label}>Page à atteindre</Text>
          <TextInput
            ref={pageInputRef}
            style={styles.input}
            placeholder={`Ex : ${Math.min(totalPages, 100)}`}
            placeholderTextColor={colors.textPlaceholder}
            value={targetPage}
            onChangeText={setTargetPage}
            keyboardType="number-pad"
            inputAccessoryViewID={ACCESSORY_ID}
            onFocus={() => setShowDatePicker(false)}
          />

          <Text style={styles.label}>Date butoir</Text>
          <Pressable
            style={styles.dateInput}
            onPress={() => {
              Keyboard.dismiss();
              setShowDatePicker((prev) => !prev);
            }}
          >
            <Text style={styles.dateInputText}>{formatDateLabel(deadline)}</Text>
          </Pressable>

          {showDatePicker && (
            <View style={styles.pickerContainer}>
              {Platform.OS === 'ios' && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                  locale="fr-FR"
                  textColor={colors.textPrimary}
                  style={styles.picker}
                />
              )}
              {Platform.OS === 'android' && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                  locale="fr-FR"
                />
              )}
            </View>
          )}

          <View style={styles.footer}>
            <Button3D
              onPress={handleSave}
              variant="primary"
              disabled={isSaving}
              style={{ width: '100%' }}
            >
              Enregistrer l'objectif
            </Button3D>
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  title: {
    flex: 1,
    fontFamily: 'Rokkitt_500Medium',
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: -0.72,
    lineHeight: 44,
    textAlign: 'left',
  },
  closeBtn: { padding: 4 },
  label: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    lineHeight: 20,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  input: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular as any,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    letterSpacing: -0.3,
    ...shadows.xs,
    textAlignVertical: 'center',
    marginBottom: spacing.lg,
  },
  dateInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    ...shadows.xs,
    marginBottom: spacing.sm,
  },
  dateInputText: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular as any,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  pickerContainer: {
    marginBottom: spacing.sm,
  },
  picker: {
    height: 150,
  },
  footer: {
    paddingTop: spacing.lg,
  },
});
