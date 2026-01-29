/**
 * 👥 ÉCRAN DE SÉLECTION DE PROFIL
 * 
 * Premier écran de l'app : simple choix entre Léa et Zoé
 * Pas d'authentification, pas de mot de passe
 * Juste un "qui es-tu ?"
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

// Images des profils
const PROFILE_IMAGES = {
  lea: require('../assets/images/lea.png'),
  zoe: require('../assets/images/zoe.png'),
};

// 🎨 Couleurs
const COLORS = {
  bg: '#FAFAF8',
  bgLines: '#E8E8E4',
  card: '#FFFFFF',
  cardBorder: '#E0E0E0',
  primary: '#002FA7',      // Bleu Klein
  text: '#1A1A1A',
  textDim: '#6B7280',
};

export default function ProfileSelectionScreen() {
  const router = useRouter();
  const { selectProfile } = useAuthStore();
  
  /**
   * Gère la sélection d'un profil
   * @param profileName - 'Léa' ou 'Zoé'
   */
  const handleSelectProfile = async (profileName: 'Léa' | 'Zoé') => {
    // On met à jour le store avec le profil choisi (async maintenant)
    await selectProfile(profileName);
    
    // Navigation vers l'écran principal
    router.replace('/(tabs)');
  };
  
  return (
    <View style={styles.container}>
      {/* Lignes de cahier en fond */}
      <View style={styles.linesBackground}>
        {[...Array(30)].map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>
      
      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Titre */}
        <View style={styles.header}>
          <Text style={styles.appName}>Reading Buddy</Text>
          <Text style={styles.question}>Qui es-tu ?</Text>
        </View>
        
        {/* Deux profils côte à côte */}
        <View style={styles.profilesRow}>
          {/* Profil Léa */}
          <Pressable
            style={styles.profileCard}
            onPress={() => handleSelectProfile('Léa')}
          >
            <Image
              source={PROFILE_IMAGES.lea}
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>Léa</Text>
          </Pressable>
          
          {/* Profil Zoé */}
          <Pressable
            style={styles.profileCard}
            onPress={() => handleSelectProfile('Zoé')}
          >
            <Image
              source={PROFILE_IMAGES.zoe}
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>Zoé</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  // Lignes de cahier en fond
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
  
  // Contenu
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  question: {
    fontSize: 20,
    color: COLORS.textDim,
    fontWeight: '500',
  },
  
  // Profils
  profilesRow: {
    flexDirection: 'row',
    gap: 20,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    width: 150,
    // Effet au press
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 12, // Carrée avec coins arrondis (pas rond)
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.text, // Bordure noire
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
});

