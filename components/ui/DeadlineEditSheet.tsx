/**
 * DeadlineEditSheet
 *
 * Bottom sheet pour modifier la deadline globale du livre.
 * - Titre « La deadline » aligné à gauche
 * - DateTimePicker natif iOS en mode roulette (spinner)
 * - Bouton « Enregistrer »
 */

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, spacing } from '../../utils/constants';
import Button3D from '../Button3D';

interface DeadlineEditSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Date actuelle (ISO) ou null */
  currentDate: string | null;
  /** Callback avec la nouvelle date en ISO */
  onSave: (date: Date) => Promise<void>;
}

export default function DeadlineEditSheet({
  visible,
  onClose,
  currentDate,
  onSave,
}: DeadlineEditSheetProps) {
  // Safe area insets pour respecter la zone sûre iOS en bas
  const insets = useSafeAreaInsets();
  
  // État pour la date sélectionnée
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);

  // Initialiser la date au montage / quand currentDate change
  useEffect(() => {
    if (currentDate) {
      setSelectedDate(new Date(currentDate));
    } else {
      // Par défaut : demain
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow);
    }
  }, [visible, currentDate]);

  // Callback quand l'utilisateur change la date dans le picker
  const handleDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  const handleSave = useCallback(async () => {
    // Vérifier que la date est dans le futur
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time pour comparer juste les jours
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
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la deadline.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate, onSave, onClose]);

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

      <Animated.View
        style={[styles.sheet, { paddingBottom: Math.max(32, insets.bottom + 16) }]}
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(200)}
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

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
      </Animated.View>
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
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // paddingBottom est maintenant dynamique via le style inline (safe area)
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
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: -0.72,
    lineHeight: 44,
    marginBottom: spacing.lg,
    textAlign: 'left', // Aligné à gauche comme demandé
  },
  pickerContainer: {
    // Centre la roulette horizontalement sur la modal
    paddingVertical: spacing.md,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center', // Centre la roulette horizontalement
  },
  picker: {
    // La roulette prend sa largeur naturelle et est centrée
    height: 200,
  },
  footer: {
    paddingTop: spacing.lg,
  },
});
