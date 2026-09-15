/**
 * 📖 NotificationButton Stories
 * 
 * Bouton cloche avec effet 3D (style Button3D secondary)
 * et pastille rouge pour les notifications non lues.
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationButton from './NotificationButton';
import { colors, fonts } from '../../utils/constants';

const meta: Meta<typeof NotificationButton> = {
  title: 'UI/NotificationButton',
  component: NotificationButton,
  argTypes: {
    hasUnread: {
      control: 'boolean',
      description: 'Affiche la pastille rouge (notifications non lues)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationButton>;

/** Sans notification */
export const Default: Story = {
  args: {
    hasUnread: false,
    onPress: () => console.log('Notifications!'),
  },
};

/** Avec notifications non lues (pastille rouge) */
export const WithUnread: Story = {
  args: {
    hasUnread: true,
    onPress: () => console.log('Notifications!'),
  },
};

/** Comparaison côte à côte */
export const Comparison: Story = {
  render: () => (
    <View style={styles.row}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <NotificationButton onPress={() => {}} hasUnread={false} />
        <Text style={styles.label}>Aucune</Text>
      </View>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <NotificationButton onPress={() => {}} hasUnread={true} />
        <Text style={styles.label}>Non lues</Text>
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24 },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.textPlaceholder },
});
