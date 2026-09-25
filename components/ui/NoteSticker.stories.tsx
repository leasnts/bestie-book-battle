/**
 * 📖 NoteSticker Stories
 *
 * L'autocollant brodé d'une note du carnet : les six catégories, la note
 * verrouillée, et la pile en déco comme sur la tuile Carnet de la fiche du livre.
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, shadows } from '../../utils/constants';
import { ANNOTATION_CATEGORIES, CATEGORY_ORDER } from '../../utils/annotations';
import NoteSticker from './NoteSticker';

const meta: Meta<typeof NoteSticker> = {
  title: 'Carnet/NoteSticker',
  component: NoteSticker,
};
export default meta;

type Story = StoryObj<typeof NoteSticker>;

/** Une catégorie = une couleur ; la dernière est une note verrouillée */
export const Categories: Story = {
  render: () => (
    <View style={styles.grid}>
      {CATEGORY_ORDER.map((category) => (
        <View key={category} style={styles.cell}>
          <View style={shadows.xs}>
            <NoteSticker id={category} color={ANNOTATION_CATEGORIES[category].color} size={56} />
          </View>
          <Text style={styles.label}>{ANNOTATION_CATEGORIES[category].label}</Text>
        </View>
      ))}
      <View style={styles.cell}>
        <View style={shadows.xs}>
          <NoteSticker id="locked" color={null} size={56} />
        </View>
        <Text style={styles.label}>Verrouillée</Text>
      </View>
    </View>
  ),
};

/** En pile qui se chevauche : le coin décollé reste visible */
export const Pile: Story = {
  render: () => (
    <View style={styles.pile}>
      {CATEGORY_ORDER.slice(0, 4).map((category, i) => (
        <View
          key={category}
          style={[
            styles.pileItem,
            shadows.xs,
            { left: i * 30, transform: [{ rotate: `${i % 2 ? 8 : -6}deg` }] },
          ]}
        >
          <NoteSticker id={`pile-${category}`} color={ANNOTATION_CATEGORIES[category].color} size={46} />
        </View>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    padding: 24,
    backgroundColor: colors.white,
  },
  cell: {
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  pile: {
    height: 90,
    margin: 24,
  },
  pileItem: {
    position: 'absolute',
    top: 10,
  },
});
