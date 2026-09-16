/**
 * BookSection — le cadre « Le livre » de l'accueil.
 *
 * Première question de l'accueil : qu'est-ce qu'on lit, et qu'est-ce qu'on vise.
 * Couverture, titre, autrice, temps restant, la piste du livre, et deux repères
 * chiffrés. Pas une phrase.
 *
 * Tout le cadre s'ouvre d'un toucher : c'est la fiche du livre qui porte les
 * réglages (fin, caps, club), plus aucun menu ⋮ sur l'accueil.
 *
 * Les deux repères du bas :
 * - `Club · 26 % du livre` : la médiane du club sur le livre entier ;
 * - `Cap · 9/38` : combien de membres ont atteint le cap en cours. Un cap se
 *   compte en membres, pas en pourcentage.
 */

import { ChevronRightIcon, FlagIcon, UsersIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Challenge } from '../../types/supabase';
import { colors, fonts, inkAlpha, spacing } from '../../utils/constants';
import { daysLeft, type TrackCap } from '../../utils/track';
import BookCover, { COVER_RATIO, isChallengeDone } from './BookCover';
import GlassSection from './GlassSection';
import GoalTrack from './GoalTrack';

interface BookSectionProps {
  challenge: Challenge;
  /** Médiane du club, 0 à 100 */
  clubPercent: number;
  /** Ma progression, 0 à 100 */
  myPercent: number;
  myPhotoUrl: string | null;
  myInitial: string;
  caps: TrackCap[];
  /** Membres ayant atteint le cap en cours */
  membersAtCap: number;
  /** Membres du club */
  memberCount: number;
  /** Toucher le cadre → la fiche du livre */
  onPress: () => void;
}

export default function BookSection({
  challenge,
  clubPercent,
  myPercent,
  myPhotoUrl,
  myInitial,
  caps,
  membersAtCap,
  memberCount,
  onPress,
}: BookSectionProps) {
  const remaining = daysLeft(challenge.target_end_date);
  const hasCurrentCap = caps.some((cap) => cap.state === 'current');

  return (
    <GlassSection
      onPress={onPress}
      accessibilityLabel={`${challenge.book_title}, ${challenge.book_author ?? 'autrice inconnue'}`}
      accessibilityHint="Ouvre la fiche du livre"
    >
      <View style={styles.head}>
        <View style={styles.cover}>
          <BookCover coverUrl={challenge.cover_url} done={isChallengeDone(challenge)} />
        </View>

        <View style={styles.texts}>
          {/* Le temps restant, ou « Prolongations » quand la date est passée —
              un constat, jamais un reproche. */}
          {remaining !== null && (
            <Text style={styles.tag}>{remaining >= 0 ? `J-${remaining}` : 'Prolongations'}</Text>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {challenge.book_title}
          </Text>
          {!!challenge.book_author && (
            <Text style={styles.author} numberOfLines={1}>
              {challenge.book_author}
            </Text>
          )}
        </View>

        <ChevronRightIcon size={18} color={colors.textPlaceholder} strokeWidth={2} />
      </View>

      <View style={styles.track}>
        <GoalTrack
          clubPercent={clubPercent}
          myPercent={myPercent}
          myPhotoUrl={myPhotoUrl}
          myInitial={myInitial}
          caps={caps}
          endDate={challenge.target_end_date}
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <UsersIcon size={14} color={colors.textTertiary} strokeWidth={2} />
          <Text style={styles.statText}>
            Club · <Text style={styles.statValue}>{Math.round(clubPercent)} %</Text> du livre
          </Text>
        </View>

        {hasCurrentCap && (
          <View style={styles.stat}>
            <FlagIcon size={14} color={colors.textTertiary} strokeWidth={2} />
            <Text style={styles.statText}>
              Cap ·{' '}
              <Text style={styles.statValue}>
                {membersAtCap}/{memberCount}
              </Text>
            </Text>
          </View>
        )}
      </View>
    </GlassSection>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

const COVER_WIDTH = 54;

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  // BookCover remplit son parent : sans hauteur imposée, il s'étirerait sur
  // toute la hauteur du cadre.
  cover: {
    width: COVER_WIDTH,
    aspectRatio: COVER_RATIO,
  },
  texts: {
    flex: 1,
  },
  tag: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
    marginTop: 2,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 1,
  },

  track: {
    marginTop: spacing.lg,
  },

  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: inkAlpha(0.09),
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  statValue: {
    fontFamily: fonts.bodyExtraBold,
    color: colors.textPrimary,
  },
});
