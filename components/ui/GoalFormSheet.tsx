/**
 * Composant GoalFormSheet
 *
 * Bottom sheet modal pour définir un objectif intermédiaire de lecture.
 *
 * Structure :
 * 1. Handle
 * 2. Gros titre « Objectif » (Rokkitt 36px, ferré gauche)
 * 3. Label « Page à atteindre » + input normal (style onboarding/create.tsx)
 * 4. Label « Date butoir » + input pressable qui affiche/masque le DatePicker
 * 5. Bouton « Enregistrer l'objectif »
 *
 * Les inputs reprennent le style exact de onboarding/create.tsx
 * (WorkSans 16px, fond blanc, border, borderRadius.lg, shadows.xs).
 *
 * Le clavier numérique n'a PAS de barre "Done" native (InputAccessoryView vide,
 * même pattern que EditBookSheet, onboarding/pages, onboarding/join, etc.).
 *
 * KeyboardAvoidingView autour du sheet pour que tout remonte au-dessus du clavier.
 */

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChallengeGoal } from '../../types/supabase';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '../../utils/constants';
import Button3D from '../Button3D';

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

// ID unique pour l'InputAccessoryView vide (supprime la barre "Done" iOS)
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Écouter ouverture/fermeture du clavier (même pattern que EditBookSheet)
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  // ─── Handlers ──────────────────────────────────────────

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

  if (!visible) return null;

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

      {/* InputAccessoryView vide : enlève la barre "Done" native sur le clavier chiffres iOS */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View />
        </InputAccessoryView>
      )}

      {/* KeyboardAvoidingView : tout le sheet remonte au-dessus du clavier */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: isKeyboardVisible
                ? 12
                : Math.max(32, insets.bottom + 16),
            },
          ]}
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Gros titre */}
          <Text style={styles.title}>Objectif</Text>

          {/* ── Champ 1 : Page à atteindre ── */}
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

          {/* ── Champ 2 : Date butoir ── */}
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

          {/* Roulette native quand on appuie sur le champ date */}
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

          {/* Bouton */}
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
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    flex: 1,
  },

  // ═══ KEYBOARD + SHEET ═══
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
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

  // ═══ GROS TITRE ═══
  title: {
    fontFamily: 'Rokkitt_Medium',
    fontSize: fontSize['3xl'],
    color: colors.textPrimary,
    letterSpacing: -0.72,
    lineHeight: 44,
    marginBottom: spacing.xl,
    textAlign: 'left',
  },

  // ═══ LABELS ═══
  label: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    lineHeight: 20,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },

  // ═══ INPUT — identique à onboarding/create.tsx ═══
  input: {
    fontFamily: 'WorkSans',
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

  // ═══ INPUT DATE — même look que l'input texte, mais c'est un Pressable ═══
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
    fontFamily: 'WorkSans',
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular as any,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // ═══ DATE PICKER ═══
  pickerContainer: {
    marginBottom: spacing.sm,
  },
  picker: {
    height: 150,
  },

  // ═══ FOOTER ═══
  footer: {
    paddingTop: spacing.lg,
  },
});
