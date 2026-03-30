/**
 * ProgressCard Stories
 *
 * Classement vertical des participants avec :
 * - Compteur roulant animé (rolling counter)
 * - Couronne PNG pour le leader
 * - Badge streak avec flamme
 * - Objectif intermédiaire optionnel (avec cercle de progression)
 * - Support N participants (book club)
 */
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import ProgressCard from './ProgressCard';

// --- MOCK DATA ---

const mockParticipants = [
  {
    id: 'user-lea',
    name: 'Moi',
    photoUrl: null,
    score: 120,
    percentage: 52,
    streak: 7,
    isLeader: true,
    streakAtRisk: false,
  },
  {
    id: 'user-zoe',
    name: 'Zoé',
    photoUrl: null,
    score: 98,
    percentage: 42,
    streak: 5,
    isLeader: false,
    streakAtRisk: false,
  },
];

const mockManyParticipants = [
  { id: 'u1', name: 'Moi', photoUrl: null, score: 120, percentage: 52, streak: 7, isLeader: true, streakAtRisk: false },
  { id: 'u2', name: 'Emma', photoUrl: null, score: 30, percentage: 51, streak: 3, isLeader: false, streakAtRisk: false },
  { id: 'u3', name: 'Lucas', photoUrl: null, score: 45, percentage: 47, streak: 0, isLeader: false, streakAtRisk: false },
  { id: 'u4', name: 'Chloé', photoUrl: null, score: 20, percentage: 27, streak: 2, isLeader: false, streakAtRisk: true },
  { id: 'u5', name: 'Théo', photoUrl: null, score: 8, percentage: 7, streak: 0, isLeader: false, streakAtRisk: false },
];

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

/** 2 participants — cas classique (1v1) */
export const TwoParticipants: Story = {
  args: {
    participants: mockParticipants,
    myUserId: 'user-lea',
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** 5 participants — book club */
export const FiveParticipants: Story = {
  args: {
    participants: mockManyParticipants,
    myUserId: 'u1',
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** Solo — pas encore d'ami.e ajouté.e */
export const SoloMode: Story = {
  args: {
    participants: [mockParticipants[0]],
    myUserId: 'user-lea',
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** Avec objectif intermédiaire */
export const WithGoal: Story = {
  args: {
    participants: mockParticipants,
    myUserId: 'user-lea',
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
    participants: [
      { ...mockParticipants[0], streakAtRisk: true },
      mockParticipants[1],
    ],
    myUserId: 'user-lea',
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** Scores à 0 — début du challenge */
export const JustStarted: Story = {
  args: {
    participants: [
      { ...mockParticipants[0], score: 0, percentage: 0, streak: 0, isLeader: false },
      { ...mockParticipants[1], score: 0, percentage: 0, streak: 0, isLeader: false },
    ],
    myUserId: 'user-lea',
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};
