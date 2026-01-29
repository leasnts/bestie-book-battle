/**
 * 📜 Fil d'activité - Light Mode
 * 
 * Affiche les dernières mises à jour de lecture
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { getChallengeHistory } from '../../services/supabase/database';
import { ProgressHistoryRow, UserRow } from '../../types/supabase';
import { getProfilePhotoUrl } from '../../supabaseConfig';

// 🎨 Noir & Blanc + Bleu Klein + Orange flamme
const COLORS = {
  bg: '#FAFAF8',
  bgLines: '#E8E8E4',
  card: '#FFFFFF',
  cardBorder: '#E0E0E0',
  primary: '#002FA7',
  text: '#1A1A1A',
  textDim: '#6B7280',
  textMuted: '#9CA3AF',
  flame: '#F59E0B',
};

// Type pour une activité affichée
type Activity = {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl: string | null;
  type: 'progress' | 'streak';
  pages?: number;
  currentPage?: number;
  streak?: number;
  bookTitle: string;
  timestamp: Date;
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
}

export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeProject, participants } = useProjectStore();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Charge l'historique du challenge actif
  useEffect(() => {
    loadActivities();
  }, [activeProject?.id]);
  
  async function loadActivities() {
    if (!activeProject?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Récupère l'historique des 30 derniers jours
      const history = await getChallengeHistory(activeProject.id, 30);
      
      // Transforme l'historique en activités
      const newActivities: Activity[] = history.map((entry) => {
        const participant = participants.find(p => p.id === entry.user_id);
        
        return {
          id: entry.id,
          userId: entry.user_id,
          userName: participant?.first_name || 'Utilisateur',
          userPhotoUrl: participant?.profile_photo_url 
            ? getProfilePhotoUrl(participant.profile_photo_url) 
            : null,
          type: 'progress',
          pages: entry.pages_added,
          currentPage: entry.current_page,
          bookTitle: activeProject.book_name,
          timestamp: new Date(entry.recorded_at),
        };
      });
      
      setActivities(newActivities);
    } catch (error) {
      console.error('Erreur chargement activités:', error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
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
        <Text style={styles.headerTitle}>Activité</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Liste des activités */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Aucune activité pour le moment</Text>
            <Text style={styles.emptySubtext}>
              Les mises à jour de lecture apparaîtront ici
            </Text>
          </View>
        ) : (
          <>
            {activities.map(activity => {
              const isMe = activity.userId === user?.id;
          
              return (
                <View key={activity.id} style={styles.activityItem}>
                  {/* Avatar */}
                  <Image
                    source={
                      activity.userPhotoUrl
                        ? { uri: activity.userPhotoUrl }
                        : require('../../assets/images/lea.png')
                    }
                    style={styles.avatar}
                  />
                  
                  {/* Contenu */}
                  <View style={styles.activityContent}>
                    <View style={styles.activityTextRow}>
                      <Text style={styles.activityText}>
                        <Text style={styles.activityName}>
                          {isMe ? 'Toi' : activity.userName}
                        </Text>
                        {activity.type === 'progress' && (
                          <Text>
                            {' '}a lu <Text style={styles.highlight}>+{activity.pages} pages</Text>
                          </Text>
                        )}
                        {activity.type === 'streak' && (
                          <Text> a atteint </Text>
                        )}
                      </Text>
                      {activity.type === 'streak' && (
                        <View style={styles.streakInline}>
                          <Ionicons name="flame" size={14} color={COLORS.flame} />
                          <Text style={styles.highlightStreak}>{activity.streak} jours</Text>
                          <Text style={styles.activityText}> de suite</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.activityMeta}>
                      <Text style={styles.activityBook}>{activity.bookTitle}</Text>
                      <Text style={styles.activityDot}>•</Text>
                      <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                    </View>
                  </View>
                  
                  {/* Badge pages */}
                  {activity.type === 'progress' && (
                    <View style={styles.pageBadge}>
                      <Text style={styles.pageBadgeText}>p.{activity.currentPage}</Text>
                    </View>
                  )}
                </View>
              );
            })}
            
            {/* Fin de la liste */}
            <Text style={styles.endText}>C'est tout pour le moment</Text>
          </>
        )}
      </ScrollView>
    </View>
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
    paddingBottom: 16,
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  streakInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  activityName: {
    fontWeight: '600',
    color: COLORS.text,
  },
  highlight: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  highlightStreak: {
    fontWeight: '700',
    color: COLORS.flame,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  activityBook: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  activityDot: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 6,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  pageBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  pageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  endText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 20,
    marginBottom: 40,
  },
  
  // États loading et empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textDim,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
  },
});
