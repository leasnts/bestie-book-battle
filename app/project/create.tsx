import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CoverPicker3D from '../../components/CoverPicker3D';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { uploadBookCover } from '../../services/supabase/storage';
import { updateChallenge } from '../../services/supabase/database';

// Random covers imports - assume they exist in assets/images
const RANDOM_COVERS = [
  require('../../assets/images/random_cover_1.png'),
  require('../../assets/images/random_cover_2.png'),
  require('../../assets/images/random_cover_3.png'),
];

export default function CreateProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Auth & Stores
  const user = useAuthStore((state) => state.user);
  const createChallenge = useProjectStore((state) => state.createChallenge);

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);

  // Le composant CoverPicker gère maintenant toute la logique de sélection

  const processCover = async (challengeId: string): Promise<string> => {
    // Si pas de cover personnalisée, utiliser une URL de placeholder
    if (!coverUri) {
      // Cover par défaut (placeholder public)
      return `https://picsum.photos/seed/${challengeId}/300/400`;
    }

    // Si c'est une cover personnalisée, essayer de l'uploader sur Supabase
    try {
      console.log("Tentative d'upload de la cover personnalisée...");
      
      // Upload to Supabase Storage
      const { url } = await uploadBookCover(challengeId, coverUri);
      console.log("Upload réussi:", url);
      return url;
      
    } catch (error: any) {
      console.warn("Échec de l'upload Supabase, utilisation d'une cover par défaut:", error);
      
      // En cas d'échec, utiliser une cover de fallback
      return `https://picsum.photos/seed/${challengeId}/300/400`;
    }
  };

  const handleCreate = async () => {
    if (!title || !author || !totalPages) return;

    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non identifié. Veuillez vous reconnecter.');
      router.replace('/auth/login');
      return;
    }

    setLoading(true);
    try {
      // 1. Créer le challenge dans Supabase
      const challenge = await createChallenge(
        user.id,
        title,
        author || undefined,
        parseInt(totalPages),
        undefined, // On uploadera la cover après
        undefined  // Pas de target date pour l'instant
      );

      console.log('Challenge créé:', challenge);

      // 2. Upload de la cover si nécessaire et sauvegarde en BDD
      let coverUrl = challenge.cover_url;
      if (coverUri) {
        coverUrl = await processCover(challenge.id);
        console.log('Cover uploadée:', coverUrl);

        // Sauvegarder l'URL de la cover dans la base de données
        // Sans ça, l'URL serait perdue au prochain chargement
        if (coverUrl) {
          await updateChallenge(challenge.id, { cover_url: coverUrl });
          console.log('Cover URL sauvegardée en BDD');
        }
      }

      // 3. Rediriger vers l'écran d'invitation
      router.replace({ 
        pathname: '/project/invite', 
        params: { 
          code: challenge.invite_code,
          challengeId: challenge.id 
        } 
      });

    } catch (error: any) {
      console.error('Erreur lors de la création du challenge:', error);
      Alert.alert('Erreur', error.message || "Une erreur est survenue lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = title.length > 0 && author.length > 0 && parseInt(totalPages) > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: 140, // Espace suffisant entre dernier input et footer
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>

              <View style={styles.header}>
                {/* Bouton retour au-dessus */}
                <TouchableOpacity 
                  onPress={() => router.replace('/(tabs)')}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <View style={styles.backButtonInner}>
                    <Ionicons name="arrow-back" size={20} color="#0F172A" />
                  </View>
                </TouchableOpacity>

                {/* Titre en dessous */}
                <Text style={styles.welcomeText}>Créer ton premier BBB</Text>

                {/* Sous-titre */}
                <Text style={styles.subtitle}>Et invite tes amis à le rejoindre !</Text>
              </View>

              <View style={styles.formContainer}>

                {/* Cover Picker 3D avec effet cylindrique */}
                <View style={{ overflow: 'visible' }}>
                  <CoverPicker3D
                    onCoverSelected={(uri) => setCoverUri(uri)}
                    initialCover={coverUri || undefined}
                  />
                </View>

                {/* Inputs avec meilleurs placeholders */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Titre du livre</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Le Petit Prince"
                    placeholderTextColor="#9CA3AF" // Gray-400
                    value={title}
                    onChangeText={setTitle}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Auteur</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Antoine de Saint-Exupéry"
                    placeholderTextColor="#9CA3AF" // Gray-400
                    value={author}
                    onChangeText={setAuthor}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre de pages</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="96"
                    placeholderTextColor="#9CA3AF" // Gray-400
                    value={totalPages}
                    onChangeText={setTotalPages}
                    keyboardType="number-pad"
                    returnKeyType="done"
                  />
                </View>

              </View>
            </View>
          </ScrollView>

          {/* Footer avec effet Glassmorphisme */}
          <View 
            style={[
              styles.footer, 
              { 
                paddingBottom: Math.max(insets.bottom, 16), // Minimal padding
              }
            ]}
          >
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!isFormValid || loading}
              activeOpacity={0.85}
              style={[
                styles.buttonWrapper,
                (isFormValid && !loading) && {
                  // Glow effect uniquement quand actif
                  shadowColor: '#111827',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 10,
                }
              ]}
            >
              <LinearGradient
                colors={
                  !isFormValid || loading 
                    ? ['#E2E8F0', '#CBD5E1'] // Gradient Slate-200 → Slate-300 (plus doux)
                    : ['#111827', '#374151', '#111827'] // Gradient noir → gris foncé → noir
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.createButton,
                  (!isFormValid || loading) && styles.createButtonDisabled
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#64748B" /> 
                ) : (
                  <Text style={[
                    styles.createButtonText,
                    (!isFormValid || loading) && styles.createButtonTextDisabled
                  ]}>
                    Continuer
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Gradient subtil de fond (simulé avec une couleur légèrement plus chaude)
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16, // Espace entre bouton et titre
    alignSelf: 'flex-start', // Aligné à gauche
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    // Border moderne
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // Slate-200
    // Ombre subtile
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B', // Slate-500
    fontWeight: '400',
    lineHeight: 24,
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A', // Slate-900
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1.5, // Border légèrement plus épais
    borderColor: '#CBD5E1', // Slate-300
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '400',
    // Ombre plus prononcée
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    // Position absolue pour coller en bas
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Background très transparent (glassmorphisme sans blur natif)
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // 70% transparent - laisse voir au travers
    // Border subtil en haut
    borderTopWidth: 1,
    borderTopColor: 'rgba(203, 213, 225, 0.6)',
    // Ombre inversée pour élever le footer
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  buttonWrapper: {
    borderRadius: 16,
    // Glow effect autour du bouton (désactivé quand disabled via le composant)
  },
  createButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // Pas de background ici, c'est le gradient qui gère
  },
  createButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6, // Rend le bouton légèrement transparent
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700', // Plus bold
    letterSpacing: 0.5,
    textTransform: 'uppercase', // MAJUSCULES pour impact
  },
  createButtonTextDisabled: {
    color: '#64748B', // Slate-500 pour le texte disabled
    opacity: 0.8,
  },
});

