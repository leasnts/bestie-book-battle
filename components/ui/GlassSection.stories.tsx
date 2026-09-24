/**
 * 📖 GlassSection Stories
 *
 * Cadre en verre de l'accueil. Le verre ne se voit que sur un fond coloré :
 * les stories posent un fond ambré proche de la maquette (couverture diluée
 * dans le papier), en attendant le vrai fond tiré de la couverture (#40).
 */
import type { Meta, StoryObj } from '@storybook/react';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRightIcon, FlagIcon, UsersIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../utils/constants';
import GlassSection from './GlassSection';

/** Fond ambré de la maquette : ambre et noyer dilués dans le papier */
function Ambient({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.stage}>
      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={['#d7b183', '#e6cdb0', '#f2ebe1', '#e9dccb']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />
      {children}
    </View>
  );
}

const meta: Meta<typeof GlassSection> = {
  title: 'UI/GlassSection',
  component: GlassSection,
};

export default meta;
type Story = StoryObj<typeof GlassSection>;

// --- STORIES ---

/** Cadre simple, sans toucher (comme « Ma page ») */
export const Static: Story = {
  render: () => (
    <Ambient>
      <GlassSection>
        <Text style={styles.label}>Ma page</Text>
        <Text style={styles.big}>156</Text>
        <Text style={styles.meta}>/ 624</Text>
      </GlassSection>
    </Ambient>
  ),
};

/** Tout le cadre se touche et se rentre à 0,97 (comme « Le livre », « Classement ») */
export const Pressable: Story = {
  render: function PressableStory() {
    const [taps, setTaps] = useState(0);
    return (
      <Ambient>
        <GlassSection onPress={() => setTaps((n) => n + 1)} accessibilityLabel="Classement complet">
          <View style={styles.head}>
            <Text style={styles.label}>Classement</Text>
            <View style={styles.metaRow}>
              <UsersIcon size={13} color={colors.textTertiary} />
              <Text style={styles.meta}>38</Text>
              <ChevronRightIcon size={15} color={colors.textPlaceholder} />
            </View>
          </View>
          <Text style={styles.meta}>Touché {taps} fois</Text>
        </GlassSection>
      </Ambient>
    );
  },
};

/** Les trois cadres empilés, espacés de 12 pt */
export const ThreeFrames: Story = {
  render: () => (
    <Ambient>
      <View style={styles.stack}>
        <GlassSection onPress={() => {}} accessibilityLabel="Fiche du livre">
          <Text style={styles.tag}>J-27</Text>
          <Text style={styles.title}>Fourth Wing</Text>
          <Text style={styles.meta}>Rebecca Yarros</Text>
          <View style={[styles.head, styles.stats]}>
            <View style={styles.metaRow}>
              <UsersIcon size={13} color={colors.textTertiary} />
              <Text style={styles.meta}>
                Club · <Text style={styles.metaStrong}>26 %</Text> du livre
              </Text>
            </View>
            <View style={styles.metaRow}>
              <FlagIcon size={13} color={colors.textTertiary} />
              <Text style={styles.meta}>
                Cap · <Text style={styles.metaStrong}>9/38</Text>
              </Text>
            </View>
          </View>
        </GlassSection>
        <GlassSection>
          <Text style={styles.label}>Ma page</Text>
          <Text style={styles.big}>156</Text>
        </GlassSection>
        <GlassSection onPress={() => {}} accessibilityLabel="Classement complet">
          <Text style={styles.label}>Classement</Text>
          <Text style={styles.row}>1  Inès  71 %</Text>
          <Text style={styles.row}>2  Maëlle  64 %</Text>
          <Text style={styles.row}>3  Chloé  58 %</Text>
        </GlassSection>
      </View>
    </Ambient>
  ),
};

/** Les trois niveaux de texte sur le verre (text-tertiary ≥ 4,5:1 exigé) */
export const TextLevels: Story = {
  render: () => (
    <Ambient>
      <GlassSection>
        <Text style={[styles.sample, { color: colors.textPrimary }]}>text-primary</Text>
        <Text style={[styles.sample, { color: colors.textSecondary }]}>text-secondary</Text>
        <Text style={[styles.sample, { color: colors.textTertiary }]}>text-tertiary</Text>
      </GlassSection>
    </Ambient>
  ),
};

const styles = StyleSheet.create({
  stage: {
    padding: 16,
    borderRadius: 28,
    overflow: 'hidden',
  },
  stack: {
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stats: {
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  tag: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.textTertiary,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.textPrimary,
  },
  big: {
    fontFamily: fonts.displayHero,
    fontSize: 64,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  metaStrong: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.textPrimary,
  },
  row: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 6,
  },
  sample: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    marginBottom: 4,
  },
});
