/**
 * DeadlineEditSheet
 *
 * Bottom sheet simple pour modifier la deadline globale du livre.
 * - Titre « La deadline »
 * - Input texte au format JJ/MM/AAAA (style onboarding)
 * - Bouton « Enregistrer »
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
import { borderRadius, colors, fontSize, spacing } from '../../utils/constants';
import Button3D from '../Button3D';

interface DeadlineEditSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Date actuelle (ISO) ou null */
  currentDate: string | null;
  /** Callback avec la nouvelle date en ISO */
  onSave: (date: Date) => Promise<void>;
}

/** Parse JJ/MM/AAAA en Date. Retourne null si invalide. */
function parseDDMMYYYY(input: string): Date | null {
  const trimmed = input.trim().replace(/\s/g, '');
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return null;
  }
  return d;
}

/** Formate une Date en JJ/MM/AAAA */
function formatToDDMMYYYY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function DeadlineEditSheet({
  visible,
  onClose,
  currentDate,
  onSave,
}: DeadlineEditSheetProps) {
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pré-remplir au montage / quand currentDate change
  useEffect(() => {
    if (currentDate) {
      setValue(formatToDDMMYYYY(new Date(currentDate)));
    } else {
      setValue('');
    }
  }, [visible, currentDate]);

  const handleSave = useCallback(async () => {
    const parsed = parseDDMMYYYY(value);
    if (!parsed) {
      Alert.alert('Format invalide', 'Entre une date au format JJ/MM/AAAA (ex: 01/03/2026)');
      return;
    }
    if (parsed < new Date()) {
      Alert.alert('Date passée', 'La deadline doit être une date future.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(parsed);
      onClose();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la deadline.');
    } finally {
      setIsSaving(false);
    }
  }, [value, onSave, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <Animated.View
          style={styles.sheet}
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.title}>La deadline</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder="01/03/2026"
              placeholderTextColor={colors.textSubtle}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          <View style={styles.footer}>
            <Button3D
              onPress={handleSave}
              variant="primary"
              disabled={!value.trim() || isSaving}
              style={{ width: '100%' }}
            >
              Enregistrer
            </Button3D>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
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
  title: {
    fontFamily: 'Rokkitt_Medium',
    fontSize: fontSize['3xl'],
    color: colors.textPrimary,
    letterSpacing: -0.72,
    lineHeight: 44,
    marginBottom: spacing['2xl'],
    textAlign: 'center',
  },
  inputContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing['4xl'],
    paddingVertical: spacing['2xl'],
  },
  input: {
    fontFamily: 'Rokkitt_Bold',
    fontSize: fontSize['5xl'],
    color: colors.textPrimary,
    letterSpacing: -1.2,
    textAlign: 'center',
    textAlignVertical: 'center',
    width: '100%',
    backgroundColor: 'transparent',
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
  },
  footer: {
    paddingTop: spacing.lg,
  },
});
