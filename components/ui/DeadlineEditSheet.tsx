/**
 * DeadlineEditSheet
 *
 * Bottom sheet pour modifier la deadline globale du livre.
 * - Titre « La deadline » aligné à gauche
 * - DateTimePicker natif iOS en mode roulette (spinner)
 * - Bouton « Enregistrer »
 *
 * Utilise BottomSheet (custom) pour le glissement-pour-fermer natif et fluide.
 */

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, spacing } from '../../utils/constants';
import Button3D from '../Button3D';
import BottomSheet from './BottomSheet';

interface DeadlineEditSheetProps {
  visible: boolean;
  onClose: () => void;
  currentDate: string | null;
  onSave: (date: Date) => Promise<void>;
}

export default function DeadlineEditSheet({
  visible,
  onClose,
  currentDate,
  onSave,
}: DeadlineEditSheetProps) {
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);

  // Réinitialise la date à chaque ouverture
  useEffect(() => {
    if (visible) {
      if (currentDate) {
        setSelectedDate(new Date(currentDate));
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow);
      }
    }
  }, [visible, currentDate]);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (date) setSelectedDate(date);
  }, []);

  const handleSave = useCallback(async () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);

    if (selectedDay < now) {
      Alert.alert('Date passée', 'La deadline doit être une date future.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(selectedDate);
      onClose();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer la deadline.");
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate, onSave, onClose]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.content, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
        <Text style={styles.title}>La deadline</Text>

        <View style={styles.pickerContainer}>
          {Platform.OS === 'ios' && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              locale="fr-FR"
              textColor={colors.textPrimary}
              style={styles.picker}
            />
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              locale="fr-FR"
            />
          )}
        </View>

        <View style={styles.footer}>
          <Button3D
            onPress={handleSave}
            variant="primary"
            disabled={isSaving}
            style={{ width: '100%' }}
          >
            Enregistrer
          </Button3D>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: 'Rokkitt_Medium',
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: -0.72,
    lineHeight: 44,
    marginBottom: spacing.lg,
    textAlign: 'left',
  },
  pickerContainer: {
    paddingVertical: spacing.md,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  picker: {
    height: 200,
  },
  footer: {
    paddingTop: spacing.lg,
  },
});
