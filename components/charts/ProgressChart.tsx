/**
 * Composant ProgressChart
 * 
 * Graphique linéaire montrant la progression de lecture
 * des 30 derniers jours pour chaque participant.
 * 
 * Utilise react-native-chart-kit pour le rendu.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ParticipantWithProgress } from '../../types';
import { colors, spacing, borderRadius } from '../../utils/constants';

interface ProgressChartProps {
  /** Liste des participants avec leur progression */
  participants: ParticipantWithProgress[];
  /** Nombre total de pages du livre */
  totalPages: number;
  /** Nombre de jours à afficher (par défaut 30) */
  days?: number;
}

// Couleurs pour les différentes lignes du graphique
const chartColors = [
  colors.primary,
  colors.secondary,
  colors.success,
  '#F59E0B', // Amber
  '#3B82F6', // Blue
];

export function ProgressChart({
  participants,
  totalPages,
  days = 30,
}: ProgressChartProps) {
  // Calcule la largeur du graphique (pleine largeur - padding)
  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;
  
  // Prépare les données pour le graphique
  const chartData = useMemo(() => {
    // Génère les labels des jours (dates simplifiées)
    const labels = generateDateLabels(days);
    
    // Prépare les datasets pour chaque participant
    const datasets = participants.slice(0, 5).map((participant, index) => {
      const data = generateProgressData(participant, days, totalPages);
      
      return {
        data,
        color: () => chartColors[index % chartColors.length],
        strokeWidth: 2,
      };
    });
    
    // Si aucun participant, on affiche une ligne vide
    if (datasets.length === 0) {
      return {
        labels: labels.filter((_, i) => i % 5 === 0), // Un label sur 5
        datasets: [{ data: Array(days).fill(0) }],
        legend: [],
      };
    }
    
    return {
      labels: labels.filter((_, i) => i % 5 === 0), // Un label sur 5 pour lisibilité
      datasets,
      legend: participants.slice(0, 5).map(p => p.user.name.split(' ')[0]),
    };
  }, [participants, days, totalPages]);
  
  // Configuration du graphique
  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Primary color
    labelColor: () => colors.textSecondary,
    style: {
      borderRadius: borderRadius.lg,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4',
      stroke: colors.border,
    },
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progression des 30 derniers jours</Text>
      
      {participants.length > 0 ? (
        <>
          <LineChart
            data={chartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier // Courbe lissée
            style={styles.chart}
            withInnerLines
            withOuterLines={false}
            withVerticalLabels
            withHorizontalLabels
            fromZero
            yAxisSuffix="%"
          />
          
          {/* Légende personnalisée */}
          <View style={styles.legend}>
            {participants.slice(0, 5).map((participant, index) => (
              <View key={participant.user.id} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: chartColors[index % chartColors.length] },
                  ]}
                />
                <Text style={styles.legendText} numberOfLines={1}>
                  {participant.user.name.split(' ')[0]}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Aucune donnée de progression disponible
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Génère les labels de dates pour l'axe X
 */
function generateDateLabels(days: number): string[] {
  const labels: string[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
  }
  
  return labels;
}

/**
 * Génère les données de progression pour un participant
 * 
 * Transforme l'historique en pourcentage de progression par jour
 */
function generateProgressData(
  participant: ParticipantWithProgress,
  days: number,
  totalPages: number
): number[] {
  const data: number[] = [];
  const history = participant.progress.history || [];
  const today = new Date();
  
  // Crée un map date -> pages
  const historyMap = new Map<string, number>();
  for (const entry of history) {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    historyMap.set(dateKey, entry.pageNumber);
  }
  
  // Génère les données pour chaque jour
  let lastKnownPage = 0;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    // Cherche une entrée pour ce jour
    const pageForDay = historyMap.get(dateKey);
    
    if (pageForDay !== undefined) {
      lastKnownPage = pageForDay;
    }
    
    // Convertit en pourcentage
    const percentage = totalPages > 0 
      ? Math.round((lastKnownPage / totalPages) * 100)
      : 0;
    
    data.push(percentage);
  }
  
  return data;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 80,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});

