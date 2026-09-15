/**
 * 📖 Button3D Stories
 * 
 * Boutons avec effet 3D pixel-perfect (inner shadows via LinearGradient).
 * Deux variants : primary (dark) et secondary (light).
 * L'effet s'inverse au press (pressed → gradients inversés).
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button3D from './Button3D';
import { colors, fonts } from '../utils/constants';
import { ArrowRightIcon, BellIcon, BookmarkIcon, ChevronLeftIcon, EllipsisIcon, SettingsIcon, ShareIcon, UserPlusIcon } from 'lucide-react-native';

const meta: Meta<typeof Button3D> = {
  title: 'Core/Button3D',
  component: Button3D,
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['primary', 'secondary'],
      description: 'Style du bouton',
    },
    disabled: {
      control: 'boolean',
      description: 'Désactiver le bouton',
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement',
    },
    size: {
      control: { type: 'radio' },
      options: ['default', 'compact'],
      description: 'Taille du bouton',
    },
    iconOnly: {
      control: 'boolean',
      description: 'Mode icône seule (sans texte)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button3D>;

// --- STORIES ---

/** Bouton principal — action primaire */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Commencer la lecture',
    onPress: () => console.log('Pressed!'),
  },
};

/** Bouton secondaire — action secondaire ou retour */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Retour',
    onPress: () => console.log('Pressed!'),
  },
};

/** Bouton avec icône à gauche */
export const WithIconLeft: Story = {
  args: {
    variant: 'primary',
    children: 'Inviter un ami',
    icon: UserPlusIcon,
    iconPosition: 'left',
    onPress: () => console.log('Pressed!'),
  },
};

/** Bouton avec icône à droite */
export const WithIconRight: Story = {
  args: {
    variant: 'primary',
    children: 'Continuer',
    icon: ArrowRightIcon,
    iconPosition: 'right',
    onPress: () => console.log('Pressed!'),
  },
};

/** Mode icône seule (bouton compact, ex: bouton retour) */
export const IconOnly: Story = {
  args: {
    variant: 'secondary',
    icon: ChevronLeftIcon,
    iconOnly: true,
    size: 'compact',
    onPress: () => console.log('Back!'),
  },
};

/** État de chargement */
export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Sauvegarde...',
    loading: true,
    onPress: () => {},
  },
};

/** État désactivé */
export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Indisponible',
    disabled: true,
    onPress: () => {},
  },
};

/** Toutes les combinaisons */
export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text style={styles.sectionTitle}>Primary</Text>
      <Button3D variant="primary" onPress={() => {}}>
        Enregistrer ma page
      </Button3D>
      <Button3D variant="primary" icon={BookmarkIcon} onPress={() => {}}>
        Sauvegarder
      </Button3D>
      <Button3D variant="primary" loading onPress={() => {}}>
        Chargement
      </Button3D>
      <Button3D variant="primary" disabled onPress={() => {}}>
        Désactivé
      </Button3D>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Secondary</Text>
      <Button3D variant="secondary" onPress={() => {}}>
        Annuler
      </Button3D>
      <Button3D variant="secondary" icon={ShareIcon} onPress={() => {}}>
        Partager le code
      </Button3D>
      
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Compact (icon only)</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button3D variant="secondary" icon={ChevronLeftIcon} iconOnly size="compact" onPress={() => {}} />
        <Button3D variant="secondary" icon={SettingsIcon} iconOnly size="compact" onPress={() => {}} />
        <Button3D variant="secondary" icon={BellIcon} iconOnly size="compact" onPress={() => {}} />
        <Button3D variant="secondary" icon={EllipsisIcon} iconOnly size="compact" onPress={() => {}} />
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPlaceholder,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
