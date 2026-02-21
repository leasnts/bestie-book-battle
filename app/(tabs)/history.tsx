/**
 * 📅 Historique de lecture - Light Mode
 * 
 * Journal personnel avec toutes les entrées
 * Ordre : plus récent en haut
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PageTransition from '../../components/PageTransition';
import { useAuthStore } from '../../stores/authStore';
import { useProgressStore } from '../../stores/progressStore';

// 🎨 Noir & Blanc + Bleu Klein
const COLORS = {
  bg: '#FAFAF8',
  bgLines: '#E8E8E4',
  card: '#FFFFFF',
  cardBorder: '#E0E0E0',
  primary: '#002FA7',
  text: '#1A1A1A',
  textDim: '#6B7280',
  textMuted: '#9CA3AF',
};

// Données d'historique simulées
const MOCK_HISTORY = [
  { date: new Date('2026-01-04'), page: 6, pagesRead: 6 },
  { date: new Date('2026-01-05'), page: 11, pagesRead: 5 },
  { date: new Date('2026-01-06'), page: 13, pagesRead: 2 },
  { date: new Date('2026-01-07'), page: 15, pagesRead: 2 },
  { date: new Date('2026-01-08'), page: 18, pagesRead: 3 },
  { date: new Date('2026-01-09'), page: 23, pagesRead: 5 },
  { date: new Date('2026-01-10'), page: 25, pagesRead: 2 },
  { date: new Date('2026-01-11'), page: 30, pagesRead: 5 },
  { date: new Date('2026-01-12'), page: 38, pagesRead: 8 },
  { date: new Date('2026-01-13'), page: 42, pagesRead: 4 },
  { date: new Date('2026-01-14'), page: 45, pagesRead: 3 },
];

function getDayOfWeek(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase().slice(0, 3);
}

function getDayNumber(date: Date): number {
  return date.getDate();
}

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { progressList } = useProgressStore();
  
  // Récupère l'historique de l'utilisateur
  const myProgress = progressList.find(p => p.userId === user?.id);
  const history = myProgress?.history || [];
  
  // Utilise les vraies données si disponibles, sinon les mock
  const displayHistory = history.length > 0 ? history : MOCK_HISTORY;
  
  // 🔄 Inverser l'ordre : plus récent en premier
  const sortedHistory = [...displayHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Plus besoin des stats ni du picker
  
  return (
    <PageTransition>
    <View style={styles.container}>
      {/* Lignes de cahier en fond */}
      <View style={styles.linesBackground}>
        {[...Array(30)].map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Historique</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Liste des entrées */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {sortedHistory.map((entry, index) => {
          const isToday = new Date(entry.date).toDateString() === new Date().toDateString();
          const hasRead = entry.pagesRead > 0;
          
          return (
            <View key={index} style={styles.entryRow}>
              {/* Date compacte */}
              <View style={[styles.dateBox, isToday && styles.dateBoxToday]}>
                <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                  {getDayOfWeek(new Date(entry.date))}
                </Text>
                <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                  {getDayNumber(new Date(entry.date))}
                </Text>
              </View>
              
              {/* Contenu */}
              <View style={styles.entryContent}>
                {hasRead ? (
                  <>
                    <Text style={styles.entryPage}>
                      Page <Text style={styles.entryPageNumber}>{entry.page}</Text>
                    </Text>
                    <Text style={styles.entryPages}>
                      +{entry.pagesRead} pages
                    </Text>
                  </>
                ) : (
                  <Text style={styles.entryNoRead}>Pas de lecture</Text>
                )}
              </View>
              
              {/* Indicateur visuel */}
              {hasRead && (
                <View style={styles.entryBadge}>
                  <Ionicons 
                    name="checkmark" 
                    size={18} 
                    color={COLORS.primary} 
                  />
                </View>
              )}
            </View>
          );
        })}
        
        {/* Message de fin */}
        <Text style={styles.endText}>
          Début de ton aventure
        </Text>
      </ScrollView>
    </View>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  // Lignes de cahier
  linesBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgLines,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  
  // Liste
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 16,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  
  // Date
  dateBox: {
    width: 56,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.bgLines,
  },
  dateBoxToday: {
    backgroundColor: COLORS.primary,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDim,
    textTransform: 'uppercase',
  },
  dayNameToday: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayNumberToday: {
    color: '#FFFFFF',
  },
  
  // Contenu
  entryContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  entryPage: {
    fontSize: 15,
    color: COLORS.text,
  },
  entryPageNumber: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  entryPages: {
    fontSize: 13,
    color: COLORS.textDim,
    fontWeight: '600',
    marginTop: 2,
  },
  entryNoRead: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  
  // Badge
  entryBadge: {
    paddingRight: 14,
  },
  
  // Fin
  endText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 16,
    marginBottom: 40,
  },
});
