/**
 * Onglet Clubs (#238) : mes clubs, façon groupes.
 *
 *   Clubs                                 (+)    + : créer un club
 *   ┌────────────────────────────────────────┐
 *   │ (L) Les Liseuses             [cover]   │   toucher : la page du club
 *   │     Fourth Wing · club à 47 %          │
 *   └────────────────────────────────────────┘
 *   [ Rejoindre avec un code ]
 *
 * L'accueil reste « ma lecture » ; ici, le côté groupe. Sans club : de quoi en
 * créer un ou en rejoindre un.
 */

import { useRouter } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import PageTransition from '../../components/PageTransition';
import { CoverImage } from '../../components/ui/BookCover';
import ClubAvatar from '../../components/ui/ClubAvatar';
import GlassButton from '../../components/ui/GlassButton';
import GlassSection from '../../components/ui/GlassSection';
import { useTabBarInset } from '../../components/ui/GlassTabBar';
import { useClubStore } from '../../stores/clubStore';
import { useProjectStore } from '../../stores/projectStore';
import { colors, fonts, spacing } from '../../utils/constants';
import { clubReadings } from '../../utils/clubs';

export default function ClubsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const clubs = useClubStore((s) => s.clubs);
  const challenges = useProjectStore((s) => s.challenges);

  const rows = useMemo(
    () =>
      Object.values(clubs)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((club) => ({ club, current: clubReadings(challenges, club.id).current })),
    [clubs, challenges],
  );

  return (
    <PageTransition>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: tabBarInset + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Clubs
          </Text>
          <GlassButton icon={PlusIcon} onPress={() => router.push('/club-edit')} accessibilityLabel="Créer un club" />
        </View>

        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Lis à plusieurs, livre après livre</Text>
            <Button3D variant="primary" onPress={() => router.push('/club-edit')}>
              Créer un club
            </Button3D>
            <Button3D variant="secondary" onPress={() => router.push('/club-code')}>
              J'ai un code
            </Button3D>
          </View>
        ) : (
          <>
            <View style={styles.list}>
              {rows.map(({ club, current }) => (
                <GlassSection
                  key={club.id}
                  paper
                  onPress={() => router.push(`/club?id=${club.id}`)}
                  accessibilityLabel={`${club.name}${current ? `, ${current.book_title}` : ''}`}
                  accessibilityHint="Ouvre la page du club"
                >
                  <View style={styles.row}>
                    <ClubAvatar club={club} size={52} />
                    <View style={styles.text}>
                      <Text style={styles.name} numberOfLines={1}>
                        {club.name}
                      </Text>
                      <Text style={styles.reading} numberOfLines={1}>
                        {current
                          ? `${current.book_title} · club à ${Math.round(current.average_progress_percentage ?? 0)} %`
                          : 'Pas de lecture en cours'}
                      </Text>
                    </View>
                    {current?.cover_url && <CoverImage uri={current.cover_url} style={styles.cover} />}
                  </View>
                </GlassSection>
              ))}
            </View>
            <View style={styles.join}>
              <Button3D variant="secondary" onPress={() => router.push('/club-code')}>
                Rejoindre avec un code
              </Button3D>
            </View>
          </>
        )}
      </ScrollView>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  // Ferré à gauche : aucun titre centré dans l'app
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  reading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
  cover: {
    width: 38,
    height: 56,
    borderRadius: 2,
  },
  join: {
    marginTop: spacing.xl,
  },
  empty: {
    gap: spacing.md,
    marginTop: spacing['3xl'],
  },
  emptyText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
