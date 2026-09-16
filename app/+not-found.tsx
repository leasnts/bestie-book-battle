/**
 * Écran 404 - Page non trouvée
 * 
 * Affiché quand l'utilisateur navigue vers une route qui n'existe pas.
 */

import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, colors, fonts, spacing } from '../utils/constants';
import { CircleAlertIcon } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oups !' }} />
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <CircleAlertIcon size={64} color={colors.textTertiary} />
        </View>
        <Text style={styles.title}>Page introuvable</Text>
        <Text style={styles.subtitle}>
          Cette page n'existe pas ou a été déplacée.
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>← Retour à l'accueil</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  link: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  linkText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
});
