/**
 * Écran d'inscription
 * 
 * Permet à un nouvel utilisateur de créer un compte
 * avec nom, email et mot de passe.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  Pressable,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, borderRadius } from '../../utils/constants';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  // États du formulaire
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Validation du formulaire
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setLocalError('Nom requis');
      return false;
    }
    
    if (name.trim().length < 2) {
      setLocalError('Le nom doit contenir au moins 2 caractères');
      return false;
    }
    
    if (!email.trim()) {
      setLocalError('Email requis');
      return false;
    }
    
    if (!email.includes('@')) {
      setLocalError('Email invalide');
      return false;
    }
    
    if (!password) {
      setLocalError('Mot de passe requis');
      return false;
    }
    
    if (password.length < 6) {
      setLocalError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    if (password !== confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    return true;
  };
  
  // Soumettre le formulaire
  const handleRegister = async () => {
    setLocalError(null);
    clearError();
    
    if (!validateForm()) return;
    
    try {
      await register(email.trim(), password, name.trim());
      // La redirection est gérée automatiquement par le layout
    } catch (err: any) {
      // L'erreur est déjà gérée dans le store
    }
  };
  
  const displayError = localError || error;
  
  return (
    <LinearGradient
      colors={[colors.secondaryLight + '30', colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="person-add" size={40} color={colors.secondary} />
              </View>
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>
                Rejoins la communauté des lecteurs
              </Text>
            </View>
            
            {/* Formulaire */}
            <View style={styles.form}>
              {/* Champ nom */}
              <TextInput
                label="Ton prénom"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setLocalError(null);
                }}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="name"
                left={<TextInput.Icon icon="account-outline" />}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.secondary}
              />
              
              {/* Champ email */}
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setLocalError(null);
                }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon="email-outline" />}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.secondary}
              />
              
              {/* Champ mot de passe */}
              <TextInput
                label="Mot de passe"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setLocalError(null);
                }}
                mode="outlined"
                secureTextEntry={!showPassword}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.secondary}
              />
              
              {/* Champ confirmation mot de passe */}
              <TextInput
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setLocalError(null);
                }}
                mode="outlined"
                secureTextEntry={!showPassword}
                left={<TextInput.Icon icon="lock-check-outline" />}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.secondary}
              />
              
              {/* Message d'erreur */}
              {displayError && (
                <HelperText type="error" visible={true} style={styles.error}>
                  {displayError}
                </HelperText>
              )}
              
              {/* Bouton d'inscription */}
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                buttonColor={colors.secondary}
              >
                Créer mon compte
              </Button>
              
              {/* Lien vers connexion */}
              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Déjà un compte ?</Text>
                <Link href="/auth/login" asChild>
                  <Pressable>
                    <Text style={styles.link}>Se connecter</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  error: {
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  linkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
});

