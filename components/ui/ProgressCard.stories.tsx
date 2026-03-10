/**
 * 📖 ProgressCard Stories
 * 
 * Classement vertical des participants avec :
 * - Compteur roulant animé (rolling counter)
 * - Couronne PNG pour le leader
 * - Badge streak avec flamme
 * - Objectif intermédiaire optionnel (avec cercle de progression)
 * 
 * Les lignes se réordonnent avec une animation spring (react-native-reanimated)
 * quand le score change.
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProgressCard from './ProgressCard';

// --- MOCK DATA ---

const mockMe = {
  id: 'user-lea',
  name: 'Léa',
  photoUrl: null,
  score: 120,
  streak: 7,
  isLeader: true,
  streakAtRisk: false,
};

const mockFriend = {
  id: 'user-zoe',
  name: 'Zoé',
  photoUrl: null,
  score: 98,
  streak: 5,
  isLeader: false,
  streakAtRisk: false,
};

const mockMe_Behind = {
  ...mockMe,
  score: 85,
  isLeader: false,
};

const mockFriend_Ahead = {
  ...mockFriend,
  score: 142,
  isLeader: true,
};

const meta: Meta<typeof ProgressCard> = {
  title: 'UI/ProgressCard',
  component: ProgressCard,
  decorators: [
    (Story) => (
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProgressCard>;

// --- STORIES ---

/** Léa en tête — cas classique */
export const MeLeading: Story = {
  args: {
    me: mockMe,
    friend: mockFriend,
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** Zoé en tête — Léa doit rattraper */
export const FriendLeading: Story = {
  args: {
    me: mockMe_Behind,
    friend: mockFriend_Ahead,
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** Solo — pas encore d'ami.e ajouté.e */
export const SoloMode: Story = {
  args: {
    me: mockMe,
    friend: null,
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** Avec objectif intermédiaire */
export const WithGoal: Story = {
  args: {
    me: mockMe,
    friend: mockFriend,
    intermediateGoal: {
      target_pages: 150,
      deadline: '2026-03-15',
      baseline: 80,
    },
    onParticipantPress: (id: string) => console.log('Tap:', id),
    onGoalPress: () => console.log('Goal tapped!'),
  },
};

/** Streak en danger (bordure pointillée, opacité réduite) */
export const StreakAtRisk: Story = {
  args: {
    me: { ...mockMe, streakAtRisk: true },
    friend: mockFriend,
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** Scores très proches — compétition serrée */
export const CloseRace: Story = {
  args: {
    me: { ...mockMe, score: 134, isLeader: true },
    friend: { ...mockFriend, score: 133, isLeader: false },
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** Scores à 0 — début du challenge */
export const JustStarted: Story = {
  args: {
    me: { ...mockMe, score: 0, streak: 0, isLeader: false },
    friend: { ...mockFriend, score: 0, streak: 0, isLeader: false },
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};
