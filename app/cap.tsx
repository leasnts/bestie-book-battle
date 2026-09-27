/**
 * Route /cap — poser un cap, ou modifier celui qu'on touche (`?id=<goal>`).
 *
 * Sheet natif (`SheetPage`), posé sur la fiche du livre (`?from=book`) : un
 * retour y ramène. Le cap s'enregistre directement dans le store des caps.
 *
 * - Page à atteindre, dans l'édition de référence du livre ;
 * - Date butoir, avec la roulette d'iOS qui s'ouvre sous le champ ;
 * - Supprimer : seulement pour un cap existant, et si on en a le droit (la
 *   personne qui l'a posé, ou l'admin du livre).
 */

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2Icon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Button3D from '../components/Button3D';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { useAuthStore } from '../stores/authStore';
import { useGoalStore } from '../stores/goalStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import { borderRadius, colors, fonts, fontSize, shadows, spacing } from '../utils/constants';
import { confirmDeleteCap } from '../utils/confirmDeleteCap';

function inAWeek(): Date {
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

// Retire la barre « OK » native au-dessus du clavier numérique d'iOS
const ACCESSORY_ID = 'cap-pages-empty';

export default function CapRoute() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id?: string; from?: string }>();
  const user = useAuthStore((s) => s.user);
  const activeChallenge = useProjectStore((s) => s.activeChallenge);
  const participants = useProgressStore((s) => s.participants);
  const { secondaryGoal, history, addGoal, editGoal, removeGoal } = useGoalStore();

  /** Le cap qu'on modifie, ou `null` pour en poser un */
  const goal = useMemo(
    () => (id ? [secondaryGoal, ...history].find((g) => g?.id === id) ?? null : null),
    [id, secondaryGoal, history],
  );
  const totalPages = activeChallenge?.total_pages ?? 0;
  const isAdmin = !!user?.id && activeChallenge?.admin_id === user.id;
  const canDelete = !!goal && (goal.created_by === user?.id || isAdmin);

  const [targetPage, setTargetPage] = useState(() => goal?.target_pages?.toString() ?? '');
  const [deadline, setDeadline] = useState<Date>(() =>
    goal?.deadline ? new Date(goal.deadline) : inAWeek(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDeadline(date);
  }, []);

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    if (!activeChallenge || !user?.id) return;

    const pages = parseInt(targetPage, 10);
    if (!pages || pages <= 0) {
      Alert.alert('Erreur', 'Entre un numéro de page valide.');
      return;
    }
    if (pages > totalPages) {
      Alert.alert('Erreur', `Le livre fait ${totalPages} pages, le cap ne peut pas dépasser ce nombre.`);
      return;
    }

    // La baseline sert à mesurer le chemin parcouru depuis la pose du cap
    const baseline =
      participants.length > 0
        ? Math.round(
            participants.reduce((sum, p) => sum + (p.progress?.current_page ?? 0), 0) /
              participants.length,
          )
        : 0;

    setIsSaving(true);
    try {
      if (goal) {
        await editGoal(goal.id, {
          target_pages: pages,
          deadline: deadline.toISOString(),
          results: { baseline },
        });
      } else {
        await addGoal({
          challenge_id: activeChallenge.id,
          type: 'secondary',
          target_pages: pages,
          deadline: deadline.toISOString(),
          created_by: user.id,
          results: { baseline },
        });
      }
      router.back();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer le cap.");
    } finally {
      setIsSaving(false);
    }
  }, [activeChallenge, user?.id, targetPage, totalPages, participants, goal, deadline, editGoal, addGoal, router]);

  const handleDelete = useCallback(() => {
    if (!goal) return;
    confirmDeleteCap(() => {
      removeGoal(goal.id);
      router.back();
    });
  }, [goal, removeGoal, router]);

  return (
    <SheetPage title="Cap" onBack={from ? () => router.back() : undefined}>
      <InputAccessoryView nativeID={ACCESSORY_ID}>
        <View />
      </InputAccessoryView>

      <Text style={styles.label}>Page à atteindre</Text>
      <TextInput
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
        style={styles.input}
        onPress={() => {
          Keyboard.dismiss();
          setShowDatePicker((prev) => !prev);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Date butoir : ${formatDateLabel(deadline)}`}
      >
        <Text style={styles.dateText}>{formatDateLabel(deadline)}</Text>
      </Pressable>

      {showDatePicker && (
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

      <SheetFooter>
        <Button3D onPress={handleSave} variant="primary" loading={isSaving}>
          Enregistrer
        </Button3D>

        {canDelete && (
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            style={({ pressed }) => [styles.delete, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Supprimer le cap"
          >
            <Trash2Icon size={16} color={colors.accent} strokeWidth={2.2} />
            <Text style={styles.deleteText}>Supprimer le cap</Text>
          </Pressable>
        )}
      </SheetFooter>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  picker: {
    height: 150,
    alignSelf: 'center',
  },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  deleteText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.accent,
  },
});
