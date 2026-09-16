/**
 * 📖 LeaderboardSection Stories
 *
 * Le cadre « Classement » de l'accueil : rangs 1-2-3, plus ma ligne si je suis
 * plus loin. Toujours en %.
 *
 * Le cadre est en verre : les stories le posent sur le fond aux couleurs d'une
 * couverture, sinon on ne verrait pas le matériau.
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import CoverBackdrop from './CoverBackdrop';
import LeaderboardSection from './LeaderboardSection';
import type { LeaderboardParticipant } from '../../utils/leaderboard';

const MEMBERS: LeaderboardParticipant[] = [
  { id: 'ines', name: 'Inès', photoUrl: null, score: 443, percentage: 71, streak: 4 },
  { id: 'maelle', name: 'Maëlle', photoUrl: null, score: 399, percentage: 64, streak: 2 },
  { id: 'chloe', name: 'Chloé', photoUrl: null, score: 362, percentage: 58, streak: 9 },
  { id: 'jade', name: 'Jade', photoUrl: null, score: 300, percentage: 48, streak: 0 },
  { id: 'lou', name: 'Lou', photoUrl: null, score: 268, percentage: 43, streak: 1 },
  { id: 'moi', name: 'Moi', photoUrl: null, score: 156, percentage: 25, streak: 5 },
];

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.stage}>
      <CoverBackdrop palette={['#c48840', '#704224', '#deb880']} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const meta: Meta<typeof LeaderboardSection> = {
  title: 'UI/LeaderboardSection',
  component: LeaderboardSection,
};

export default meta;
type Story = StoryObj<typeof LeaderboardSection>;

// --- STORIES ---

/** Je suis 6e : top 3, trait pointillé, puis ma ligne avec mon rang */
export const OutsideTopThree: Story = {
  render: () => (
    <Stage>
      <LeaderboardSection participants={MEMBERS} myUserId="moi" onPress={() => {}} />
    </Stage>
  ),
};

/** Je suis 2e : le top 3 suffit, pas de ligne en plus */
export const InsideTopThree: Story = {
  render: () => (
    <Stage>
      <LeaderboardSection
        participants={MEMBERS.map((m) =>
          m.id === 'moi' ? { ...m, percentage: 66, score: 412 } : m,
        )}
        myUserId="moi"
        onPress={() => {}}
      />
    </Stage>
  ),
};

/** Club de deux : deux lignes, rien d'autre */
export const TwoMembers: Story = {
  render: () => (
    <Stage>
      <LeaderboardSection
        participants={[MEMBERS[0], MEMBERS[5]]}
        myUserId="moi"
        onPress={() => {}}
      />
    </Stage>
  ),
};

/** Toute seule pour l'instant : une seule ligne, rang 1 */
export const Alone: Story = {
  render: () => (
    <Stage>
      <LeaderboardSection participants={[MEMBERS[5]]} myUserId="moi" onPress={() => {}} />
    </Stage>
  ),
};

/** Rangs à trois chiffres : les colonnes ne bougent pas */
export const BigClub: Story = {
  render: () => (
    <Stage>
      <LeaderboardSection
        participants={[
          ...MEMBERS.slice(0, 5),
          ...Array.from({ length: 120 }, (_, i) => ({
            id: `m${i}`,
            name: `Membre ${i}`,
            photoUrl: null,
            score: 200 - i,
            percentage: 32 - i * 0.2,
            streak: 0,
          })),
          { ...MEMBERS[5], percentage: 3 },
        ]}
        myUserId="moi"
        onPress={() => {}}
      />
    </Stage>
  ),
};

const styles = StyleSheet.create({
  stage: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  inner: {
    padding: 16,
  },
});
