/**
 * 📖 StreakBadge Stories
 * 
 * Badge de streak avec une flamme (icône IconFlame) + nombre de jours.
 * Retourne null si streak === 0 (rien n'est affiché).
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StreakBadge } from './StreakBadge';
import { colors, fonts } from '../../utils/constants';

const meta: Meta<typeof StreakBadge> = {
  title: 'UI/StreakBadge',
  component: StreakBadge,
  argTypes: {
    streak: {
      control: { type: 'range', min: 0, max: 60, step: 1 },
      description: 'Nombre de jours consécutifs de lecture',
    },
    size: {
      control: { type: 'radio' },
      options: ['small', 'medium', 'large'],
      description: 'Taille du badge',
    },
    iconOnly: {
      control: 'boolean',
      description: 'Affiche uniquement les flammes (sans le nombre)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StreakBadge>;

// --- STORIES ---

/** Streak de 5 jours (1 flamme) */
export const Default: Story = {
  args: {
    streak: 5,
    size: 'medium',
  },
};

/** Streak de 0 → composant invisible (retourne null) */
export const ZeroStreak: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>streak=0 → rien n'est affiché :</Text>
      <View style={styles.emptyBox}>
        <StreakBadge streak={0} />
        <Text style={styles.hint}>(le composant retourne null)</Text>
      </View>
    </View>
  ),
};

/** Toutes les tailles */
export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <View style={styles.row}>
        <Text style={styles.label}>small</Text>
        <StreakBadge streak={7} size="small" />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>medium</Text>
        <StreakBadge streak={7} size="medium" />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>large</Text>
        <StreakBadge streak={7} size="large" />
      </View>
    </View>
  ),
};

/** Différentes valeurs de streak */
export const StreakValues: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Text style={styles.sectionTitle}>Différentes durées</Text>
      <View style={styles.row}>
        <Text style={styles.label}>3 jours</Text>
        <StreakBadge streak={3} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>14 jours</Text>
        <StreakBadge streak={14} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>45 jours</Text>
        <StreakBadge streak={45} />
      </View>
    </View>
  ),
};

/** Mode icône seule (sans le nombre) */
export const IconOnly: Story = {
  args: {
    streak: 12,
    iconOnly: true,
    size: 'medium',
  },
};

/** Gamme complète de valeurs */
export const AllValues: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>Gamme complète</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60].map((s) => (
          <StreakBadge key={s} streak={s} size="medium" />
        ))}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPlaceholder,
    width: 160,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSubtle,
    fontStyle: 'italic',
  },
});
