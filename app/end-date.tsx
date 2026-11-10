/**
 * Route /end-date — changer la date de fin du livre.
 *
 * Sheet natif (`SheetPage`), ouvert en touchant la date de fin de la fiche du
 * livre (`?from=book`) : il se pose dessus, et un retour y ramène.
 * La date s'enregistre directement dans le store du livre.
 *
 * Elle est facultative : on peut lire sans se fixer de fin. « Sans date de
 * fin » l'efface, et l'accueil perd alors son J-x et sa date sous la piste.
 */

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Button3D from '../components/Button3D';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { useProjectStore } from '../stores/projectStore';
import { colors } from '../utils/constants';
import { nudge, oops } from '../utils/notice';

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

export default function EndDateRoute() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const currentDate = useProjectStore((s) => s.activeChallenge?.target_end_date ?? null);
  const updateActiveChallenge = useProjectStore((s) => s.updateActiveChallenge);

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    currentDate ? new Date(currentDate) : tomorrow(),
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (date) setSelectedDate(date);
  }, []);

  const handleSave = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(selectedDate);
    day.setHours(0, 0, 0, 0);
    if (day < today) {
      nudge('Cette date est passée', "Choisis aujourd'hui ou plus tard");
      return;
    }

    setIsSaving(true);
    try {
      await updateActiveChallenge({ target_end_date: selectedDate.toISOString() });
      router.back();
    } catch (error) {
      oops('Date pas enregistrée', error, { retry: () => handleSave() });
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate, updateActiveChallenge, router]);

  const handleClear = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateActiveChallenge({ target_end_date: null });
      router.back();
    } catch (error) {
      oops('Date toujours là', error, { retry: () => handleClear() });
    } finally {
      setIsSaving(false);
    }
  }, [updateActiveChallenge, router]);

  return (
    <SheetPage title="Date de fin" onBack={from ? () => router.back() : undefined}>
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display="spinner"
        minimumDate={new Date()}
        onChange={handleDateChange}
        locale="fr-FR"
        textColor={colors.textPrimary}
        style={styles.picker}
      />

      <SheetFooter>
        <Button3D onPress={handleSave} variant="primary" loading={isSaving}>
          Enregistrer
        </Button3D>

        {currentDate && (
          <Button3D onPress={handleClear} variant="secondary" disabled={isSaving}>
            Sans date de fin
          </Button3D>
        )}
      </SheetFooter>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  picker: {
    height: 200,
    alignSelf: 'center',
  },
});
