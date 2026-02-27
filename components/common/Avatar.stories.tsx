/**
 * 📖 Avatar Stories
 * 
 * Affiche la photo de profil ou les initiales de l'utilisateur.
 * Couleur de fond générée automatiquement à partir du nom.
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Common/Avatar',
  component: Avatar,
  argTypes: {
    name: {
      control: 'text',
      description: "Nom de l'utilisateur (pour les initiales)",
    },
    size: {
      control: { type: 'range', min: 24, max: 96, step: 4 },
      description: 'Taille en pixels',
    },
    photoUrl: {
      control: 'text',
      description: 'URL de la photo de profil',
    },
    borderWidth: {
      control: { type: 'range', min: 0, max: 4, step: 1 },
      description: 'Épaisseur de la bordure',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// --- STORIES ---

/** Avatar avec initiales (pas de photo) */
export const WithInitials: Story = {
  args: {
    name: 'Léa Santos',
    size: 48,
  },
};

/** Avatar avec photo URL */
export const WithPhoto: Story = {
  args: {
    name: 'Zoé Martin',
    photoUrl: 'https://i.pravatar.cc/150?u=zoe',
    size: 48,
  },
};

/** Avec bordure (utilisateur courant) */
export const WithBorder: Story = {
  args: {
    name: 'Léa Santos',
    size: 48,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
};

/** Différentes tailles */
export const Sizes: Story = {
  render: () => (
    <View style={styles.row}>
      {[24, 32, 40, 48, 56, 64, 80].map((s) => (
        <View key={s} style={{ alignItems: 'center', gap: 4 }}>
          <Avatar name="Léa Santos" size={s} />
          <Text style={styles.sizeLabel}>{s}px</Text>
        </View>
      ))}
    </View>
  ),
};

/** Couleurs auto-générées — chaque nom produit une couleur différente */
export const AutoColors: Story = {
  render: () => (
    <View style={styles.row}>
      {['Léa', 'Zoé', 'Marie', 'Hugo', 'Tom', 'Jade', 'Paul', 'Emma'].map((name) => (
        <View key={name} style={{ alignItems: 'center', gap: 4 }}>
          <Avatar name={name} size={48} />
          <Text style={styles.nameLabel}>{name}</Text>
        </View>
      ))}
    </View>
  ),
};

/** Un seul mot → 2 premières lettres */
export const SingleName: Story = {
  args: {
    name: 'Zoé',
    size: 48,
  },
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-end',
  },
  sizeLabel: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 11,
    color: '#717680',
  },
  nameLabel: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 12,
    color: '#414651',
  },
});
