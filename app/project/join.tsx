/**
 * Écran Rejoindre un Projet
 * 
 * Permet de rejoindre un projet existant via un code d'invitation.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { isValidInviteCode } from '../../utils/share';
import { colors, spacing, borderRadius } from '../../utils/constants';

export default function JoinProjectScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { joinProjectByCode, isLoading } = useProjectStore();
  
  // État du formulaire
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Validation et normalisation du code
  const handleCodeChange = (text: string) => {
    // Convertit en majuscules et retire les espaces
    const normalized = text.toUpperCase().replace(/\s/g, '');
    setInviteCode(normalized);
    setError(null);
  };
  
  // Rejoindre le projet
  const handleJoin = async () => {
    setError(null);
    
    if (!inviteCode.trim()) {
      setError('Le code d\'invitation est requis');
      return;
    }
    
    if (!isValidInviteCode(inviteCode)) {
      setError('Le code doit contenir 6 caractères alphanumériques');
      return;
    }
    
    if (!user) return;
    
    try {
      const project = await joinProjectByCode(inviteCode, user.id);
      
      Alert.alert(
        'Tu as rejoint le projet ! 📚',
        `Tu fais maintenant partie de la lecture de "${project.bookTitle}".`,
        [
          {
            text: 'Voir le projet',
            onPress: () => router.replace(`/project/${project.id}`),
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Code invalide ou erreur réseau');
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Illustration */}
          <View style={styles.illustration}>
            <View style={styles.illustrationIcon}>
              <Ionicons name="people" size={48} color={colors.secondary} />
            </View>
            <Text style={styles.illustrationTitle}>
              Rejoindre un projet
            </Text>
            <Text style={styles.illustrationSubtitle}>
              Entre le code d'invitation que ton ami t'a partagé pour rejoindre sa lecture.
            </Text>
          </View>
          
          {/* Formulaire */}
          <View style={styles.form}>
            <Text style={styles.label}>Code d'invitation</Text>
            
            {/* Champ de saisie du code */}
            <TextInput
              value={inviteCode}
              onChangeText={handleCodeChange}
              mode="outlined"
              style={styles.codeInput}
              contentStyle={styles.codeInputContent}
              outlineColor={colors.border}
              activeOutlineColor={colors.secondary}
              placeholder="ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            {/* Message d'erreur */}
            {error && (
              <HelperText type="error" visible={true} style={styles.error}>
                {error}
              </HelperText>
            )}
            
            {/* Infos */}
            <View style={styles.infoBox}>
              <Ionicons name="help-circle" size={20} color={colors.secondary} />
              <Text style={styles.infoText}>
                Le code est composé de 6 lettres et chiffres. Il est affiché sur l'écran du projet de ton ami.
              </Text>
            </View>
            
            {/* Bouton de validation */}
            <Button
              mode="contained"
              onPress={handleJoin}
              loading={isLoading}
              disabled={isLoading || inviteCode.length !== 6}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              buttonColor={colors.secondary}
            >
              Rejoindre
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  illustration: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  illustrationIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.secondaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  illustrationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  illustrationSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  codeInput: {
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  codeInputContent: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  error: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondaryLight + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.secondary,
    lineHeight: 18,
  },
  button: {
    borderRadius: borderRadius.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

