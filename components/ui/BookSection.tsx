/**
 * BookSection — le cadre « Le livre » de l'accueil.
 *
 * Première question de l'accueil : qu'est-ce qu'on lit, et qu'est-ce qu'on vise.
 * La couverture à gauche ; à droite, le titre, l'autrice, puis la piste du livre.
 * Sous la piste, sur la ligne de la date de fin, où en est le club (`👥 26 %`,
 * la médiane du club sur le livre entier). Pas une phrase.
 *
 * Plus de « J-19 » / « Prolongations » au-dessus du titre (Lea, 2026-09-24) : la
 * date de fin est déjà sous la piste.
 *
 * Plus de ligne de repères en bas (« Club · 26 % du livre », « Cap · 9/38 ») :
 * l'accueil doit tenir sans défiler. Le nombre de membres au cap reste dans la
 * fiche du livre.
 *
 * Tout le cadre s'ouvre d'un toucher : c'est la fiche du livre qui porte les
 * réglages (fin, caps, club), plus aucun menu ⋮ sur l'accueil.
 */

import { UsersIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Challenge } from '../../types/supabase';
import { colors, fonts, spacing } from '../../utils/constants';
import type { TrackCap } from '../../utils/track';
import BookCover, { COVER_RATIO, isChallengeDone } from './BookCover';
import GlassSection from './GlassSection';
import GoalTrack from './GoalTrack';

interface BookSectionProps {
  challenge: Challenge;
  /** La couverture de mon édition, sinon celle du bbb */
  coverUrl: string | null;
  /** Médiane du club, 0 à 100 */
  clubPercent: number;
  /** Ma progression, 0 à 100 */
  myPercent: number;
  myPhotoUrl: string | null;
  myInitial: string;
  caps: TrackCap[];
  /** Petit écran : marges resserrées, pour que l'accueil tienne sans défiler */
  compact?: boolean;
  /** Toucher le cadre → la fiche du livre */
  onPress: () => void;
}

export default function BookSection({
  challenge,
  coverUrl,
  clubPercent,
  myPercent,
  myPhotoUrl,
  myInitial,
  caps,
  compact = false,
  onPress,
}: BookSectionProps) {
  // La couverture prend toujours la hauteur du texte à côté d'elle (titre sur
  // une ou deux lignes, texte agrandi…) : on la mesure.
  const [textsHeight, setTextsHeight] = useState(0);
  return (
    <GlassSection
      compact={compact}
      onPress={onPress}
      accessibilityLabel={`${challenge.book_title}, ${challenge.book_author ?? 'autrice inconnue'}`}
      accessibilityHint="Ouvre la fiche du livre"
    >
      <View style={styles.head}>
        <View
          style={[
            styles.cover,
            textsHeight > 0 && { width: textsHeight * COVER_RATIO, height: textsHeight },
          ]}
        >
          <BookCover coverUrl={coverUrl} done={isChallengeDone(challenge)} />
        </View>

        <View style={styles.texts} onLayout={(e) => setTextsHeight(e.nativeEvent.layout.height)}>
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

          {/* La piste sous l'autrice ; le club sur la ligne de la date de fin */}
          <View style={styles.track}>
            <GoalTrack
              clubPercent={clubPercent}
              myPercent={myPercent}
              myPhotoUrl={myPhotoUrl}
              myInitial={myInitial}
              caps={caps}
              endDate={challenge.target_end_date}
              leadingLabel={
                // Déjà lu par VoiceOver dans la phrase de la piste
                <View style={styles.club} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                  <UsersIcon size={14} color={colors.textTertiary} strokeWidth={2} />
                  <Text style={styles.clubText} maxFontSizeMultiplier={1.3}>
                    {Math.round(clubPercent)} %
                  </Text>
                </View>
              }
            />
          </View>
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
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 1,
  },

  track: {
    marginTop: spacing.sm,
  },
  club: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clubText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
