/**
 * BookSection — le cadre « Le livre » de l'accueil.
 *
 * Première question de l'accueil : qu'est-ce qu'on lit, et qu'est-ce qu'on vise.
 * Couverture, titre, autrice, temps restant, et la piste du livre avec, à sa
 * droite, où en est le club (`👥 26 %`, la médiane du club sur le livre entier).
 * Pas une phrase.
 *
 * Plus de ligne de repères en bas (« Club · 26 % du livre », « Cap · 9/38 ») :
 * l'accueil doit tenir sans défiler. Le nombre de membres au cap reste dans la
 * fiche du livre.
 *
 * Tout le cadre s'ouvre d'un toucher : c'est la fiche du livre qui porte les
 * réglages (fin, caps, club), plus aucun menu ⋮ sur l'accueil.
 */

import { ChevronRightIcon, UsersIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Challenge } from '../../types/supabase';
import { colors, fonts, spacing } from '../../utils/constants';
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
  onPress,
}: BookSectionProps) {
  const remaining = daysLeft(challenge.target_end_date);

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
          {/* Deux lignes : aux gros corps de texte, « Les nuits blanches » ne
              doit pas se réduire à « Les nu… ». */}
          <Text style={styles.title} numberOfLines={2}>
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

      {/* La piste, et à sa droite où en est le club */}
      <View style={styles.track}>
        <View style={styles.trackLine}>
          <GoalTrack
            clubPercent={clubPercent}
            myPercent={myPercent}
            myPhotoUrl={myPhotoUrl}
            myInitial={myInitial}
            caps={caps}
            endDate={challenge.target_end_date}
          />
        </View>
        {/* Déjà lu par VoiceOver dans la phrase de la piste */}
        <View style={styles.club} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <UsersIcon size={14} color={colors.textTertiary} strokeWidth={2} />
          <Text style={styles.clubText} maxFontSizeMultiplier={1.3}>
            {Math.round(clubPercent)} %
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  trackLine: {
    flex: 1,
  },
  // Même hauteur que la piste (28 pt) : le % est centré sur la barre
  club: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clubText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 14,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
