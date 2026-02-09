/**
 * Écran de connexion
 * 
 * Fonctionnalités :
 * - Bouton Apple Sign In (si Apple Developer disponible)
 * - Authentification par OTP (code à 6 chiffres par email)
 * - Compatible avec Expo Go (pas besoin de deep link)
 * - Redirection automatique après connexion
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { isAppleAuthAvailable, sendOTP, verifyOTP } from '../../services/supabase/auth';

/**
 * Étapes du flow OTP :
 * 1. 'email' : L'utilisateur entre son email
 * 2. 'code' : L'utilisateur entre le code à 6 chiffres reçu par email
 */
type OTPStep = 'email' | 'code';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const router = useRouter();
  
  // États
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<OTPStep>('email');
  
  // Refs pour les inputs
  const emailInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  // Actions du store
  const login = useAuthStore((state) => state.login);
  const loadUserChallenges = useProjectStore((state) => state.loadUserChallenges);

  /**
   * Ouvrir le modal pour l'authentification par email
   * Réinitialise les états et focus sur l'input email
   */
  const handleOpenEmailModal = () => {
    setEmail('');
    setOtpCode('');
    setOtpStep('email');
    setShowEmailModal(true);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 300);
  };

  /**
   * Fermer le modal et réinitialiser tous les états
   */
  const handleCloseModal = () => {
    setShowEmailModal(false);
    setEmail('');
    setOtpCode('');
    setOtpStep('email');
  };

  /**
   * Étape 1 : Envoyer le code OTP par email
   * 
   * Quand l'utilisateur entre son email et appuie sur "Continuer" :
   * 1. On valide le format de l'email
   * 2. On appelle Supabase pour envoyer le code
   * 3. On passe à l'étape 2 (saisie du code)
   */
  const handleSendOTP = async () => {
    // Valider le format de l'email
    if (!email || !email.includes('@')) {
      Alert.alert('Email invalide', 'Merci d\'entrer une adresse email valide');
      return;
    }

    try {
      setIsLoading(true);
      
      // Appeler Supabase pour envoyer le code OTP
      await sendOTP(email);
      
      // Passer à l'étape de saisie du code
      setOtpStep('code');
      
      // Focus sur l'input du code après un court délai
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
      
      // Informer l'utilisateur
      Alert.alert(
        'Code envoyé !',
        `Un code à 8 chiffres a été envoyé à ${email}. Vérifie ta boîte mail (et tes spams).`
      );
    } catch (error: any) {
      console.error('Erreur envoi OTP:', error);
      
      let errorMessage = 'Une erreur est survenue lors de l\'envoi du code';
      
      if (error.message?.includes('rate limit')) {
        errorMessage = 'Trop de tentatives. Attends quelques minutes avant de réessayer.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Étape 2 : Vérifier le code OTP et connecter l'utilisateur
   * 
   * Quand l'utilisateur entre le code et appuie sur "Se connecter" :
   * 1. On valide le format du code (8 chiffres - configuré dans Supabase)
   * 2. On appelle Supabase pour vérifier le code
   * 3. Si valide, l'utilisateur est connecté
   * 4. On redirige vers l'app ou la création de challenge
   */
  const handleVerifyOTP = async () => {
    // Valider le format du code (8 chiffres - configuré dans Supabase)
    if (!otpCode || otpCode.length !== 8) {
      Alert.alert('Code invalide', 'Le code doit contenir 8 chiffres');
      return;
    }

    try {
      setIsLoading(true);
      
      // Vérifier le code et connecter l'utilisateur
      const user = await verifyOTP(email, otpCode);
      
      // Charger les challenges de l'utilisateur
      await loadUserChallenges(user.id);
      
      // Obtenir les challenges
      const { challenges } = useProjectStore.getState();
      
      // Fermer le modal
      handleCloseModal();
      
      // Rediriger selon si l'utilisateur a des challenges ou non
      if (challenges && challenges.length > 0) {
        router.replace('/(tabs)');
      } else {
        router.replace({
          pathname: '/project/create',
          params: { isFirstProject: 'true' },
        });
      }
    } catch (error: any) {
      console.error('Erreur vérification OTP:', error);
      
      let errorMessage = 'Une erreur est survenue';
      
      if (error.message?.includes('Token has expired')) {
        errorMessage = 'Le code a expiré. Clique sur "Renvoyer le code" pour en recevoir un nouveau.';
      } else if (error.message?.includes('Invalid') || error.message?.includes('invalid')) {
        errorMessage = 'Code incorrect. Vérifie le code reçu par email.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Renvoyer le code OTP (si l'utilisateur ne l'a pas reçu)
   */
  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      setOtpCode(''); // Réinitialiser le code
      await sendOTP(email);
      Alert.alert('Code renvoyé !', `Un nouveau code a été envoyé à ${email}`);
    } catch (error: any) {
      console.error('Erreur renvoi OTP:', error);
      Alert.alert('Erreur', error.message || 'Impossible de renvoyer le code');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Revenir à l'étape email (changer d'email)
   */
  const handleBackToEmail = () => {
    setOtpStep('email');
    setOtpCode('');
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
  };

  /**
   * Gérer la connexion avec Apple Sign In
   * 
   * Le flow est maintenant en 2 temps :
   * 1. Authentifier avec Apple + vérifier si le profil existe
   * 2. Rediriger selon le résultat :
   *    → Utilisateur existant = home page (avec ses challenges)
   *    → Nouvel utilisateur = onboarding (pour créer son profil)
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
      // login() retourne maintenant un objet { isNewUser, user, ... }
      const result = await login();

      if (result.isNewUser) {
        // Nouvel utilisateur : direction l'onboarding !
        // Les données Apple (email, nom) sont stockées dans le authStore
        // via pendingUserData, l'onboarding pourra les utiliser
        router.replace('/onboarding');
      } else {
        // Utilisateur existant : charger ses challenges et aller à la home
        if (result.user) {
          await loadUserChallenges(result.user.id);
        }

        const { challenges } = useProjectStore.getState();

        if (challenges && challenges.length > 0) {
          router.replace('/(tabs)');
        } else {
          // L'utilisateur existe mais n'a pas de challenge
          router.replace({
            pathname: '/project/create',
            params: { isFirstProject: 'true' },
          });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return; // L'utilisateur a annulé
      }

      // Détecter l'erreur d'audience Expo Go
      if (error.message?.includes('Unacceptable audience')) {
        Alert.alert(
          'Configuration requise',
          'Pour utiliser Apple Sign In avec Expo Go, ajoute "host.exp.Exponent" dans les Authorized Client IDs du provider Apple dans ton Dashboard Supabase.\n\nOu utilise un Development Build (npx eas build --profile development --platform ios).'
        );
        return;
      }

      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background Lines - Effet papier ligné */}
      <View style={styles.linesBackground}>
        {[...Array(30)].map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>

      {/* Logo centré */}
      <View style={styles.contentContainer}>
        <Image
          source={require('../../assets/images/logo_black_text.png')}
          style={{ width: 320, height: 320 }}
          contentFit="contain"
          transition={1000}
        />
      </View>

      {/* Boutons de connexion */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <>
            {/* Apple Sign In Button */}
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={[styles.appleButton, { width: screenWidth - 60 }]}
              onPress={handleAppleLogin}
            />

            {/* Email Sign In Button (OTP) */}
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

      {/* Modal pour l'authentification par Email OTP */}
      <Modal
        visible={showEmailModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleCloseModal}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={[styles.modalBottomSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              {/* Handle bar */}
              <View style={styles.modalHandle} />
              
              {/* Contenu selon l'étape */}
              {otpStep === 'email' ? (
                // ===== ÉTAPE 1 : SAISIE DE L'EMAIL =====
                <>
                  <Text style={styles.modalTitle}>Se connecter</Text>
                  <Text style={styles.modalSubtitle}>
                    Entre ton email pour recevoir un code de connexion
                  </Text>
                  
                  {/* Input Email */}
                  <TextInput
                    ref={emailInputRef}
                    style={styles.modalInput}
                    placeholder="ton@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOTP}
                  />
                  
                  {/* Spacer */}
                  <View style={{ flex: 1 }} />
                  
                  {/* Bouton Continuer */}
                  <Pressable
                    style={[
                      styles.modalButton,
                      (!email || !email.includes('@') || isLoading) && styles.modalButtonDisabled,
                    ]}
                    onPress={handleSendOTP}
                    disabled={!email || !email.includes('@') || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalButtonText}>Envoyer le code</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                // ===== ÉTAPE 2 : SAISIE DU CODE OTP =====
                <>
                  <Text style={styles.modalTitle}>Entre le code</Text>
                  <Text style={styles.modalSubtitle}>
                    Un code à 8 chiffres a été envoyé à{'\n'}
                    <Text style={styles.emailHighlight}>{email}</Text>
                  </Text>
                  
                  {/* Input Code OTP */}
                  <TextInput
                    ref={otpInputRef}
                    style={[styles.modalInput, styles.otpInput]}
                    placeholder="00000000"
                    placeholderTextColor="#9CA3AF"
                    value={otpCode}
                    onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 8))}
                    keyboardType="number-pad"
                    autoFocus
                    editable={!isLoading}
                    maxLength={8}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOTP}
                  />
                  
                  {/* Liens d'action */}
                  <View style={styles.otpActions}>
                    <Pressable onPress={handleResendOTP} disabled={isLoading}>
                      <Text style={[styles.otpActionText, isLoading && styles.otpActionDisabled]}>
                        Renvoyer le code
                      </Text>
                    </Pressable>
                    <Text style={styles.otpActionSeparator}>•</Text>
                    <Pressable onPress={handleBackToEmail} disabled={isLoading}>
                      <Text style={[styles.otpActionText, isLoading && styles.otpActionDisabled]}>
                        Changer d'email
                      </Text>
                    </Pressable>
                  </View>
                  
                  {/* Spacer */}
                  <View style={{ flex: 1 }} />
                  
                  {/* Bouton Se connecter */}
                  <Pressable
                    style={[
                      styles.modalButton,
                      (otpCode.length !== 8 || isLoading) && styles.modalButtonDisabled,
                    ]}
                    onPress={handleVerifyOTP}
                    disabled={otpCode.length !== 8 || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalButtonText}>Se connecter</Text>
                    )}
                  </Pressable>
                </>
              )}
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
    backgroundColor: '#FAFAF8',
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
  
  // Email Button
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
  
  // Modal
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
    minHeight: 320,
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
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
  },
  emailHighlight: {
    color: '#0F172A',
    fontWeight: '600',
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
  otpInput: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 6,
    textAlign: 'center',
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpActionText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  otpActionDisabled: {
    color: '#9CA3AF',
  },
  otpActionSeparator: {
    fontSize: 15,
    color: '#CBD5E1',
    marginHorizontal: 12,
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
