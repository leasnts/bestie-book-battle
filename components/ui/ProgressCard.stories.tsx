/**
 * ProgressCard Stories
 *
 * Section de classement de l'accueil, limitée à 4 lignes sans scroll :
 * - Compteur roulant animé sur les scores
 * - Couronne PNG pour le leader
 * - Badge streak avec flamme (+ variante « en danger »)
 * - Ligne « moi » épinglée sous un séparateur pointillé quand je suis hors podium
 * - Bouton « Voir le classement » dès qu'on dépasse 4 participants
 * - Objectif intermédiaire optionnel (avec anneau de progression)
 *
 * Note : `isLeader` et le rang ne sont plus passés en props — ils sont calculés
 * à partir des pourcentages par `rankParticipants` (utils/leaderboard.ts).
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
    streakAtRisk: false,
  },
  {
    id: 'user-zoe',
    name: 'Zoé',
    photoUrl: null,
    score: 98,
    percentage: 42,
    streak: 5,
    streakAtRisk: false,
  },
];

/** 5 participants, je suis en tête → le top 4 s'affiche d'affilée */
const mockManyParticipants = [
  { id: 'u1', name: 'Moi', photoUrl: null, score: 120, percentage: 52, streak: 7, streakAtRisk: false },
  { id: 'u2', name: 'Emma', photoUrl: null, score: 118, percentage: 51, streak: 3, streakAtRisk: false },
  { id: 'u3', name: 'Lucas', photoUrl: null, score: 108, percentage: 47, streak: 0, streakAtRisk: false },
  { id: 'u4', name: 'Chloé', photoUrl: null, score: 62, percentage: 27, streak: 2, streakAtRisk: true },
  { id: 'u5', name: 'Théo', photoUrl: null, score: 16, percentage: 7, streak: 0, streakAtRisk: false },
];

/** 12 participants, je suis 7e → top 3 + ma ligne épinglée avec « #7 » */
const mockBookClub = [
  { id: 'u1', name: 'Léa', photoUrl: null, score: 142, percentage: 61, streak: 3, streakAtRisk: false },
  { id: 'u2', name: 'Maxime', photoUrl: null, score: 138, percentage: 59, streak: 1, streakAtRisk: false },
  { id: 'u3', name: 'Elise', photoUrl: null, score: 120, percentage: 52, streak: 0, streakAtRisk: false },
  { id: 'u4', name: 'Inès', photoUrl: null, score: 110, percentage: 47, streak: 4, streakAtRisk: false },
  { id: 'u5', name: 'Jade', photoUrl: null, score: 96, percentage: 41, streak: 0, streakAtRisk: false },
  { id: 'u6', name: 'Sarah', photoUrl: null, score: 71, percentage: 31, streak: 2, streakAtRisk: false },
  { id: 'me', name: 'Moi', photoUrl: null, score: 64, percentage: 28, streak: 5, streakAtRisk: false },
  { id: 'u8', name: 'Manon', photoUrl: null, score: 59, percentage: 25, streak: 0, streakAtRisk: false },
  { id: 'u9', name: 'Camille', photoUrl: null, score: 41, percentage: 18, streak: 1, streakAtRisk: true },
  { id: 'u10', name: 'Lou', photoUrl: null, score: 33, percentage: 14, streak: 0, streakAtRisk: false },
  { id: 'u11', name: 'Anaïs', photoUrl: null, score: 18, percentage: 8, streak: 0, streakAtRisk: false },
  { id: 'u12', name: 'Nina', photoUrl: null, score: 4, percentage: 2, streak: 0, streakAtRisk: false },
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

/** 2 participants — cas classique (1v1), pas de bouton classement */
export const TwoParticipants: Story = {
  args: {
    participants: mockParticipants,
    myUserId: 'user-lea',
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** 5 participants, je suis en tête → top 4 + bouton classement */
export const FiveParticipants: Story = {
  args: {
    participants: mockManyParticipants,
    myUserId: 'u1',
    onParticipantPress: (id: string) => console.log('Tap:', id),
    onSeeAllPress: () => console.log('Voir le classement'),
  },
};

/** 12 participants, je suis 7e → top 3 + séparateur + ma ligne « #7 » */
export const BookClubOutsidePodium: Story = {
  args: {
    participants: mockBookClub,
    myUserId: 'me',
    onParticipantPress: (id: string) => console.log('Tap:', id),
    onSeeAllPress: () => console.log('Voir le classement'),
  },
};

/** Exactement 4 participants → limite haute sans bouton */
export const ExactlyFour: Story = {
  args: {
    participants: mockBookClub.slice(0, 3).concat(mockBookClub[6]),
    myUserId: 'me',
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};

/** Éditions différentes → les scores basculent en pourcentages */
export const DifferentEditions: Story = {
  args: {
    participants: mockBookClub,
    myUserId: 'me',
    showPercentage: true,
    onParticipantPress: (id: string) => console.log('Tap:', id),
    onSeeAllPress: () => console.log('Voir le classement'),
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

/** Book club + objectif : le cas le plus chargé de la section */
export const BookClubWithGoal: Story = {
  args: {
    participants: mockBookClub,
    myUserId: 'me',
    intermediateGoal: {
      target_pages: 150,
      deadline: '2026-03-15',
      baseline: 40,
    },
    onParticipantPress: (id: string) => console.log('Tap:', id),
    onSeeAllPress: () => console.log('Voir le classement'),
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

/** Scores à 0 — début du challenge, égalité parfaite */
export const JustStarted: Story = {
  args: {
    participants: [
      { ...mockParticipants[0], score: 0, percentage: 0, streak: 0 },
      { ...mockParticipants[1], score: 0, percentage: 0, streak: 0 },
    ],
    myUserId: 'user-lea',
    onParticipantPress: (id: string) => console.log('Tap:', id),
  },
};
