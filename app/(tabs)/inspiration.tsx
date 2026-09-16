/**
 * Onglet Inspiration — recherche de livres et idées de lecture.
 *
 * Écran d'attente pour l'instant : l'onglet existe dans la barre, son
 * contenu reste à concevoir (issue #37 du BBB Roadmap).
 * Même structure que l'accueil et le profil : fond crème texturé, titre centré.
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageTransition from '../../components/PageTransition';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import { colors, fonts, spacing } from '../../utils/constants';
import { SparklesIcon } from 'lucide-react-native';

const TEXTURE_IMAGE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

export default function InspirationScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();

  return (
    <PageTransition>
      <View style={styles.container}>
        <Image source={TEXTURE_IMAGE} style={styles.backgroundTexture} contentFit="cover" />

        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Inspiration
          </Text>
        </View>

        <View style={[styles.emptyState, { paddingBottom: tabBarInset + spacing['2xl'] }]}>
          <SparklesIcon size={56} color={colors.textPlaceholder} />
          <Text style={styles.emptyTitle}>Ta prochaine lecture t'attend ici</Text>
          <Text style={styles.emptySubtitle}>
            Chercher un livre, piocher des idées pour ton club : ça arrive bientôt.
          </Text>
        </View>
      </View>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  backgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    marginTop: spacing.sm,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textTertiary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
