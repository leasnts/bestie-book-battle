/**
 * Écran de connexion avec Apple Sign In
 * 
 * Fonctionnalités :
 * - Bouton Apple Sign In
 * - Authentification via Supabase
 * - Redirection automatique après connexion
 * - Gestion des nouveaux utilisateurs vs utilisateurs existants
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { 
  Alert, 
  Dimensions, 
  StyleSheet, 
  View, 
  ActivityIndicator,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { isAppleAuthAvailable, signInWithEmail } from '../../services/supabase/auth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const emailInputRef = React.useRef<TextInput>(null);

  // Actions du store
  const login = useAuthStore((state) => state.login);
  const loadUserChallenges = useProjectStore((state) => state.loadUserChallenges);

  /**
   * Ouvrir le bottom sheet pour l'email
   */
  const handleOpenEmailModal = () => {
    setEmail('');
    setShowEmailModal(true);
    // Auto-focus l'input après l'ouverture du modal
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 300);
  };

  /**
   * Gérer la connexion par Email (Magic Link)
   */
  const handleEmailLogin = async () => {
    // Valider l'email
    if (!email || !email.includes('@')) {
      Alert.alert('Email invalide', 'Merci d\'entrer une adresse email valide');
      return;
    }

    try {
      setIsLoading(true);

      // Envoyer le magic link
      const result = await signInWithEmail(email);

      // Fermer le modal
      setShowEmailModal(false);

      // Afficher la confirmation
      Alert.alert(
        '✉️ Email envoyé !',
        result.message + '\n\nVérifie ta boîte mail et clique sur le lien.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Email login error:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible d\'envoyer l\'email'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gérer la connexion avec Apple Sign In
   * 
   * Process :
   * 1. Appeler Apple Sign In
   * 2. Authentifier avec Supabase
   * 3. Créer ou récupérer le profil utilisateur
   * 4. Charger les challenges de l'utilisateur
   * 5. Rediriger vers l'app ou vers la création de challenge
   */
  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);

      // Vérifier si Apple Sign In est disponible
      const isAvailable = await isAppleAuthAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Non disponible',
          'Apple Sign In n\'est pas disponible sur cet appareil'
        );
        return;
      }

      // Se connecter avec Apple via Supabase
      const user = await login();

      // Charger les challenges de l'utilisateur
      await loadUserChallenges(user.id);

      // Obtenir les challenges
      const { challenges } = useProjectStore.getState();

      // Rediriger selon si l'utilisateur a des challenges ou non
      if (challenges && challenges.length > 0) {
        // L'utilisateur a des challenges : aller à l'app
        router.replace('/(tabs)');
      } else {
        // Nouvel utilisateur ou pas de challenges : créer son premier challenge
        router.replace({
          pathname: '/project/create',
          params: { isFirstProject: 'true' },
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Afficher un message d'erreur convivial
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // L'utilisateur a annulé la connexion
        return;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background Lines */}
      <View style={styles.linesBackground}>
        {[...Array(30)].map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>

      {/* Content Container to center the logo */}
      <View style={styles.contentContainer}>
        <Image
          source={require('../../assets/images/logo_black_text.png')}
          style={{ width: 320, height: 320 }}
          contentFit="contain"
          transition={1000}
        />
      </View>

      {/* Footer Container for the buttons */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <>
            {/* Apple Sign In Button (Primary) */}
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={[styles.appleButton, { width: screenWidth - 60 }]}
              onPress={handleAppleLogin}
            />

            {/* Email Sign In Button (Secondary) */}
            <Pressable
              style={[styles.emailButton, { width: screenWidth - 60 }]}
              onPress={handleOpenEmailModal}
            >
              <Ionicons name="mail-outline" size={20} color="#1A1A1A" />
              <Text style={styles.emailButtonText}>Sign in with Email</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Bottom Sheet Modal pour Email */}
      <Modal
        visible={showEmailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowEmailModal(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={[styles.modalBottomSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              {/* Handle bar */}
              <View style={styles.modalHandle} />
              
              {/* Titre */}
              <Text style={styles.modalTitle}>Enter your email</Text>
              
              {/* Input Email - même style que création projet */}
              <TextInput
                ref={emailInputRef}
                style={styles.modalInput}
                placeholder="your@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              
              {/* Spacer pour pousser le bouton en bas */}
              <View style={{ flex: 1 }} />
              
              {/* Bouton Continue - Sticky en bas */}
              <Pressable
                style={[
                  styles.modalButton,
                  (!email || !email.includes('@')) && styles.modalButtonDisabled,
                ]}
                onPress={handleEmailLogin}
                disabled={!email || !email.includes('@')}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8', // Paper color
    justifyContent: 'space-between',
  },
  linesBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  line: {
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E4',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  
  // Apple Button
  appleButton: {
    height: 48,
  },
  
  // Email Button (Secondary)
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 48,
    gap: 10,
  },
  emailButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  
  // Bottom Sheet Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalKeyboardView: {
    justifyContent: 'flex-end',
    maxHeight: '100%',
  },
  modalBottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '400',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

