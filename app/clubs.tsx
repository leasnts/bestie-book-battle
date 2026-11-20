/**
 * Route /clubs — mes clubs, pour changer de club (#238).
 *
 * Ouvert par le rond du club, à droite de la bibliothèque sur l'accueil.
 *
 *   ┌──────────────────────────────────┐
 *   │ (L) Les Liseuses              ›  │  le club de l'accueil, brodé
 *   │     Fourth Wing · 47 %           │
 *   └──────────────────────────────────┘
 *
 * Toucher un club met sa lecture en cours sur l'accueil et ferme ; la flèche
 * ouvre la page du club. Mêmes lignes que les choix de l'onboarding
 * (OptionList) : papier au repos, broderie sur celle de l'accueil.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EDGE, PAPER, PAPER_ON, RING_ON, STITCH_INSET, STITCH_ON, STITCH_WEIGHT } from '../components/onboarding/OptionList';
import ClubAvatar from '../components/ui/ClubAvatar';
import PressableScale from '../components/ui/PressableScale';
import SheetPage from '../components/ui/SheetPage';
import { StitchBorder } from '../components/ui/Stitch';
import { useClubStore } from '../stores/clubStore';
import { useProjectStore } from '../stores/projectStore';
import { borderRadius, colors, fonts, spacing } from '../utils/constants';
import { clubReadings } from '../utils/clubs';
import { feel } from '../utils/feel';

const RADIUS = borderRadius.xl;

export default function ClubsRoute() {
  const router = useRouter();
  const clubs = useClubStore((s) => s.clubs);
  const challenges = useProjectStore((s) => s.challenges);
  const activeClubId = useProjectStore((s) => s.activeChallenge?.club_id ?? null);
  const setActiveChallenge = useProjectStore((s) => s.setActiveChallenge);

  // Mes clubs, chacun avec sa lecture en cours ; le plus récent d'abord
  const rows = useMemo(
    () =>
      Object.values(clubs)
        .map((club) => ({ club, current: clubReadings(challenges, club.id).current }))
        .sort((a, b) => b.club.created_at.localeCompare(a.club.created_at)),
    [clubs, challenges],
  );

  return (
    <SheetPage title="Mes clubs" accent="clubs">
      <View style={styles.list}>
        {rows.map(({ club, current }) => {
          const on = club.id === activeClubId;
          return (
            <View key={club.id} style={styles.row}>
              <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
                <LinearGradient colors={on ? PAPER_ON : PAPER} style={StyleSheet.absoluteFill} />
                <View style={[styles.ring, on ? styles.ringOn : styles.ringIdle]} />
                {on && <StitchBorder radius={RADIUS} inset={STITCH_INSET} color={STITCH_ON} weight={STITCH_WEIGHT} />}
              </View>
              <PressableScale
                style={styles.main}
                pressedScale={0.98}
                disabled={!current}
                onPress={() => {
                  if (!current) return;
                  feel('tic');
                  setActiveChallenge(current);
                  router.back();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${club.name}${current ? `, ${current.book_title}` : ''}`}
                accessibilityHint={current ? "Met sa lecture sur l'accueil" : undefined}
              >
                <ClubAvatar club={club} size={40} />
                <View style={styles.text}>
                  <Text style={styles.name} numberOfLines={1}>
                    {club.name}
                  </Text>
                  {current && (
                    <Text style={styles.reading} numberOfLines={1}>
                      {current.book_title} · {Math.round(current.average_progress_percentage ?? 0)} %
                    </Text>
                  )}
                </View>
              </PressableScale>
              <PressableScale
                style={styles.open}
                pressedScale={0.9}
                onPress={() => router.push(`/club?id=${club.id}&from=clubs`)}
                accessibilityRole="button"
                accessibilityLabel={`Page du club ${club.name}`}
              >
                <ChevronRightIcon size={20} color={colors.textTertiary} strokeWidth={2.2} />
              </PressableScale>
            </View>
          );
        })}
      </View>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    borderRadius: RADIUS,
  },
  clip: {
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADIUS,
    borderWidth: 1,
  },
  ringIdle: {
    borderColor: EDGE,
  },
  ringOn: {
    borderColor: RING_ON,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  reading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
  open: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
});
