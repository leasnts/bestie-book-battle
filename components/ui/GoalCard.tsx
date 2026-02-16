/**
 * Composant GoalCard
 *
 * Carte compacte affichant l'objectif secondaire actif du challenge.
 * Reproduit le design Figma (node 180:1700) :
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  Objectif    Deadline            ◕  75%  >  │
 *   │  366p        Mer. 18 févr. (3j)             │
 *   └─────────────────────────────────────────────┘
 *
 * - Colonne gauche : label "Objectif" + nombre de pages cible en gras
 * - Colonne centrale (flex) : label "Deadline" + date formatée + countdown
 * - Droite : cercle de progression SVG + chevron pour naviguer au détail
 *
 * Le cercle de progression est dessiné en SVG avec deux arcs :
 * un fond gris (track) et un arc coloré proportionnel au % de progression.
 *
 * Si aucun objectif actif n'existe, le composant ne rend rien (null).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ChallengeGoal } from '../../types/supabase';
import { borderRadius, colors, spacing } from '../../utils/constants';
import IconChevronRight from '../icons/IconChevronRight';

// ─── Helpers de formatage de date ────────────────────────────────

/** Noms abrégés des jours en français */
const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

/** Noms abrégés des mois en français */
const MOIS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/**
 * Formate une date ISO en "Mer. 18 févr." et calcule le nombre de jours restants.
 *
 * Comment ça marche :
 * - On parse la deadline en objet Date
 * - On calcule la différence en jours avec aujourd'hui
 * - On formate le jour de la semaine et le mois en français
 * - Le countdown adapte son texte : "3 jours", "Demain", "Aujourd'hui", "Dépassé"
 */
function formatDeadline(deadline: string): { label: string; countdown: string } {
  const date = new Date(deadline);
  const now = new Date();

  // Calcul du nombre de jours restants (on compare les dates sans les heures)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = deadlineStart.getTime() - todayStart.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Format : "Mer. 18 févr."
  const jour = JOURS[date.getDay()];
  const numero = date.getDate();
  const mois = MOIS[date.getMonth()];
  const label = `${jour} ${numero} ${mois}`;

  // Countdown adaptatif
  let countdown: string;
  if (diffDays < 0) {
    countdown = 'Dépassé';
  } else if (diffDays === 0) {
    countdown = "Aujourd'hui";
  } else if (diffDays === 1) {
    countdown = 'Demain';
  } else {
    countdown = `${diffDays} jours`;
  }

  return { label, countdown };
}

// ─── Cercle de progression SVG ──────────────────────────────────

const CIRCLE_SIZE = 44;
const CIRCLE_STROKE = 4;
const CIRCLE_RADIUS = (CIRCLE_SIZE - CIRCLE_STROKE) / 2; // 20
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~125.66

/**
 * Cercle de progression.
 *
 * Comment ça marche :
 * - Deux cercles SVG superposés : un fond (track) et un arc (progress)
 * - L'arc est dessiné via strokeDasharray + strokeDashoffset :
 *   → dasharray = la longueur totale de la circonférence
 *   → dashoffset = la partie NON dessinée (proportionnelle au %)
 *   → Le cercle commence en haut grâce à rotation(-90deg)
 * - Le % est affiché en texte au centre
 */
function CircleProgress({ percentage }: { percentage: number }) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = CIRCLE_CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <View style={circleStyles.container}>
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={circleStyles.svg}>
        {/* Track (fond gris clair) */}
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={CIRCLE_RADIUS}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={CIRCLE_STROKE}
          fill="none"
        />
        {/* Arc de progression (noir) */}
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={CIRCLE_RADIUS}
          stroke={colors.dark900}
          strokeWidth={CIRCLE_STROKE}
          fill="none"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Pourcentage au centre */}
      <Text style={circleStyles.label}>{Math.round(clamped)}%</Text>
    </View>
  );
}

const circleStyles = StyleSheet.create({
  container: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // rotation(-90deg) fait commencer l'arc en haut (12h) au lieu de droite (3h)
  svg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  label: {
    fontFamily: 'Rokkitt_Regular',
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

// ─── Props du composant ──────────────────────────────────────────

interface GoalCardProps {
  /** L'objectif secondaire actif à afficher */
  goal: ChallengeGoal;
  /** Pourcentage de progression actuel vers l'objectif (0-100) */
  progressPercentage: number;
  /** Callback quand on appuie sur la carte (naviguer vers le détail) */
  onPress?: () => void;
}

// ─── Composant principal ──────────────────────────────────────────

export default function GoalCard({ goal, progressPercentage, onPress }: GoalCardProps) {
  const { label: deadlineLabel, countdown } = formatDeadline(goal.deadline);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* Colonne gauche : Objectif + pages cible */}
      <View style={styles.column}>
        <Text style={styles.label}>Objectif</Text>
        <Text style={styles.value}>{goal.target_pages}p</Text>
      </View>

      {/* Colonne centrale : Deadline + countdown */}
      <View style={styles.columnFlex}>
        <Text style={styles.label}>Deadline</Text>
        <Text style={styles.value}>
          {deadlineLabel} ({countdown})
        </Text>
      </View>

      {/* Droite : cercle de progression + chevron */}
      <View style={styles.rightSection}>
        <CircleProgress percentage={progressPercentage} />
        <IconChevronRight size={24} color={colors.textSubtle} />
      </View>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Carte avec bordure, padding 16px, border-radius 16px (Figma)
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 17,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
  },
  // Colonne à largeur fixe (auto)
  column: {
    gap: spacing.xs,
  },
  // Colonne flexible (prend l'espace restant)
  columnFlex: {
    flex: 1,
    gap: spacing.xs,
  },
  // Labels gris "Objectif", "Deadline"
  label: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 14,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  // Valeurs en gras "366p", "Mer. 18 févr. (3 jours)"
  value: {
    fontFamily: 'WorkSans_700Bold',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  // Section droite : cercle + chevron côte à côte
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
