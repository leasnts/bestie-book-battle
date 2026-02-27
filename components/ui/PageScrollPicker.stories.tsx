/**
 * 📖 PageScrollPicker Stories
 * 
 * Sélecteur de page horizontal avec scroll fluide et snap.
 * Le numéro central est en grand (128px), les adjacents en petit (72px).
 * adjustsFontSizeToFit gère les grands nombres (3-4 chiffres).
 */
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PageScrollPicker from './PageScrollPicker';

const meta: Meta<typeof PageScrollPicker> = {
  title: 'UI/PageScrollPicker',
  component: PageScrollPicker,
  argTypes: {
    totalPages: {
      control: { type: 'range', min: 50, max: 1000, step: 10 },
      description: 'Nombre total de pages du livre',
    },
    currentPage: {
      control: { type: 'range', min: 0, max: 500, step: 1 },
      description: 'Page actuellement sélectionnée',
    },
    savedPage: {
      control: { type: 'range', min: 0, max: 500, step: 1 },
      description: 'Dernière page enregistrée',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageScrollPicker>;

/** Picker par défaut — livre de 186 pages, page 120 */
export const Default: Story = {
  args: {
    totalPages: 186,
    currentPage: 120,
    savedPage: 120,
    onPageChange: (page: number) => console.log('Page:', page),
  },
};

/** Début de lecture (page 1) */
export const Beginning: Story = {
  args: {
    totalPages: 186,
    currentPage: 1,
    savedPage: 0,
    onPageChange: (page: number) => console.log('Page:', page),
  },
};

/** Livre long (1000+ pages) — test adjustsFontSizeToFit */
export const LongBook: Story = {
  args: {
    totalPages: 987,
    currentPage: 456,
    savedPage: 456,
    onPageChange: (page: number) => console.log('Page:', page),
  },
};

/** Presque fini */
export const AlmostDone: Story = {
  args: {
    totalPages: 186,
    currentPage: 180,
    savedPage: 175,
    onPageChange: (page: number) => console.log('Page:', page),
  },
};

/** Interactif — avec state */
export const Interactive: Story = {
  render: () => {
    const [page, setPage] = useState(120);
    return (
      <View style={{ gap: 16 }}>
        <PageScrollPicker
          totalPages={186}
          currentPage={page}
          savedPage={100}
          onPageChange={setPage}
        />
        <Text style={styles.debug}>
          Page sélectionnée : {page}
        </Text>
      </View>
    );
  },
};

const styles = StyleSheet.create({
  debug: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 14,
    color: '#414651',
    textAlign: 'center',
  },
});
