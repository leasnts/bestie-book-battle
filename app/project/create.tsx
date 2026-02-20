import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    InputAccessoryView,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CoverPicker3D from '../../components/CoverPicker3D';
import { updateChallenge } from '../../services/supabase/database';
import { uploadBookCover } from '../../services/supabase/storage';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';

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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Réduire l'espace entre le bouton et le clavier quand il est ouvert (même logique que onboarding/create)
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Le composant CoverPicker gère maintenant toute la logique de sélection

  const processCover = async (challengeId: string): Promise<string> => {
    // Si pas de cover personnalisée, utiliser une URL de placeholder
    if (!coverUri) {
      // Cover par défaut (placeholder public)
      return `https://picsum.photos/seed/${challengeId}/300/400`;
    }

    // Si c'est une cover personnalisée, essayer de l'uploader sur Supabase
    try {
      const { url } = await uploadBookCover(challengeId, coverUri);
      return url;
    } catch (error: any) {
      
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

      // 2. Upload de la cover si nécessaire et sauvegarde en BDD
      let coverUrl = challenge.cover_url;
      if (coverUri) {
        coverUrl = await processCover(challenge.id);

        if (coverUrl) {
          await updateChallenge(challenge.id, { cover_url: coverUrl });
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
      {/* InputAccessoryView vide : supprime la toolbar "Done" native d'iOS */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="create-pages-empty">
          <View />
        </InputAccessoryView>
      )}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: 140, // Espace pour le footer fixe (évite que le dernier input soit caché)
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentInset={Platform.OS === 'ios' ? { top: 16, bottom: 16 } : undefined}
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
                    inputAccessoryViewID="create-pages-empty"
                  />
                </View>

              </View>
            </View>
          </ScrollView>

          {/* Footer fixe : reste au-dessus du clavier (KeyboardAvoidingView le pousse) */}
          <View 
            style={[
              styles.footer, 
              { 
                paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 16),
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
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

