/**
 * Route /carnet-filter — filtrer le carnet : par personne, par thème.
 *
 * Sheet natif posé sur le carnet. On coche autant qu'on veut : plusieurs
 * personnes, plusieurs thèmes, les deux ensemble. Le carnet suit à chaque
 * coche ; « Voir les notes » referme le sheet en disant combien il en reste.
 * Chaque choix revient en badge ✕ sous « Filtrer ».
 */

import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button3D from '../components/Button3D';
import ChoiceRow from '../components/ui/ChoiceRow';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { useAnnotationStore } from '../stores/annotationStore';
import { useAuthStore } from '../stores/authStore';
import { filterNotes, useCarnetViewStore } from '../stores/carnetViewStore';
import { useProgressStore } from '../stores/progressStore';
import { ANNOTATION_CATEGORIES, CATEGORY_ORDER } from '../utils/annotations';
import { colors, fonts, spacing } from '../utils/constants';

const DEFAULT_AVATAR = require('../assets/images/profile_picture_default.png');

export default function CarnetFilterRoute() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const me = useAuthStore((s) => s.user?.id);
  const participants = useProgressStore((s) => s.participants);
  const notes = useAnnotationStore((s) => s.notes);
  const people = useCarnetViewStore((s) => s.people);
  const categories = useCarnetViewStore((s) => s.categories);
  const togglePerson = useCarnetViewStore((s) => s.togglePerson);
  const toggleCategory = useCarnetViewStore((s) => s.toggleCategory);

  // Moi d'abord, puis le groupe
  const members = useMemo(
    () =>
      [...participants]
        .sort((a, b) => (a.user.id === me ? -1 : b.user.id === me ? 1 : 0))
        .map((p) => ({
          id: p.user.id,
          name: p.user.id === me ? 'Moi' : p.user.first_name || 'Participant',
          photo: p.user.profile_photo_url,
        })),
    [participants, me],
  );
  const count = filterNotes(notes, people, categories).length;

  return (
    <SheetPage title="Filtrer" onBack={from ? () => router.back() : undefined}>
      <Text style={styles.section}>Qui</Text>
      {members.map((member) => (
        <ChoiceRow
          key={member.id}
          label={member.name}
          leading={<Image source={member.photo ? { uri: member.photo } : DEFAULT_AVATAR} style={styles.avatar} />}
          selected={people.includes(member.id)}
          onPress={() => togglePerson(member.id)}
        />
      ))}

      <Text style={[styles.section, styles.sectionNext]}>Thème</Text>
      {CATEGORY_ORDER.map((key) => (
        <ChoiceRow
          key={key}
          label={ANNOTATION_CATEGORIES[key].label}
          leading={<View style={[styles.swatch, { backgroundColor: ANNOTATION_CATEGORIES[key].color }]} />}
          selected={categories.includes(key)}
          onPress={() => toggleCategory(key)}
        />
      ))}

      <SheetFooter>
        <Button3D onPress={() => router.back()} variant="primary" disabled={count === 0}>
          {count === 0 ? 'Aucune note' : `Voir ${count} note${count > 1 ? 's' : ''}`}
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  section: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  sectionNext: {
    marginTop: spacing.xl,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
});
