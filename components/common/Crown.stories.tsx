/**
 * 📖 Crown Stories
 * 
 * Couronne dorée 👑 pour le leader du challenge.
 * Trois tailles : small (16px), medium (20px), large (28px).
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Crown } from './Crown';

const meta: Meta<typeof Crown> = {
  title: 'Common/Crown',
  component: Crown,
  argTypes: {
    size: {
      control: { type: 'radio' },
      options: ['small', 'medium', 'large'],
      description: 'Taille de la couronne',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Crown>;

export const Default: Story = {
  args: { size: 'medium' },
};

export const AllSizes: Story = {
  render: () => (
    <View style={styles.row}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <View key={size} style={{ alignItems: 'center', gap: 4 }}>
          <Crown size={size} />
          <Text style={styles.label}>{size}</Text>
        </View>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24, alignItems: 'flex-end' },
  label: { fontFamily: 'WorkSans_400Regular', fontSize: 12, color: '#717680' },
});
