/**
 * 📖 ProgressBar Stories
 * 
 * Barre de progression animée avec spring animation.
 * Utilisée pour afficher la progression de lecture de chaque participant.
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from './ProgressBar';
import { colors, fonts } from '../../utils/constants';

const meta: Meta<typeof ProgressBar> = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  argTypes: {
    percentage: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Pourcentage de progression (0-100)',
    },
    height: {
      control: { type: 'range', min: 4, max: 20, step: 1 },
      description: 'Hauteur de la barre en pixels',
    },
    color: {
      control: 'color',
      description: 'Couleur de remplissage',
    },
    showPercentage: {
      control: 'boolean',
      description: 'Affiche le pourcentage à droite',
    },
    animated: {
      control: 'boolean',
      description: 'Animation au montage (spring)',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

// --- STORIES ---

/** Progression standard (65%) */
export const Default: Story = {
  args: {
    percentage: 65,
    height: 8,
    showPercentage: false,
    animated: true,
  },
};

/** Avec affichage du pourcentage */
export const WithPercentage: Story = {
  args: {
    percentage: 42,
    height: 8,
    showPercentage: true,
    animated: true,
  },
};

/** Progression du leader (couleur couronne dorée) */
export const LeaderProgress: Story = {
  args: {
    percentage: 78,
    height: 8,
    color: colors.crown,
    showPercentage: true,
    animated: true,
  },
};

/** Barre fine (4px) */
export const Thin: Story = {
  args: {
    percentage: 55,
    height: 4,
    showPercentage: false,
    animated: true,
  },
};

/** Barre épaisse (16px) */
export const Thick: Story = {
  args: {
    percentage: 80,
    height: 16,
    showPercentage: true,
    animated: true,
  },
};

/** Toutes les étapes de progression */
export const AllStages: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      {[0, 10, 25, 50, 75, 90, 100].map((pct) => (
        <View key={pct}>
          <Text style={styles.label}>{pct}%</Text>
          <ProgressBar percentage={pct} height={8} showPercentage animated />
        </View>
      ))}
    </View>
  ),
};

/** Comparaison des couleurs sémantiques */
export const ColorVariants: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={styles.label}>Primary (défaut)</Text>
        <ProgressBar percentage={70} height={8} showPercentage animated />
      </View>
      <View>
        <Text style={styles.label}>Crown (leader)</Text>
        <ProgressBar percentage={70} height={8} color={colors.crown} showPercentage animated />
      </View>
      <View>
        <Text style={styles.label}>Success</Text>
        <ProgressBar percentage={70} height={8} color={colors.success} showPercentage animated />
      </View>
      <View>
        <Text style={styles.label}>Streak</Text>
        <ProgressBar percentage={70} height={8} color={colors.streak} showPercentage animated />
      </View>
      <View>
        <Text style={styles.label}>Warning</Text>
        <ProgressBar percentage={70} height={8} color={colors.warning} showPercentage animated />
      </View>
    </View>
  ),
};

/** Sans animation */
export const NoAnimation: Story = {
  args: {
    percentage: 50,
    height: 8,
    showPercentage: true,
    animated: false,
  },
};

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textPlaceholder,
    marginBottom: 4,
  },
});
